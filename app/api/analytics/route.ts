import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse } from '@/types'

export async function GET() {
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

    // 1. Fetch summary stats
    const { data: profile } = await supabase
      .from('profiles')
      .select('emails_sent_today, daily_limit')
      .eq('id', user.id)
      .single()

    // 2. Fetch all campaigns performance
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, name, total_emails, sent_count, open_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 3. Fetch summary of logs
    const { count: totalSentCount } = await supabase
      .from('email_logs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'sent')
      // This is slightly complex without a direct join, but we can rely on campaign sent_counts
    
    let chartData: any[] = []
    if (campaigns && campaigns.length > 0) {
      // Map last 7 campaigns to chart data
      chartData = [...campaigns].slice(0, 7).reverse().map(c => ({
        name: c.name.length > 12 ? c.name.substring(0, 10) + '...' : c.name,
        sent: c.sent_count,
        total: c.total_emails
      }))
    }

    return NextResponse.json({
      success: true,
      data: {
        profile,
        campaigns: campaigns || [],
        chartData
      }
    } satisfies ApiResponse)
  } catch (error) {
    console.error('Analytics API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch analytics' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}
