import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

interface SendResult {
  mailtoLink: string
  contactEmail: string
  contactName: string | null
  personalizedSubject: string
  personalizedBody: string
}

/**
 * POST /api/campaigns/[id]/send
 *
 * Generate a mailto link for a specific contact in a campaign.
 * Replaces {name}, {company}, {email} merge tags with actual values.
 * Logs the email as "opened" and increments daily counter.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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

    // Block unverified users
    if (!user.email_confirmed_at) {
      return NextResponse.json(
        {
          success: false,
          error: 'Please verify your email before sending campaigns.',
        } satisfies ApiResponse,
        { status: 403 }
      )
    }

    const { id: campaignId } = await params
    const body = (await request.json()) as { contactId: string }

    if (!body.contactId) {
      return NextResponse.json(
        { success: false, error: 'contactId is required' } satisfies ApiResponse,
        { status: 400 }
      )
    }

    // Check daily limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('emails_sent_today, daily_limit, plan')
      .eq('id', user.id)
      .single()

    if (profile && profile.plan === 'free' && profile.emails_sent_today >= profile.daily_limit) {
      return NextResponse.json(
        {
          success: false,
          error: `Daily limit reached (${profile.daily_limit} emails). Upgrade to Premium for unlimited sending.`,
        } satisfies ApiResponse,
        { status: 429 }
      )
    }

    // Get campaign with template
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*, templates(*)')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (!campaign) {
      return NextResponse.json(
        { success: false, error: 'Campaign not found' } satisfies ApiResponse,
        { status: 404 }
      )
    }

    // Get contact
    const { data: contact } = await supabase
      .from('contacts')
      .select('*')
      .eq('id', body.contactId)
      .single()

    if (!contact) {
      return NextResponse.json(
        { success: false, error: 'Contact not found' } satisfies ApiResponse,
        { status: 404 }
      )
    }

    // Personalize template — replace merge tags
    const template = campaign.templates as { subject: string; body: string }
    const contactName = contact.name || 'there'
    const contactCompany = contact.company || 'your company'

    const personalizedSubject = template.subject
      .replace(/\{name\}/gi, contactName)
      .replace(/\{company\}/gi, contactCompany)
      .replace(/\{email\}/gi, contact.email)

    const personalizedBody = template.body
      .replace(/\{name\}/gi, contactName)
      .replace(/\{company\}/gi, contactCompany)
      .replace(/\{email\}/gi, contact.email)

    // Generate mailto link
    const mailtoLink = `mailto:${encodeURIComponent(contact.email)}?subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedBody)}`

    // Log the email as "opened" (user opened the send dialog)
    await supabase.from('email_logs').insert({
      campaign_id: campaignId,
      contact_id: body.contactId,
      status: 'opened',
      opened_at: new Date().toISOString(),
    })

    // Increment daily email counter
    await supabase
      .from('profiles')
      .update({ emails_sent_today: (profile?.emails_sent_today || 0) + 1 })
      .eq('id', user.id)

    // Increment campaign sent count
    await supabase
      .from('campaigns')
      .update({
        sent_count: (campaign.sent_count || 0) + 1,
        status: 'active',
      })
      .eq('id', campaignId)

    const result: SendResult = {
      mailtoLink,
      contactEmail: contact.email,
      contactName: contact.name,
      personalizedSubject,
      personalizedBody,
    }

    return NextResponse.json({
      success: true,
      data: result,
    } satisfies ApiResponse<SendResult>)
  } catch (error) {
    console.error('Send error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate send link' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}
