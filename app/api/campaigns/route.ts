import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Campaign } from '@/types'

// GET /api/campaigns — fetch all campaigns
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

    const { data: campaigns, error } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } satisfies ApiResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: campaigns,
    } satisfies ApiResponse<Campaign[]>)
  } catch (error) {
    console.error('Campaigns fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch campaigns' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}

// POST /api/campaigns — create a new campaign
export async function POST(request: NextRequest) {
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

    const body = (await request.json()) as {
      name: string
      list_id: string
      template_id: string
    }

    if (!body.name || !body.list_id || !body.template_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, list_id, and template_id are required',
        } satisfies ApiResponse,
        { status: 400 }
      )
    }

    // Get contact count for this list
    const { count } = await supabase
      .from('contacts')
      .select('*', { count: 'exact', head: true })
      .eq('list_id', body.list_id)
      .not('status', 'in', '("invalid","bounced")')

    const { data: campaign, error } = await supabase
      .from('campaigns')
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        list_id: body.list_id,
        template_id: body.template_id,
        total_count: count || 0,
        sent_count: 0,
        current_index: 0,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } satisfies ApiResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: campaign,
    } satisfies ApiResponse<Campaign>)
  } catch (error) {
    console.error('Campaign create error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create campaign' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}

// DELETE /api/campaigns?id=xxx — delete a campaign
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id')
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' } satisfies ApiResponse,
        { status: 400 }
      )
    }

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

    const { error } = await supabase
      .from('campaigns')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } satisfies ApiResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: null,
    } satisfies ApiResponse)
  } catch (error) {
    console.error('Campaign delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete campaign' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}
