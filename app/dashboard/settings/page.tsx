'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { toast } from 'sonner'
import { Crown, RefreshCw, User, CreditCard } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import Link from 'next/link'

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fullName, setFullName] = useState('')
  const [companyName, setCompanyName] = useState('')
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

      if (data) {
        const p = data as Profile
        setProfile(p)
        setFullName(p.full_name || '')
        setCompanyName(p.company_name || '')
      }
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleSave = async () => {
    setSaving(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim() || null,
          company_name: companyName.trim() || null,
        })
        .eq('id', user.id)

      if (error) {
        toast.error('Failed to save profile')
      } else {
        toast.success('Profile updated!')
      }
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const isPremium =
    profile?.plan === 'premium' &&
    profile?.plan_expires_at &&
    new Date(profile.plan_expires_at) > new Date()

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your profile and subscription
        </p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Full Name</Label>
            <Input
              id="settings-name"
              placeholder="John Doe"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-company">Company Name</Label>
            <Input
              id="settings-company"
              placeholder="Acme Corp"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
          >
            {saving ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Plan card */}
      <Card
        className={
          isPremium
            ? 'border-amber-500/30 bg-gradient-to-r from-amber-50/50 to-orange-50/50 dark:from-amber-950/20 dark:to-orange-950/20'
            : ''
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Your current plan and billing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isPremium ? (
                <Crown className="h-6 w-6 text-amber-500" />
              ) : null}
              <div>
                <p className="font-semibold">
                  {isPremium ? 'Premium Plan' : 'Free Plan'}
                </p>
                <p className="text-sm text-muted-foreground">
                  {isPremium
                    ? `₦500/month — renews ${new Date(profile!.plan_expires_at!).toLocaleDateString()}`
                    : '500 emails/day limit'}
                </p>
              </div>
            </div>
            <Link href="/dashboard/settings/billing">
              <Button
                variant={isPremium ? 'outline' : 'default'}
                className={
                  isPremium
                    ? ''
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white'
                }
              >
                {isPremium ? 'Manage Plan' : 'Upgrade — ₦500/mo'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Usage stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Usage Today</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Emails sent</span>
            <span className="font-semibold">
              {profile?.emails_sent_today || 0}
              {!isPremium && (
                <span className="text-muted-foreground font-normal">
                  {' '}
                  / {profile?.daily_limit || 500}
                </span>
              )}
            </span>
          </div>
          {!isPremium && (
            <div className="mt-3">
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
                  style={{
                    width: `${Math.min(
                      ((profile?.emails_sent_today || 0) /
                        (profile?.daily_limit || 500)) *
                        100,
                      100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}
          {isPremium && (
            <Badge
              variant="outline"
              className="mt-2 text-amber-600 border-amber-300"
            >
              <Crown className="mr-1 h-3 w-3" />
              Unlimited
            </Badge>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
