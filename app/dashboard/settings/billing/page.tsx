'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
  X,
  Zap,
  Shield,
  RefreshCw,
  ExternalLink,
  Star,
  Users,
  Mail,
  FileText,
} from 'lucide-react'
import type { Profile } from '@/types'
import { createClient } from '@/lib/supabase/client'

export default function BillingPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState(false)
  const searchParams = useSearchParams()
  const supabase = createClient()

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (data) setProfile(data as Profile)
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  // Handle return from Paystack payment
  useEffect(() => {
    const verify = searchParams.get('verify')
    const reference = searchParams.get('reference')

    if (verify === 'true' && reference) {
      verifyPayment(reference)
    }
  }, [searchParams])

  const verifyPayment = async (reference: string) => {
    try {
      const res = await fetch(`/api/paystack/verify?reference=${reference}`)
      const json = await res.json()

      if (json.success) {
        toast.success('🎉 Payment successful! You are now Premium!')
        fetchProfile()
      } else {
        toast.error(json.error || 'Payment verification failed')
      }
    } catch {
      toast.error('Failed to verify payment')
    }
  }

  const handleUpgrade = async () => {
    setUpgrading(true)
    try {
      const res = await fetch('/api/paystack/initialize', {
        method: 'POST',
      })
      const json = await res.json()

      if (json.success) {
        // Redirect to Paystack checkout
        window.location.href = json.data.authorization_url
      } else {
        toast.error(json.error || 'Failed to start payment')
      }
    } catch {
      toast.error('Failed to initialize payment')
    } finally {
      setUpgrading(false)
    }
  }

  const isPremium = profile?.plan === 'premium'
  const isExpired =
    isPremium &&
    profile?.plan_expires_at &&
    new Date(profile.plan_expires_at) < new Date()

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
        <p className="text-muted-foreground mt-1">
          Manage your subscription and plan
        </p>
      </div>

      {/* Current plan badge */}
      <Card
        className={
          isPremium && !isExpired
            ? 'border-amber-500/30 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20'
            : ''
        }
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPremium && !isExpired ? (
                <div className="rounded-full bg-amber-500/10 p-2.5">
                  <Crown className="h-6 w-6 text-amber-500" />
                </div>
              ) : (
                <div className="rounded-full bg-muted p-2.5">
                  <Shield className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <div>
                <CardTitle className="text-xl">
                  {isPremium && !isExpired ? 'Premium Plan' : 'Free Plan'}
                </CardTitle>
                <CardDescription>
                  {isPremium && !isExpired
                    ? `Expires ${new Date(profile!.plan_expires_at!).toLocaleDateString()}`
                    : 'Limited to 500 emails/day'}
                </CardDescription>
              </div>
            </div>
            <Badge
              variant="outline"
              className={
                isPremium && !isExpired
                  ? 'text-amber-600 border-amber-300 bg-amber-100 dark:bg-amber-950/50'
                  : 'text-muted-foreground'
              }
            >
              {isPremium && !isExpired ? 'Active' : 'Free Tier'}
            </Badge>
          </div>
        </CardHeader>
        {isPremium && !isExpired && (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Daily emails: <strong>Unlimited</strong> •
              Templates: <strong>Unlimited</strong> •
              Auto Scout: <strong>Enabled</strong>
            </p>
          </CardContent>
        )}
      </Card>

      {/* Pricing comparison */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Free Plan */}
        <Card className={!isPremium || isExpired ? 'border-indigo-500/30' : ''}>
          <CardHeader>
            <CardTitle className="text-lg">Free</CardTitle>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-bold">₦0</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <CardDescription>5-day trial included</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FeatureRow icon={Mail} text="500 emails/day" included />
            <FeatureRow icon={FileText} text="2 templates max" included />
            <FeatureRow icon={Users} text="3 lists max" included />
            <FeatureRow icon={Zap} text="Basic AI personalization" included />
            <FeatureRow icon={Zap} text="Auto Scout" included={false} />
            <FeatureRow icon={Users} text="10,000 batch size" included={false} />

            {(!isPremium || isExpired) && (
              <div className="pt-4">
                <Badge
                  variant="outline"
                  className="w-full justify-center py-2 text-sm"
                >
                  Current Plan
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Premium Plan */}
        <Card
          className={`border-amber-500/30 bg-gradient-to-br from-amber-50/30 to-orange-50/30 dark:from-amber-950/10 dark:to-orange-950/10 relative overflow-hidden ${
            isPremium && !isExpired ? '' : ''
          }`}
        >
          {/* Popular badge */}
          <div className="absolute top-4 right-4">
            <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Star className="mr-1 h-3 w-3 fill-white" />
              Popular
            </Badge>
          </div>

          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Crown className="h-5 w-5 text-amber-500" />
              Premium
            </CardTitle>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-4xl font-bold">₦500</span>
              <span className="text-muted-foreground">/month</span>
            </div>
            <CardDescription>Everything unlimited</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <FeatureRow icon={Mail} text="Unlimited emails/day" included />
            <FeatureRow icon={FileText} text="Unlimited templates" included />
            <FeatureRow icon={Users} text="Unlimited lists" included />
            <FeatureRow icon={Zap} text="Advanced AI personalization" included />
            <FeatureRow icon={Zap} text="Auto Scout batch mode" included />
            <FeatureRow icon={Users} text="10,000 contacts per batch" included />

            <div className="pt-4">
              {isPremium && !isExpired ? (
                <Badge
                  variant="outline"
                  className="w-full justify-center py-2 text-sm text-amber-600 border-amber-300 bg-amber-100 dark:bg-amber-950/50"
                >
                  <Crown className="mr-1 h-3 w-3" />
                  Current Plan
                </Badge>
              ) : (
                <Button
                  onClick={handleUpgrade}
                  disabled={upgrading}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-semibold shadow-lg shadow-amber-500/25"
                  id="upgrade-btn"
                >
                  {upgrading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Redirecting to Paystack...
                    </>
                  ) : (
                    <>
                      <Crown className="mr-2 h-4 w-4" />
                      Upgrade to Premium — ₦500/month
                      <ExternalLink className="ml-2 h-3 w-3" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment info */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Payments are securely processed by{' '}
            <strong className="text-foreground">Paystack</strong>. We accept
            debit cards, bank transfers, and USSD payments. Cancel anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

// Feature row component
function FeatureRow({
  icon: Icon,
  text,
  included,
}: {
  icon: React.ComponentType<{ className?: string }>
  text: string
  included: boolean
}) {
  return (
    <div className="flex items-center gap-3 text-sm">
      {included ? (
        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
      ) : (
        <X className="h-4 w-4 text-muted-foreground/50 shrink-0" />
      )}
      <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className={included ? '' : 'text-muted-foreground/50'}>
        {text}
      </span>
    </div>
  )
}
