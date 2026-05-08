import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { initializePayment } from '@/lib/paystack'
import type { ApiResponse } from '@/types'

/**
 * POST /api/paystack/initialize
 * Start a ₦500/month payment for premium plan upgrade.
 */
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

    // Capture origin for callback URL
    const origin = request.nextUrl.origin

    // Check if already premium
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, plan_expires_at')
      .eq('id', user.id)
      .single()

    if (profile?.plan === 'premium' && profile?.plan_expires_at) {
      const expiresAt = new Date(profile.plan_expires_at)
      if (expiresAt > new Date()) {
        return NextResponse.json(
          {
            success: false,
            error: `You're already on Premium! Expires ${expiresAt.toLocaleDateString()}.`,
          } satisfies ApiResponse,
          { status: 400 }
        )
      }
    }

    // Initialize Paystack payment
    const result = await initializePayment(user.email!, user.id, origin)

    if (!result.status) {
      console.error('[Paystack Route] Initialization failed:', result.message)
      return NextResponse.json(
        {
          success: false,
          error: result.message || 'Failed to initialize payment',
        } satisfies ApiResponse,
        { status: 500 }
      )
    }

    console.log('[Paystack Route] Successfully initialized:', result.data.reference)

    return NextResponse.json({
      success: true,
      data: {
        authorization_url: result.data.authorization_url,
        reference: result.data.reference,
      },
    } satisfies ApiResponse<{
      authorization_url: string
      reference: string
    }>)
  } catch (error: any) {
    console.error('Paystack init error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to initialize payment',
      } satisfies ApiResponse,
      { status: 500 }
    )
  }
}
