'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X, Smartphone, Download } from 'lucide-react'

export function MobileInstallBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Show only on mobile and if not already dismissed in this session
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    const isDismissed = sessionStorage.getItem('pwa-banner-dismissed')
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches

    if (isMobile && !isDismissed && !isStandalone) {
      const timer = setTimeout(() => setShow(true), 3000) // Show after 3 seconds
      return () => clearTimeout(timer)
    }
  }, [])

  const dismiss = () => {
    setShow(false)
    sessionStorage.setItem('pwa-banner-dismissed', 'true')
  }

  if (!show) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[2000] animate-in fade-in slide-in-from-bottom duration-500">
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl p-4 shadow-2xl shadow-indigo-500/40 border border-white/20">
        <div className="flex items-start gap-4">
          <div className="bg-white/20 p-2.5 rounded-xl">
            <Smartphone className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-bold text-sm">Install EmailSend</h3>
            <p className="text-white/80 text-[11px] leading-tight mt-0.5">
              Add to home screen for a faster, smoother experience.
            </p>
          </div>
          <button onClick={dismiss} className="text-white/50 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex gap-2">
          <Button 
            variant="secondary" 
            size="sm" 
            className="w-full h-10 font-bold rounded-xl bg-white text-indigo-600 hover:bg-slate-100"
            onClick={() => {
              // On iOS we can't trigger the prompt, we have to show instructions
              // On Android/Chrome we could use beforeinstallprompt, but this is a good catch-all
              alert("To install: Tap the 'Share' icon (bottom or top) and select 'Add to Home Screen' 📱")
              dismiss()
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Install Now
          </Button>
        </div>
      </div>
    </div>
  )
}
