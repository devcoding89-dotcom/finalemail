import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { ApiResponse, Template } from '@/types'

// GET /api/templates — fetch all user templates
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

    const { data: templates, error } = await supabase
      .from('templates')
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
      data: templates,
    } satisfies ApiResponse<Template[]>)
  } catch (error) {
    console.error('Templates fetch error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch templates' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}

// POST /api/templates — create a new template
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
      subject: string
      body: string
      is_default?: boolean
    }

    if (!body.name || !body.subject || !body.body) {
      return NextResponse.json(
        {
          success: false,
          error: 'Name, subject, and body are required',
        } satisfies ApiResponse,
        { status: 400 }
      )
    }

    const { data: template, error } = await supabase
      .from('templates')
      .insert({
        user_id: user.id,
        name: body.name.trim(),
        subject: body.subject.trim(),
        body: body.body,
        is_default: body.is_default || false,
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
      data: template,
    } satisfies ApiResponse<Template>)
  } catch (error) {
    console.error('Template create error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create template' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}

// DELETE /api/templates — delete a template
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
        { success: false, error: 'Template ID required' } satisfies ApiResponse,
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('templates')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      // Check if it's a foreign key constraint error (code 23503)
      if (error.code === '23503') {
        return NextResponse.json(
          { 
            success: false, 
            error: 'This template cannot be deleted because it is currently used in a campaign. Delete the campaign first.' 
          } satisfies ApiResponse,
          { status: 400 }
        )
      }
      return NextResponse.json(
        { success: false, error: error.message } satisfies ApiResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true } satisfies ApiResponse)
  } catch (error) {
    console.error('Template delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete template' } satisfies ApiResponse,
      { status: 500 }
    )
  }
}
