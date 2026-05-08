import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { id: campaignId } = await params
    const body = await request.json()
    const { contactId, method = 'auto_scout' } = body

    if (!contactId) {
      return NextResponse.json({ success: false, error: 'contactId is required' }, { status: 400 })
    }

    // Get campaign to update counts
    const { data: campaign } = await supabase
      .from('campaigns')
      .select('sent_count, current_index')
      .eq('id', campaignId)
      .single()

    if (!campaign) {
      return NextResponse.json({ success: false, error: 'Campaign not found' }, { status: 404 })
    }

    // Log the email as sent
    await supabase.from('email_logs').insert({
      campaign_id: campaignId,
      contact_id: contactId,
      status: 'sent',
      send_method: method,
      sent_at: new Date().toISOString(),
    })

    // Increment campaign counts
    await supabase
      .from('campaigns')
      .update({
        sent_count: (campaign.sent_count || 0) + 1,
        current_index: (campaign.current_index || 0) + 1,
        status: 'active',
      })
      .eq('id', campaignId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Mark sent error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}
