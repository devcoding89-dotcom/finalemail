'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import {
  Crown,
  Check,
  Zap,
  Mail,
  Users,
  FileText,
  Shield,
  RefreshCw,
  ExternalLink,
  LogOut,
  Star,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'

export default function SubscribePage() {
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Handle Paystack callback — verify payment
  useEffect(() => {
    const verify = searchParams.get('verify')
    const reference = searchParams.get('reference')

    if (verify === 'true' && reference) {
      setVerifying(true)
      fetch(`/api/paystack/verify?reference=${reference}`)
        .then((res) => res.json())
        .then((json) => {
          if (json.success) {
            toast.success('🎉 Payment successful! Welcome to Premium!')
            router.push('/dashboard')
            router.refresh()
          } else {
            toast.error(json.error || 'Payment verification failed')
            setVerifying(false)
          }
        })
        .catch(() => {
          toast.error('Payment verification failed')
          setVerifying(false)
        })
    }
  }, [searchParams, router])

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <RefreshCw className="h-10 w-10 animate-spin text-amber-400 mx-auto" />
          <p className="text-white text-lg font-semibold">Verifying payment...</p>
          <p className="text-white/50 text-sm">Please wait, do not close this page.</p>
        </div>
      </div>
    )
  }

  const handleSubscribe = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
      })
      const json = await res.json()

      if (json.success) {
        window.location.href = json.data.authorization_url
      } else {
        toast.error(json.error || 'Failed to start payment')
      }
    } catch {
      toast.error('Failed to initialize payment')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative w-full max-w-lg space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-3xl font-bold">
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
              Outreach
            </span>
            <span className="text-white">Pro</span>
          </div>
          <p className="text-white/50 text-sm">
            Subscribe to unlock your outreach power
          </p>
        </div>

        {/* Pricing card */}
        <Card className="border-amber-500/30 bg-white/5 backdrop-blur-xl shadow-2xl shadow-indigo-500/10 overflow-hidden">
          {/* Popular banner */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 py-1.5 text-center">
            <p className="text-white text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-1">
              <Star className="h-3 w-3 fill-white" />
              Most Popular Plan
              <Star className="h-3 w-3 fill-white" />
            </p>
          </div>

          <CardHeader className="text-center pb-2">
            <div className="mx-auto rounded-full bg-amber-500/10 p-3 mb-3">
              <Crown className="h-8 w-8 text-amber-400" />
            </div>
            <CardTitle className="text-white text-2xl">Premium Plan</CardTitle>
            <div className="flex items-baseline justify-center gap-1 mt-3">
              <span className="text-5xl font-bold text-white">₦500</span>
              <span className="text-white/50 text-lg">/month</span>
            </div>
            <CardDescription className="text-white/50 mt-2">
              Everything you need to scale your outreach
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Features */}
            <div className="space-y-3">
              <Feature icon={Mail} text="Unlimited emails per day" />
              <Feature icon={Users} text="Unlimited contact lists" />
              <Feature icon={FileText} text="Unlimited email templates" />
              <Feature icon={Zap} text="Auto Scout batch sending" />
              <Feature icon={Zap} text="AI-powered personalization" />
              <Feature icon={Shield} text="Merge tags: {name}, {company}, {email}" />
              <Feature icon={Users} text="CSV upload with auto-extraction" />
              <Feature icon={Mail} text="Campaign tracking & analytics" />
            </div>

            {/* Subscribe button */}
            <Button
              onClick={handleSubscribe}
              disabled={loading}
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:scale-[1.02]"
              id="subscribe-btn"
            >
              {loading ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Redirecting to Paystack...
                </>
              ) : (
                <>
                  <Crown className="mr-2 h-5 w-5" />
                  Subscribe Now — ₦500/month
                  <ExternalLink className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {/* Payment info */}
            <p className="text-xs text-white/30 text-center">
              Secure payment via Paystack. Debit card, bank transfer, or USSD.
              Cancel anytime.
            </p>

            {/* Logout */}
            <div className="text-center pt-2 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="text-xs text-white/40 hover:text-white/70 transition-colors inline-flex items-center gap-1"
              >
                <LogOut className="h-3 w-3" />
                Sign out
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Feature({
  icon: Icon,
  text,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="rounded-full bg-emerald-500/10 p-1">
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      </div>
      <Icon className="h-4 w-4 text-white/40 shrink-0" />
      <span className="text-white/80">{text}</span>
    </div>
  )
}
