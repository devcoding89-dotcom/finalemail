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
import {
  Send,
  Zap,
  Plus,
  X,
  Mail,
  CheckCircle2,
  Clock,
  Square,
  RefreshCw,
  ArrowRight,
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

  // Send single email
  const sendOne = (email: string) => {
    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }
    window.open(getMailto(email), '_blank')
    setEmails((prev) =>
      prev.map((e) => (e.email === email ? { ...e, status: 'sent' } : e))
    )
  }

  // BATCH SEND LOGIC (Phone Friendly)
  const startBatch = () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject first')
      return
    }
    const pending = emails.findIndex(e => e.status === 'pending')
    if (pending === -1) {
      toast.info('No pending emails!')
      return
    }
    setActiveBatch(true)
    sendNext(pending)
  }

  const sendNext = (index: number) => {
    if (index >= emails.length) {
      setActiveBatch(false)
      setCurrentIndex(-1)
      toast.success('Batch complete!')
      return
    }

    const entry = emails[index]
    if (entry.status !== 'pending') {
      sendNext(index + 1)
      return
    }

    setCurrentIndex(index)
    window.open(getMailto(entry.email), '_blank')
    
    // Mark as sent
    setEmails((prev) =>
      prev.map((e, i) => (i === index ? { ...e, status: 'sent' } : e))
    )

    // Update progress
    const sentCount = emails.filter(e => e.status === 'sent').length + 1
    setProgress(Math.round((sentCount / emails.length) * 100))
  }

  const stopBatch = () => {
    setActiveBatch(false)
    setCurrentIndex(-1)
  }

  const sentCount = emails.filter((e) => e.status === 'sent').length
  const pendingCount = emails.filter((e) => e.status === 'pending').length

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-20 md:pb-8">
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

      {/* Step 3: Send (Floating on Mobile) */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 p-4 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 z-50 md:relative md:bg-transparent md:border-none md:p-0",
        activeBatch ? "block" : "hidden md:block"
      )}>
        <Card className="md:border-indigo-500/20 md:bg-indigo-50/30 dark:md:bg-indigo-950/10">
          <CardContent className="p-4 md:p-6 space-y-4">
            {!activeBatch ? (
              <Button
                onClick={startBatch}
                disabled={pendingCount === 0 || !subject.trim()}
                className="w-full h-12 md:h-14 text-lg font-bold rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-xl shadow-indigo-500/20"
              >
                <Zap className="mr-2 h-5 w-5" />
                Start Auto-Send ({pendingCount})
              </Button>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold text-indigo-600 uppercase mb-1">Sending Batch...</p>
                    <p className="text-sm font-medium truncate">{emails[currentIndex]?.email}</p>
                  </div>
                  <Button variant="outline" size="sm" onClick={stopBatch} className="rounded-lg h-9">
                    <Square className="mr-2 h-4 w-4" /> Stop
                  </Button>
                </div>
                
                <Progress value={progress} className="h-2.5 rounded-full" />
                
                <Button
                  onClick={() => sendNext(currentIndex + 1)}
                  className="w-full h-14 text-lg font-bold rounded-2xl bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-500/20 animate-pulse"
                >
                  Send Next Email
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-[11px] text-center text-slate-500 italic">
                  Browsers block auto-popups. Click the button for each email.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Placeholder for floating button on mobile */}
      {!activeBatch && pendingCount > 0 && (
        <div className="md:hidden fixed bottom-6 right-6 z-40">
           <Button
            onClick={startBatch}
            className="w-16 h-16 rounded-full bg-indigo-600 shadow-2xl shadow-indigo-500/40 p-0"
          >
            <Send className="h-6 w-6" />
          </Button>
        </div>
      )}
    </div>
  )
}
