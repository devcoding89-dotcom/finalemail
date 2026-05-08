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
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')}/dashboard/subscribe?verify=true`,
      metadata: {
        user_id: userId,
        plan: 'premium',
      },
    }),
  })

  const data = (await response.json()) as PaystackInitResponse
  return data
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function verifyPayment(
  reference: string
): Promise<PaystackVerifyResponse> {
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
  return data
}

/**
 * Validate Paystack webhook signature.
 */
export function validateWebhookSignature(
  body: string,
  signature: string
): boolean {
  const crypto = require('crypto') as typeof import('crypto')
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(body)
    .digest('hex')

  return hash === signature
}
