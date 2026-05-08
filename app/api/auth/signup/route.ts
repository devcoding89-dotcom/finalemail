import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const { email, password, full_name } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      )
    }

    // Create user using admin client to auto-confirm
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This bypasses the verification email
      user_metadata: {
        full_name,
      },
    })

    if (authError) {
      return NextResponse.json(
        { success: false, error: authError.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Account created and confirmed successfully',
    })
  } catch (error: any) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
