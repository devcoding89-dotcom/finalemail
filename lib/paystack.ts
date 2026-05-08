// Paystack API integration for ₦500/month premium plan

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY!
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

interface PaystackInitResponse {
  status: boolean
  message: string
  data: {
    authorization_url: string
    access_code: string
    reference: string
  }
}

interface PaystackVerifyResponse {
  status: boolean
  message: string
  data: {
    status: string
    reference: string
    amount: number
    currency: string
    customer: {
      email: string
    }
    metadata: Record<string, string>
  }
}

/**
 * Initialize a Paystack transaction for ₦500/month premium subscription.
 */
export async function initializePayment(
  email: string,
  userId: string
): Promise<PaystackInitResponse> {
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    const callbackUrl = `${appUrl}/dashboard/subscribe?verify=true`

    console.log(`[Paystack] Initializing payment for ${email} (${userId})`)
    console.log(`[Paystack] Callback URL: ${callbackUrl}`)

    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY is missing from environment variables')
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: 50000, // ₦500 in kobo (500 × 100)
        currency: 'NGN',
        callback_url: callbackUrl,
        metadata: {
          user_id: userId,
          plan: 'premium',
        },
      }),
    })

    const data = (await response.json()) as PaystackInitResponse
    
    if (!response.ok || !data.status) {
      console.error('[Paystack] Initialization Failed:', data)
      return {
        status: false,
        message: data.message || 'Failed to initialize payment',
        data: data.data || ({} as any)
      }
    }

    console.log('[Paystack] Initialization Successful:', data.data.reference)
    return data
  } catch (error: any) {
    console.error('[Paystack] Initialization Error:', error.message)
    return {
      status: false,
      message: error.message || 'Internal payment error',
      data: {} as any
    }
  }
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function verifyPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
  try {
    console.log(`[Paystack] Verifying transaction: ${reference}`)

    if (!PAYSTACK_SECRET_KEY) {
      throw new Error('PAYSTACK_SECRET_KEY is missing from environment variables')
    }

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    )

    const data = (await response.json()) as PaystackVerifyResponse
    
    if (!response.ok || !data.status) {
      console.error('[Paystack] Verification Failed:', data)
      return {
        status: false,
        message: data.message || 'Failed to verify payment',
        data: data.data || ({} as any)
      }
    }

    console.log('[Paystack] Verification Successful:', data.data.status)
    return data
  } catch (error: any) {
    console.error('[Paystack] Verification Error:', error.message)
    return {
      status: false,
      message: error.message || 'Internal verification error',
      data: {} as any
    }
  }
}

/**
 * Validate Paystack webhook signature.
 */
export function validateWebhookSignature(
  body: string,
  signature: string
): boolean {
  try {
    const crypto = require('crypto') as typeof import('crypto')
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY)
      .update(body)
      .digest('hex')

    return hash === signature
  } catch (error) {
    console.error('[Paystack] Webhook Signature Error:', error)
    return false
  }
}
