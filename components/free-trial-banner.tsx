'use client'

import { useState, useEffect } from 'react'
import { Clock, Crown, X } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export function FreeTrialBanner({ createdAt }: { createdAt: string }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!createdAt) return

    const update = () => {
      const created = new Date(createdAt)
      const now = new Date()
      
      // 48 hours trial
      const expiry = new Date(created.getTime() + 48 * 60 * 60 * 1000)
      const diff = expiry.getTime() - now.getTime()

      if (diff <= 0) {
        setTimeLeft('expired')
        return
      }

      const totalMinutes = Math.floor(diff / (1000 * 60))
      const hours = Math.floor(totalMinutes / 60)
      const minutes = totalMinutes % 60

      if (hours >= 24) {
        const days = Math.floor(hours / 24)
        const remHours = hours % 24
        setTimeLeft(`${days}d ${remHours}h left`)
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m left`)
      } else {
        setTimeLeft(`${minutes}m left`)
      }
    }

    update()
    const interval = setInterval(update, 30000)
    return () => clearInterval(interval)
  }, [createdAt])

  if (dismissed || timeLeft === 'expired') return null

  return (
    <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5 md:px-4 md:py-3 mb-4 md:mb-6">
      <div className="flex items-center justify-between gap-2 md:gap-4">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <div className="rounded-full bg-amber-500/20 p-1 md:p-1.5 shrink-0">
            <Clock className="h-3.5 w-3.5 md:h-4 md:w-4 text-amber-500" />
          </div>
          <div className="min-w-0">
            <p className="text-xs md:text-sm font-medium text-amber-700 dark:text-amber-300 truncate">
              Free trial — <strong>{timeLeft}</strong>
            </p>
            <p className="text-[10px] md:text-xs text-amber-600/70 dark:text-amber-400/70 hidden sm:block">
              Upgrade to Premium for unlimited access
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Link href="/dashboard/subscribe">
            <Button
              size="sm"
              className="bg-amber-500 hover:bg-amber-400 text-white text-[10px] md:text-xs h-7 md:h-8 px-2 md:px-3"
            >
              <Crown className="mr-1 h-3 w-3" />
              <span className="hidden sm:inline">Upgrade</span>
              <span className="sm:hidden">₦500</span>
            </Button>
          </Link>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-500/50 hover:text-amber-500 p-1"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
