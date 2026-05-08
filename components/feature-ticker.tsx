'use client'

import { useState, useEffect } from 'react'
import { Rocket } from 'lucide-react'

export function FeatureTicker() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Only show the ticker if they have already seen and dismissed the main announcement
    const hasSeen = localStorage.getItem('seen-1k-plan')
    if (hasSeen) {
      setShow(true)
    }

    // Also listen for a custom event in case they just clicked 'Okay'
    const handleStorageChange = () => {
      if (localStorage.getItem('seen-1k-plan')) {
        setShow(true)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    
    // We can also poll or use a custom event since localStorage events don't fire on the same window
    const interval = setInterval(() => {
      if (localStorage.getItem('seen-1k-plan') && !show) {
        setShow(true)
      }
    }, 1000)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [show])

  if (!show) return null

  return (
    <div className="bg-indigo-600 text-white py-0.5 overflow-hidden sticky top-0 z-[100] border-b border-indigo-500/50">
      <div className="animate-marquee whitespace-nowrap flex items-center gap-4 text-[10px] font-medium tracking-wide">
        <span className="flex items-center gap-1.5">
          <Rocket className="h-2.5 w-2.5 text-indigo-200" />
          Coming Soon: Send 1,000 emails at once without keeping the app open!
        </span>
        <span className="flex items-center gap-1.5 opacity-50 mx-4">•</span>
        <span className="flex items-center gap-1.5">
          <Rocket className="h-2.5 w-2.5 text-indigo-200" />
          Get your contact lists ready for massive scale.
        </span>
        <span className="flex items-center gap-1.5 opacity-50 mx-4">•</span>
        <span className="flex items-center gap-1.5">
          <Rocket className="h-2.5 w-2.5 text-indigo-200" />
          Coming Soon: Send 1,000 emails at once without keeping the app open!
        </span>
      </div>
    </div>
  )
}
