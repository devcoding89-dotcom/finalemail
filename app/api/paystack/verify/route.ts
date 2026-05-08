import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyPayment } from '@/lib/paystack'
import type { ApiResponse } from '@/types'

/**
 * GET /api/paystack/verify?reference=xxx
 * Verify a Paystack payment and upgrade user to premium.
 */
export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference')

    if (!reference) {
      return NextResponse.json(
        { success: false, error: 'Payment reference required' } satisfies ApiResponse,
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

    // Verify payment with Paystack
    const result = await verifyPayment(reference)

    if (!result.status || result.data.status !== 'success') {
      console.error('[Paystack Route] Verification failed. Paystack Status:', result.data?.status, 'Message:', result.message)
      return NextResponse.json(
        {
          success: false,
          error: `Payment verification failed (${result.data?.status || 'no_status'}). Reference: ${reference}`,
        } satisfies ApiResponse,
        { status: 400 }
      )
    }

    console.log('[Paystack Route] Payment verified successfully for reference:', reference)

    // Verify amount is ₦500 (50000 kobo)
    if (result.data.amount < 50000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid payment amount',
        } satisfies ApiResponse,
        { status: 400 }
      )
    }

    // Calculate expiry: 30 days from now
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    // Upgrade user to premium
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        plan: 'premium',
        plan_expires_at: expiresAt.toISOString(),
        daily_limit: 999999, // Effectively unlimited
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Profile update error:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: 'Payment successful but failed to upgrade. Contact support with reference: ' + reference,
        } satisfies ApiResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        plan: 'premium',
        expires_at: expiresAt.toISOString(),
        reference,
      },
    } satisfies ApiResponse<{
      plan: string
      expires_at: string
      reference: string
    }>)
  } catch (error) {
    console.error('Paystack verify error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Payment verification failed',
      } satisfies ApiResponse,
      { status: 500 }
    )
  }
}
