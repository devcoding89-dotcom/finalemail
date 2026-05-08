import { NextResponse } from 'next/server'

export async function GET() {
  const secretKey = process.env.PAYSTACK_SECRET_KEY
  const publicKey = process.env.PAYSTACK_PUBLIC_KEY
  
  const status = {
    env: {
      hasSecretKey: !!secretKey,
      secretKeyPrefix: secretKey ? secretKey.substring(0, 7) + '...' : 'MISSING',
      hasPublicKey: !!publicKey,
      publicKeyPrefix: publicKey ? publicKey.substring(0, 7) + '...' : 'MISSING',
    },
    connectivity: 'Checking...',
    timestamp: new Date().toISOString()
  }

  try {
    if (secretKey) {
      const res = await fetch('https://api.paystack.co/decision/bin/600000', {
        headers: { Authorization: `Bearer ${secretKey}` }
      })
      status.connectivity = res.ok ? 'REACHABLE (200 OK)' : `FAILED (${res.status})`
    } else {
      status.connectivity = 'SKIPPED (No Secret Key)'
    }
  } catch (err: any) {
    status.connectivity = 'ERROR: ' + err.message
  }

  return NextResponse.json(status)
}
