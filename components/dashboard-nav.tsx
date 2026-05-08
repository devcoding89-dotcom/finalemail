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
        className="md:hidden h-9 w-9"
        onClick={() => setOpen(true)}
        id="mobile-menu-btn"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[100] md:hidden">
          {/* Dark backdrop */}
          <div
            className="absolute inset-0 bg-black/70"
            onClick={() => setOpen(false)}
          />

          {/* Slide-in panel */}
          <div
            className="absolute left-0 top-0 h-full w-[280px] bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 shadow-2xl"
            style={{ animation: 'slideIn 0.2s ease-out' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-1.5 font-bold text-lg">
                <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                  Email
                </span>
                <span className="text-white">Send</span>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="text-white/50 hover:text-white p-1.5 rounded-lg hover:bg-white/10"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Nav links */}
            <nav className="p-3 space-y-1">
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
                      'flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all',
                      isActive
                        ? 'bg-indigo-600 text-white'
                        : 'text-white/50 active:bg-white/10 active:text-white'
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Credit */}
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="text-[10px] text-slate-500">
                Created by <span className="text-indigo-400/70">Cyber AK</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CSS animation */}
      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}
