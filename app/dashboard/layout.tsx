import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav, BottomNav } from '@/components/dashboard-nav'
import { UserNav } from '@/components/user-nav'
import { VerificationBanner } from '@/components/verification-banner'
import { FreeTrialBanner } from '@/components/free-trial-banner'
import { Toaster } from '@/components/ui/sonner'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const emailVerified = user.email_confirmed_at != null

  // Check if user is on free trial
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan, created_at')
    .eq('id', user.id)
    .single()

  const isFreeTrial = profile?.plan !== 'premium'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Top header */}
      <header className="sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-lg">
        <div className="flex h-14 md:h-16 items-center px-4 md:px-8 gap-3">
          {/* Logo */}
          <div className="flex items-center gap-1.5 font-bold text-lg md:text-xl">
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Email
            </span>
            <span className="text-slate-900 dark:text-white">Send</span>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <UserNav user={user} emailVerified={emailVerified} />
          </div>
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="w-64 min-h-[calc(100vh-4rem)] p-4 hidden md:block bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 border-r border-slate-800">
          <DashboardNav />
          <div className="mt-auto pt-8">
            <p className="text-[10px] text-slate-500 text-center">
              Created by <span className="text-indigo-400/70">Cyber AK</span>
            </p>
          </div>
        </aside>

        {/* Main content — responsive padding */}
        <main className="flex-1 p-3 md:p-8 pb-24 md:pb-8 min-w-0">
          <VerificationBanner
            emailVerified={emailVerified}
            userEmail={user.email || ''}
          />
          {isFreeTrial && profile && (
            <FreeTrialBanner createdAt={profile.created_at} />
          )}
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav />
      
      <Toaster position="top-center" richColors />
    </div>
  )
}
