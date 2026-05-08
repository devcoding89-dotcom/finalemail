import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Contact } from '@/types'

// GET /api/contacts?listId=xxx — fetch contacts for a list
export async function GET(request: NextRequest) {
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

    const listId = request.nextUrl.searchParams.get('listId')

    if (!listId) {
      return NextResponse.json(
        { success: false, error: 'listId parameter required' } satisfies ApiResponse,
        { status: 400 }
      )
    }

    // Verify the list belongs to this user
    const { data: list } = await supabase
      .from('email_lists')
      .select('id')
      .eq('id', listId)
      .eq('user_id', user.id)
      .single()

    if (!list) {
      return NextResponse.json(
        { success: false, error: 'List not found' } satisfies ApiResponse,
        { status: 404 }
      )
    }

    const { data: contacts, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message } satisfies ApiResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: contacts,
    } satisfies ApiResponse<Contact[]>)
  } catch (error) {
    console.error('Contacts fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch contacts' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}
