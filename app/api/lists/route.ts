import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, EmailList } from '@/types'

// GET /api/lists — fetch all email lists for the current user
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

    const { data: lists, error } = await supabase
      .from('email_lists')
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
      data: lists,
    } satisfies ApiResponse<EmailList[]>)
  } catch (error) {
    console.error('Lists fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch lists' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}

// DELETE /api/lists — delete an email list
export async function DELETE(request: NextRequest) {
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

    const { id } = (await request.json()) as { id: string }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'List ID required' } satisfies ApiResponse,
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('email_lists')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } satisfies ApiResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true } satisfies ApiResponse)
  } catch (error) {
    console.error('List delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete list' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}
