import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { DashboardNav } from '@/components/dashboard-nav'
import { UserNav } from '@/components/user-nav'
import { VerificationBanner } from '@/components/verification-banner'
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

  return (
    <div className="min-h-screen bg-background">
      {/* Top header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-lg">
        <div className="flex h-16 items-center px-4 md:px-8">
          <div className="flex items-center gap-1.5 font-bold text-xl">
            <span className="bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent">
              Outreach
            </span>
            <span>Pro</span>
          </div>
          <div className="ml-auto flex items-center gap-4">
            <UserNav user={user} emailVerified={emailVerified} />
          </div>
        </div>
      </header>

      {/* Sidebar + content */}
      <div className="flex">
        <aside className="w-64 border-r min-h-[calc(100vh-4rem)] p-4 hidden md:block">
          <DashboardNav />
        </aside>
        <main className="flex-1 p-4 md:p-8">
          {/* Verification banner for unverified users */}
          <VerificationBanner
            emailVerified={emailVerified}
            userEmail={user.email || ''}
          />
          {children}
        </main>
      </div>
      <Toaster position="top-center" richColors />
    </div>
  )
}
