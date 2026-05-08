import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { validateWebhookSignature } from '@/lib/paystack'

/**
 * POST /api/paystack/webhook
 * Handle Paystack webhook events (charge.success, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-paystack-signature') || ''

    // Validate webhook signature
    if (!validateWebhookSignature(body, signature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const event = JSON.parse(body) as {
      event: string
      data: {
        status: string
        reference: string
        amount: number
        metadata: {
          user_id: string
          plan: string
        }
        customer: {
          email: string
        }
      }
    }

    // Handle successful charge
    if (event.event === 'charge.success' && event.data.status === 'success') {
      const userId = event.data.metadata?.user_id

      if (userId && event.data.amount >= 50000) {
        const expiresAt = new Date()
        expiresAt.setDate(expiresAt.getDate() + 30)

        // Use admin client to bypass RLS
        await supabaseAdmin
          .from('profiles')
          .update({
            plan: 'premium',
            plan_expires_at: expiresAt.toISOString(),
            daily_limit: 999999,
          })
          .eq('id', userId)

        console.log(`User ${userId} upgraded to premium via webhook`)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 })
  }
}
