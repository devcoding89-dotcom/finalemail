import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import Papa from 'papaparse'
import {
  validateEmail,
  cleanEmail,
  guessNameFromEmail,
  guessCompanyFromEmail,
  findEmailColumn,
  findNameColumn,
  findCompanyColumn,
} from '@/lib/email-utils'
import { extractContactInfo } from '@/lib/openai'
import type { ApiResponse, UploadResult, CsvRow } from '@/types'

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' } satisfies ApiResponse,
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const listName = (formData.get('listName') as string) || 'Untitled List'
    const useAI = formData.get('useAI') === 'true'

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' } satisfies ApiResponse,
        { status: 400 }
      )
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && !file.type.includes('csv')) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only CSV files are supported',
        } satisfies ApiResponse,
        { status: 400 }
      )
    }

    // Read file content
    const text = await file.text()

    // Parse CSV with PapaParse
    const parseResult = Papa.parse<CsvRow>(text, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    })

    if (parseResult.errors.length > 0 && parseResult.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `CSV parsing failed: ${parseResult.errors[0]?.message}`,
        } satisfies ApiResponse,
        { status: 400 }
      )
    }

    const rows = parseResult.data
    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'CSV file is empty' } satisfies ApiResponse,
        { status: 400 }
      )
    }

    // Find relevant columns
    const headers = parseResult.meta.fields || []
    const emailCol = findEmailColumn(headers)

    if (!emailCol) {
      return NextResponse.json(
        {
          success: false,
          error:
            'No email column found. Make sure your CSV has a column named "email", "Email", or "e-mail".',
        } satisfies ApiResponse,
        { status: 400 }
      )
    }

    const nameCol = findNameColumn(headers)
    const companyCol = findCompanyColumn(headers)

    // Process contacts
    const contacts: {
      email: string
      name: string | null
      company: string | null
      isValid: boolean
    }[] = []

    const seenEmails = new Set<string>()

    for (const row of rows) {
      const rawEmail = row[emailCol]
      if (!rawEmail) continue

      const email = cleanEmail(rawEmail)

      // Skip duplicates
      if (seenEmails.has(email)) continue
      seenEmails.add(email)

      const isValid = validateEmail(email)

      // Get name from CSV column or guess from email
      let name: string | null = null
      if (nameCol && row[nameCol]) {
        name = row[nameCol].trim()
      } else {
        name = guessNameFromEmail(email)
      }

      // Get company from CSV column or guess from domain
      let company: string | null = null
      if (companyCol && row[companyCol]) {
        company = row[companyCol].trim()
      } else {
        company = guessCompanyFromEmail(email)
      }

      contacts.push({ email, name, company, isValid })
    }

    // AI extraction for contacts missing name/company
    if (useAI) {
      const emailsNeedingAI = contacts
        .filter((c) => c.isValid && (!c.name || !c.company))
        .map((c) => c.email)

      if (emailsNeedingAI.length > 0) {
        const aiResults = await extractContactInfo(emailsNeedingAI)

        for (const aiResult of aiResults) {
          const contact = contacts.find((c) => c.email === aiResult.email)
          if (contact) {
            if (!contact.name && aiResult.name) contact.name = aiResult.name
            if (!contact.company && aiResult.company)
              contact.company = aiResult.company
          }
        }
      }
    }

    const validContacts = contacts.filter((c) => c.isValid)
    const invalidContacts = contacts.filter((c) => !c.isValid)

    // Create list in Supabase (email_lists table)
    const { data: list, error: listError } = await supabase
      .from('email_lists')
      .insert({
        user_id: user.id,
        name: listName,
        total_contacts: contacts.length,
      })
      .select()
      .single()

    if (listError) {
      console.error('List creation error:', listError)
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create contact list',
        } satisfies ApiResponse,
        { status: 500 }
      )
    }

    // Insert contacts in batches of 500
    const batchSize = 500
    for (let i = 0; i < contacts.length; i += batchSize) {
      const batch = contacts.slice(i, i + batchSize).map((c) => ({
        list_id: list.id,
        email: c.email,
        name: c.name,
        company: c.company,
        status: c.isValid ? 'valid' : 'invalid',
      }))

      const { error: insertError } = await supabase
        .from('contacts')
        .insert(batch)

      if (insertError) {
        console.error('Contact insert error:', insertError)
      }
    }

    const result: UploadResult = {
      listId: list.id,
      listName: list.name,
      totalContacts: contacts.length,
      validContacts: validContacts.length,
      invalidContacts: invalidContacts.length,
      contacts,
    }

    return NextResponse.json({
      success: true,
      data: result,
    } satisfies ApiResponse<UploadResult>)
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during upload',
      } satisfies ApiResponse,
      { status: 500 }
    )
  }
}
