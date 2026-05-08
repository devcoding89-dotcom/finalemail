'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Rocket, Download, X } from 'lucide-react'
import { usePwa } from '@/components/pwa-provider'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

export function FeatureAnnouncementModal() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<1 | 2>(1)
  const { isInstalled, installApp } = usePwa()

  useEffect(() => {
    // Only show once
    const hasSeen = localStorage.getItem('seen-1k-plan')
    
    if (!hasSeen) {
      // Delay slightly so it doesn't clash with immediate page load
      const timer = setTimeout(() => {
        setOpen(true)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [])

  const handleOkay = () => {
    if (isInstalled) {
      closeAndSave()
    } else {
      setStep(2)
    }
  }

  const handleInstall = async () => {
    await installApp()
    closeAndSave()
  }

  const closeAndSave = () => {
    setOpen(false)
    localStorage.setItem('seen-1k-plan', 'true')
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) closeAndSave()
    }}>
      <DialogContent className="sm:max-w-md bg-gradient-to-br from-indigo-950 to-slate-900 border-indigo-500/30 text-white">
        {step === 1 ? (
          <>
            <DialogHeader>
              <div className="mx-auto bg-indigo-500/20 p-3 rounded-full mb-4 w-fit">
                <Rocket className="h-8 w-8 text-indigo-400" />
              </div>
              <DialogTitle className="text-center text-2xl font-bold">
                Coming Soon! 🚀
              </DialogTitle>
              <DialogDescription className="text-center text-slate-300 text-base pt-2">
                Next plan for the app: You will soon be able to send messages to <strong>1,000 emails at once</strong> without keeping the app open!
                <br /><br />
                Stay tuned for the biggest update yet.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center mt-6">
              <Button 
                onClick={handleOkay}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-12 text-lg"
              >
                Okay, got it!
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <div className="mx-auto bg-violet-500/20 p-3 rounded-full mb-4 w-fit">
                <Download className="h-8 w-8 text-violet-400" />
              </div>
              <DialogTitle className="text-center text-2xl font-bold">
                Get Ready!
              </DialogTitle>
              <DialogDescription className="text-center text-slate-300 text-base pt-2">
                For the best experience when this massive feature drops, you should download the app to your device now!
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-3 mt-6">
              <Button 
                onClick={handleInstall}
                className="w-full bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold h-12 text-lg"
              >
                <Download className="mr-2 h-5 w-5" />
                Install App Now
              </Button>
              <Button 
                onClick={closeAndSave}
                variant="ghost"
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Maybe later
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
