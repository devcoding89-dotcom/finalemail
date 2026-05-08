import { createClient } from '@/lib/supabase/server'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Mail, Users, TrendingUp, CreditCard } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single()

  // Fetch counts
  const { count: campaignCount } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  const { count: listCount } = await supabase
    .from('email_lists')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user?.id)

  const dailyRemaining =
    (profile?.daily_limit || 500) - (profile?.emails_sent_today || 0)

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back, {profile?.full_name || 'there'}! Here&apos;s your
          outreach overview.
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="group hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Campaigns
            </CardTitle>
            <div className="rounded-lg bg-indigo-500/10 p-2">
              <Mail className="h-4 w-4 text-indigo-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{campaignCount || 0}</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg hover:shadow-violet-500/5 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Contact Lists
            </CardTitle>
            <div className="rounded-lg bg-violet-500/10 p-2">
              <Users className="h-4 w-4 text-violet-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{listCount || 0}</div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Emails Sent Today
            </CardTitle>
            <div className="rounded-lg bg-emerald-500/10 p-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {profile?.emails_sent_today || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="group hover:shadow-lg hover:shadow-amber-500/5 transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Daily Limit Left
            </CardTitle>
            <div className="rounded-lg bg-amber-500/10 p-2">
              <CreditCard className="h-4 w-4 text-amber-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dailyRemaining}</div>
            <p className="text-xs text-muted-foreground mt-1">
              of {profile?.daily_limit || 500} daily
              {profile?.plan === 'premium' && ' (Premium — Unlimited)'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-4">
        <Link href="/dashboard/lists">
          <Button
            size="lg"
            className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25"
          >
            <Users className="mr-2 h-4 w-4" />
            Upload Contacts
          </Button>
        </Link>
        <Link href="/dashboard/campaigns">
          <Button size="lg" variant="outline">
            <Mail className="mr-2 h-4 w-4" />
            New Campaign
          </Button>
        </Link>
      </div>
    </div>
  )
}
