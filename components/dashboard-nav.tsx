'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Mail,
  Users,
  FileText,
  BarChart3,
  Settings,
  CreditCard,
  Menu,
  X,
  Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/send', label: 'Quick Send', icon: Send },
  { href: '/dashboard/campaigns', label: 'Campaigns', icon: Mail },
  { href: '/dashboard/lists', label: 'Contact Lists', icon: Users },
  { href: '/dashboard/templates', label: 'Templates', icon: FileText },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  { href: '/dashboard/settings/billing', label: 'Billing', icon: CreditCard },
]

export function DashboardNav() {
  const pathname = usePathname()

  return (
    <nav className="space-y-1">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/dashboard' && pathname.startsWith(item.href))

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
              isActive
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-white/50 hover:bg-white/10 hover:text-white'
            )}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

// Mobile nav with hamburger menu
export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  // Close menu when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden h-10 w-10 text-slate-900 dark:text-white relative z-[60]"
        onClick={() => setOpen(!open)}
        id="mobile-menu-btn"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Mobile drawer */}
      <div 
        className={cn(
          "fixed inset-0 z-[100] md:hidden transition-all duration-300",
          open ? "visible" : "invisible"
        )}
      >
        {/* Dark backdrop */}
        <div
          className={cn(
            "absolute inset-0 bg-black/80 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setOpen(false)}
        />

        {/* Slide-in panel */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-[280px] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 shadow-2xl transition-transform duration-300 flex flex-col",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-1.5 font-bold text-xl">
              <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                Email
              </span>
              <span className="text-white">Send</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3.5 text-sm font-medium transition-all',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                      : 'text-white/60 active:bg-white/10 active:text-white'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Credit */}
          <div className="p-6 border-t border-white/10">
            <p className="text-[10px] text-slate-500 text-center">
              Created by <span className="text-indigo-400/70 font-semibold tracking-wider">Cyber AK</span>
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
