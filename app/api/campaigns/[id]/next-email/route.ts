import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: campaignId } = await params

    // Fetch campaign and template
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('*, templates(*)')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Fetch contacts for this campaign's list, ordered by id or created_at
    // We get all valid contacts to apply the offset
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('list_id', campaign.list_id)
      .not('status', 'in', '("invalid","bounced")')
      .order('created_at', { ascending: true })

    if (!contacts || contacts.length === 0) {
      return NextResponse.json({ success: true, hasMore: false })
    }

    const currentIndex = campaign.current_index || 0

    if (currentIndex >= contacts.length) {
      return NextResponse.json({ success: true, hasMore: false })
    }

    const contact = contacts[currentIndex]
    const template = campaign.templates as any

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
      
    // Convert plain text to HTML for Gmail's rich text editor
    const bodyHtml = personalizedBody.replace(/\n/g, '<br>')

    return NextResponse.json({
      success: true,
      hasMore: true,
      data: {
        contact: {
          id: contact.id,
          email: contact.email,
          name: contactName,
          company: contactCompany
        },
        personalized: {
          subject: personalizedSubject,
          body: bodyHtml
        }
      }
    })
  } catch (error) {
    console.error('Next email error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
