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
      {/* The Purple Square Button */}
      <Button
        variant="default"
        size="icon"
        className="md:hidden h-11 w-11 bg-[#4f46e5] hover:bg-[#4338ca] text-white shadow-xl shadow-indigo-500/30 relative z-[9999] rounded-xl flex items-center justify-center"
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        id="mobile-menu-btn"
      >
        {open ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
      </Button>

      {/* Mobile drawer container */}
      <div 
        className={cn(
          "fixed inset-0 z-[9990] md:hidden",
          open ? "block" : "hidden"
        )}
      >
        {/* SOLID Dark backdrop */}
        <div
          className="absolute inset-0 bg-[#020617]/95 transition-opacity duration-300"
          onClick={() => setOpen(false)}
        />

        {/* SOLID Dark panel */}
        <div
          className={cn(
            "absolute left-0 top-0 h-full w-[85%] max-w-[300px] bg-[#0f172a] border-r border-white/10 shadow-[20px_0_60px_-15px_rgba(0,0,0,0.5)] flex flex-col transition-transform duration-300 ease-out",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header */}
          <div className="flex items-center p-6 border-b border-white/5 bg-[#1e293b]/30">
            <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
              <span className="text-[#818cf8]">Email</span>
              <span className="text-white">Send</span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="p-4 space-y-2.5 flex-1 overflow-y-auto">
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
                    'flex items-center gap-4 rounded-xl px-5 py-4 text-lg font-bold transition-all active:scale-95',
                    isActive
                      ? 'bg-[#4f46e5] text-white shadow-lg shadow-indigo-500/40'
                      : 'text-white/80 bg-white/5 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <item.icon className={cn("h-6 w-6", isActive ? "text-white" : "text-[#6366f1]")} />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="p-8 border-t border-white/5 text-center bg-[#020617]/50">
             <div className="space-y-1">
                <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] font-black">
                  Powered By
                </p>
                <p className="text-sm font-bold text-indigo-400">Cyber AK</p>
             </div>
          </div>
        </div>
      </div>
    </>
  )
}
