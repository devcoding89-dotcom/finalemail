import crypto from 'crypto'

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
  userId: string,
  origin?: string // The current domain to ensure correct callback
): Promise<PaystackInitResponse> {
  try {
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    const appUrl = origin || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
    
    // Ensure no trailing slash on appUrl
    const normalizedAppUrl = appUrl.endsWith('/') ? appUrl.slice(0, -1) : appUrl
    const callbackUrl = `${normalizedAppUrl}/dashboard/subscribe?verify=true`

    console.log(`[Paystack] Initializing for ${email}. Callback: ${callbackUrl}`)

    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not defined in environment')
    }

    const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secretKey.trim()}`,
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

    const data = (await response.json()) as any
    
    if (!response.ok || !data.status) {
      console.error('[Paystack] API Error Detail:', JSON.stringify(data, null, 2))
      return {
        status: false,
        message: data.message || `Paystack error (${response.status})`,
        data: data.data || ({} as any)
      }
    }

    return data as PaystackInitResponse
  } catch (error: any) {
    console.error('[Paystack] Exception:', error.message)
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
    const secretKey = process.env.PAYSTACK_SECRET_KEY

    if (!secretKey) {
      throw new Error('PAYSTACK_SECRET_KEY is not defined in environment')
    }

    const response = await fetch(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${secretKey.trim()}`,
        },
      }
    )

    const data = (await response.json()) as PaystackVerifyResponse
    
    if (!response.ok || !data.status) {
      return {
        status: false,
        message: data.message || 'Verification failed',
        data: data.data || ({} as any)
      }
    }

    return data
  } catch (error: any) {
    console.error('[Paystack] Verification Exception:', error.message)
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
    const secretKey = process.env.PAYSTACK_SECRET_KEY
    if (!secretKey) return false

    const hash = crypto
      .createHmac('sha512', secretKey.trim())
      .update(body)
      .digest('hex')

    return hash === signature
  } catch (error) {
    console.error('[Paystack] Webhook error:', error)
    return false
  }
}
