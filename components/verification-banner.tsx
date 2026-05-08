'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock, CheckCircle2, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'

interface VerificationBannerProps {
  emailVerified: boolean
  userEmail: string
}

export function VerificationBanner({
  emailVerified,
  userEmail,
}: VerificationBannerProps) {
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const supabase = createClient()

  if (emailVerified) return null

  const handleResend = async () => {
    if (cooldown > 0) return

    setResending(true)
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      })

      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Verification email sent! Check your inbox.')
        // Start 60s cooldown
        setCooldown(60)
        const interval = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(interval)
              return 0
            }
            return prev - 1
          })
        }, 1000)
      }
    } catch {
      toast.error('Failed to send verification email')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 rounded-lg px-4 py-3 mb-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-red-100 dark:bg-red-900/50 p-1.5">
            <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">
              Verify your email to start sending
            </p>
            <p className="text-xs text-red-600/70 dark:text-red-400/70">
              Check <strong>{userEmail}</strong> for a verification link
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="shrink-0 border-red-300 text-red-700 hover:bg-red-100 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/50"
        >
          {resending ? (
            <RefreshCw className="mr-1.5 h-3 w-3 animate-spin" />
          ) : cooldown > 0 ? (
            <Clock className="mr-1.5 h-3 w-3" />
          ) : (
            <Mail className="mr-1.5 h-3 w-3" />
          )}
          {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}
        </Button>
      </div>
    </div>
  )
}

// Small badge for user nav
export function VerificationBadge({
  verified,
}: {
  verified: boolean
}) {
  if (verified) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-3 w-3" />
        Verified
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 text-[10px] text-red-500 dark:text-red-400">
      <AlertCircle className="h-3 w-3" />
      Unverified
    </span>
  )
}
