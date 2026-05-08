'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Send,
  Zap,
  Plus,
  X,
  Mail,
  Users,
  CheckCircle2,
  Clock,
  Square,
  RefreshCw,
  ArrowRight,
  Settings2,
} from 'lucide-react'

interface EmailEntry {
  email: string
  status: 'pending' | 'sending' | 'sent' | 'failed'
}

export default function QuickSendPage() {
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails] = useState<EmailEntry[]>([])
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [activeBatch, setActiveBatch] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [progress, setProgress] = useState(0)
  const [batchLimit, setBatchLimit] = useState('10')
  const [isAutoSending, setIsAutoSending] = useState(false)
  const [sentInBatch, setSentInBatch] = useState(0)
  
  // Refs for stable values across timeouts
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoSendingRef = useRef(false)
  const emailsRef = useRef<EmailEntry[]>([])

  // Keep emailsRef in sync
  useEffect(() => {
    emailsRef.current = emails
  }, [emails])

  // Stop auto-sending on unmount
  useEffect(() => {
    return () => {
      if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current)
    }
  }, [])

  // Add emails from input
  const addEmails = () => {
    const newEmails = emailInput
      .split(/[\n,;]+/)
      .map((e) => e.trim())
      .filter((e) => e.includes('@') && e.includes('.'))
      .filter((e) => !emails.some((ex) => ex.email === e))

    if (newEmails.length === 0) {
      toast.error('No valid emails found')
      return
    }

    setEmails((prev) => [
      ...prev,
      ...newEmails.map((email) => ({ email, status: 'pending' as const })),
    ])
    setEmailInput('')
    toast.success(`Added ${newEmails.length} email(s)`)
  }

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e.email !== email))
  }

  // Generate mailto link
  const getMailto = (email: string) => {
    const personalizedBody = body.replace(/\{email\}/gi, email)
    return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(personalizedBody)}`
  }

  // BATCH SEND LOGIC
  const startBatch = () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject first')
      return
    }
    const pendingIndex = emails.findIndex(e => e.status === 'pending')
    if (pendingIndex === -1) {
      toast.info('No pending emails!')
      return
    }

    const limit = parseInt(batchLimit) || 1
    setActiveBatch(true)
    setIsAutoSending(true)
    isAutoSendingRef.current = true
    setSentInBatch(0)
    
    // Start the first one immediately
    sendNext(pendingIndex, 0, limit)
  }

  const sendNext = (index: number, currentBatchCount: number, limit: number) => {
    // Check if we should stop
    if (index >= emailsRef.current.length || currentBatchCount >= limit || !isAutoSendingRef.current) {
      setIsAutoSending(false)
      isAutoSendingRef.current = false
      setActiveBatch(false)
      setCurrentIndex(-1)
      if (currentBatchCount > 0) {
        toast.success(currentBatchCount >= limit ? `Batch of ${currentBatchCount} complete!` : 'Auto-send stopped.')
      }
      return
    }

    const entry = emailsRef.current[index]
    if (entry.status !== 'pending') {
      sendNext(index + 1, currentBatchCount, limit)
      return
    }

    setCurrentIndex(index)
    
    // Attempt to open the mailto link
    // Note: We use window.open for better handling in some browsers
    const mailtoUrl = getMailto(entry.email)
    const popup = window.open(mailtoUrl, '_blank')
    
    // On some devices, window.open returns null for mailto.
    // If it's a direct user click (first one), we assume it worked.
    // For subsequent ones in the loop, we check for blocks.
    if (currentBatchCount > 0 && (!popup || popup.closed || typeof popup.closed === 'undefined')) {
      toast.error('Popup blocked!', {
        description: 'Your browser blocked the next email. Please allow popups for this site.',
        duration: 5000,
      })
      setIsAutoSending(false)
      isAutoSendingRef.current = false
      return
    }

    // Mark as sent in state
    setEmails((prev) =>
      prev.map((e, i) => (i === index ? { ...e, status: 'sent' } : e))
    )

    // Log to DB
    fetch('/api/logs/quick-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: entry.email }),
    }).catch(console.error)

    // Update progress
    const totalSent = emailsRef.current.filter(e => e.status === 'sent').length + 1
    setProgress(Math.round((totalSent / emailsRef.current.length) * 100))
    setSentInBatch(currentBatchCount + 1)

    // Trigger next after delay if auto-sending
    if (isAutoSendingRef.current && (currentBatchCount + 1) < limit) {
      autoSendTimerRef.current = setTimeout(() => {
        // Find next pending starting from after current index
        const nextPending = emailsRef.current.findIndex((e, i) => i > index && e.status === 'pending')
        if (nextPending !== -1) {
          sendNext(nextPending, currentBatchCount + 1, limit)
        } else {
          setIsAutoSending(false)
          isAutoSendingRef.current = false
          setActiveBatch(false)
          setCurrentIndex(-1)
          toast.success('All pending emails in list sent!')
        }
      }, 4000) // 4 second delay to allow user to see/interact with mail app
    }
  }

  const stopBatch = () => {
    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current)
    setIsAutoSending(false)
    isAutoSendingRef.current = false
    setActiveBatch(false)
    setCurrentIndex(-1)
  }

  const pendingCount = emails.filter((e) => e.status === 'pending').length

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-32 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Quick Send</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bulk email from your phone or PC
          </p>
        </div>
        {emails.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setEmails([])} className="text-red-500 hover:text-red-600 hover:bg-red-50">
            Clear All
          </Button>
        )}
      </div>

      {/* Step 1: Recipients */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Users className="h-4 w-4 text-indigo-500" />
            1. Recipients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={"Paste emails here...\njohn@company.com\njane@agency.ng"}
            className="w-full min-h-[100px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
          <Button
            onClick={addEmails}
            disabled={!emailInput.trim()}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 h-11"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add to List
          </Button>

          {emails.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {emails.map((entry) => (
                <Badge
                  key={entry.email}
                  variant="secondary"
                  className={cn(
                    "pl-2 pr-1 py-1 rounded-lg text-[11px] gap-1.5 border transition-colors",
                    entry.status === 'sent' 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                      : "bg-slate-100 dark:bg-slate-800 border-transparent"
                  )}
                >
                  {entry.status === 'sent' && <CheckCircle2 className="h-3 w-3" />}
                  {entry.email}
                  {entry.status === 'pending' && (
                    <button onClick={() => removeEmail(entry.email)} className="hover:text-red-500">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Message */}
      <Card className="border-slate-200 dark:border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-500" />
            2. Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Subject</Label>
            <Input
              placeholder="e.g. Quick Question"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-500 uppercase tracking-wider ml-1">Body</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Hi there,\n\nI wanted to connect..."}
              className="w-full min-h-[150px] rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Configuration & Start */}
      <Card className="border-indigo-500/20 bg-indigo-50/30 dark:bg-indigo-950/10">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <Settings2 className="h-4 w-4 text-indigo-500" />
            3. Setup & Send
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
              <Label htmlFor="batch-limit" className="text-xs font-bold uppercase text-slate-500 ml-1 flex justify-between">
                <span>Amount to Send</span>
                <span className="text-indigo-600 font-bold">{batchLimit} emails</span>
              </Label>
              <Input 
                id="batch-limit"
                type="number"
                value={batchLimit}
                onChange={(e) => setBatchLimit(e.target.value)}
                className="h-11 rounded-xl bg-white dark:bg-slate-950 font-medium"
                min="1"
                max={pendingCount}
              />
              <p className="text-[10px] text-slate-400 ml-1">
                Number of emails to send in this automatic sequence.
              </p>
           </div>

           <Button
              onClick={startBatch}
              disabled={pendingCount === 0 || !subject.trim() || activeBatch}
              className="w-full h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
            >
              <Zap className="mr-2 h-5 w-5" />
              {activeBatch ? 'Sending...' : 'Start Auto-Send Now'}
            </Button>
            
            <p className="text-[11px] text-center text-slate-500 italic">
               Note: This will open your mail app for each email.
            </p>
        </CardContent>
      </Card>

      {/* Active Session Status (Floating Footer) */}
      {activeBatch && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 animate-in slide-in-from-bottom duration-300 shadow-2xl">
           <div className="max-w-2xl mx-auto space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-xs font-bold text-indigo-600 uppercase mb-0.5 flex items-center gap-2">
                    <RefreshCw className={cn("h-3 w-3", isAutoSending && "animate-spin")} />
                    {isAutoSending ? 'Auto-Sending Batch' : 'Paused'} 
                    <span className="text-slate-400 font-normal ml-2">({sentInBatch} of {batchLimit})</span>
                  </p>
                  <p className="text-sm font-bold truncate text-slate-700 dark:text-slate-200">
                    {emails[currentIndex]?.email}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={stopBatch} className="rounded-lg h-9 font-bold">
                  <Square className="mr-2 h-4 w-4" /> Stop
                </Button>
              </div>
              
              <Progress value={progress} className="h-2 rounded-full" />
              
              {!isAutoSending && (
                <Button
                  onClick={() => {
                    isAutoSendingRef.current = true
                    setIsAutoSending(true)
                    sendNext(currentIndex + 1, sentInBatch, parseInt(batchLimit))
                  }}
                  className="w-full h-12 text-md font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 shadow-lg"
                >
                  Resume Auto-Send
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              
              <p className="text-[10px] text-center text-slate-400 font-medium">
                {isAutoSending 
                  ? "Mail app opening... next one in 4s. Don't close this tab." 
                  : "Sequence paused. Click Resume to continue."}
              </p>
           </div>
        </div>
      )}
    </div>
  )
}
