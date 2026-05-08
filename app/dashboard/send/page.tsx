'use client'

import { useState, useRef } from 'react'
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
  const [autoSending, setAutoSending] = useState(false)
  const [progress, setProgress] = useState(0)
  const abortRef = useRef(false)

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

  // Send single email — opens mailto
  const sendOne = (entry: EmailEntry) => {
    if (!subject.trim()) {
      toast.error('Please enter a subject')
      return
    }

    const personalizedBody = body
      .replace(/\{email\}/gi, entry.email)

    const mailtoLink = `mailto:${encodeURIComponent(entry.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(personalizedBody)}`

    // Open email client
    window.open(mailtoLink, '_blank')

    // Mark as sent
    setEmails((prev) =>
      prev.map((e) =>
        e.email === entry.email ? { ...e, status: 'sent' } : e
      )
    )

    toast.success(`Email ready for ${entry.email}`)
  }

  // Auto Send — loops through all pending emails
  const startAutoSend = async () => {
    if (!subject.trim()) {
      toast.error('Please enter a subject first')
      return
    }

    const pending = emails.filter((e) => e.status === 'pending')
    if (pending.length === 0) {
      toast.info('All emails already sent!')
      return
    }

    setAutoSending(true)
    abortRef.current = false
    setProgress(0)

    for (let i = 0; i < pending.length; i++) {
      if (abortRef.current) {
        toast.info(`Stopped. Sent ${i} of ${pending.length}.`)
        break
      }

      const entry = pending[i]

      // Mark as sending
      setEmails((prev) =>
        prev.map((e) =>
          e.email === entry.email ? { ...e, status: 'sending' } : e
        )
      )

      // Build mailto
      const personalizedBody = body.replace(/\{email\}/gi, entry.email)
      const mailtoLink = `mailto:${encodeURIComponent(entry.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(personalizedBody)}`

      window.open(mailtoLink, '_blank')

      // Mark as sent
      setEmails((prev) =>
        prev.map((e) =>
          e.email === entry.email ? { ...e, status: 'sent' } : e
        )
      )

      setProgress(Math.round(((i + 1) / pending.length) * 100))

      // Wait 5 seconds between sends
      if (i < pending.length - 1 && !abortRef.current) {
        await new Promise((r) => setTimeout(r, 5000))
      }
    }

    setAutoSending(false)
    if (!abortRef.current) {
      toast.success('Auto Send complete! Check your email client.')
    }
  }

  const stopAutoSend = () => {
    abortRef.current = true
  }

  const sentCount = emails.filter((e) => e.status === 'sent').length
  const pendingCount = emails.filter((e) => e.status === 'pending').length

  return (
    <div className="space-y-4 md:space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Quick Send</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Paste emails, write your message, hit send
        </p>
      </div>

      {/* Step 1: Add emails */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Mail className="h-4 w-4 text-indigo-500" />
            1. Add Recipient Emails
          </CardTitle>
          <CardDescription className="text-xs">
            Paste one email per line, or comma-separated
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <textarea
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder={"john@company.com\njane@agency.ng\nboss@startup.com"}
              className="flex-1 min-h-[80px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              id="email-paste-input"
            />
          </div>
          <Button
            onClick={addEmails}
            disabled={!emailInput.trim()}
            className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
            id="add-emails-btn"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Emails
          </Button>

          {/* Email chips */}
          {emails.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-2">
              {emails.map((entry) => (
                <Badge
                  key={entry.email}
                  variant="outline"
                  className={`text-xs gap-1 pr-1 ${
                    entry.status === 'sent'
                      ? 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400'
                      : entry.status === 'sending'
                        ? 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 animate-pulse'
                        : 'bg-slate-50 dark:bg-slate-900'
                  }`}
                >
                  {entry.status === 'sent' && <CheckCircle2 className="h-3 w-3" />}
                  {entry.status === 'sending' && <RefreshCw className="h-3 w-3 animate-spin" />}
                  {entry.status === 'pending' && <Clock className="h-3 w-3 text-muted-foreground" />}
                  {entry.email}
                  {entry.status === 'pending' && (
                    <button
                      onClick={() => removeEmail(entry.email)}
                      className="ml-1 hover:text-red-500 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
            </div>
          )}

          {emails.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {emails.length} total · {sentCount} sent · {pendingCount} pending
            </p>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Write message */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4 text-indigo-500" />
            2. Write Your Message
          </CardTitle>
          <CardDescription className="text-xs">
            Use {'{email}'} to insert the recipient&apos;s email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="quick-subject" className="text-xs">Subject</Label>
            <Input
              id="quick-subject"
              placeholder="e.g. Partnership Opportunity"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quick-body" className="text-xs">Message Body</Label>
            <textarea
              id="quick-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Hi there,\n\nI'd like to discuss a partnership...\n\nBest regards"}
              className="w-full min-h-[120px] rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Step 3: Send */}
      <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/20 dark:to-violet-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-amber-500" />
            3. Send Emails
          </CardTitle>
          <CardDescription className="text-xs">
            Click a contact to send one, or use Auto Send for all
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Auto Send controls */}
          <div className="flex flex-col sm:flex-row gap-2">
            {!autoSending ? (
              <Button
                onClick={startAutoSend}
                disabled={pendingCount === 0 || !subject.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
                id="auto-send-btn"
              >
                <Zap className="mr-2 h-4 w-4" />
                Auto Send All ({pendingCount} pending)
              </Button>
            ) : (
              <Button
                onClick={stopAutoSend}
                variant="destructive"
                className="flex-1"
                id="stop-send-btn"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Auto Send
              </Button>
            )}
          </div>

          {autoSending && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Sending {progress}% — don&apos;t close this page
              </p>
            </div>
          )}

          {/* Individual send buttons */}
          {emails.filter((e) => e.status === 'pending').length > 0 && (
            <div className="space-y-1.5 pt-2 border-t">
              <p className="text-xs text-muted-foreground font-medium">Or send individually:</p>
              {emails
                .filter((e) => e.status === 'pending')
                .map((entry) => (
                  <button
                    key={entry.email}
                    onClick={() => sendOne(entry)}
                    disabled={autoSending}
                    className="w-full flex items-center justify-between p-2.5 rounded-lg border hover:bg-indigo-50 dark:hover:bg-indigo-950/20 hover:border-indigo-300 transition-all text-left"
                  >
                    <span className="text-sm font-mono truncate">{entry.email}</span>
                    <Send className="h-3.5 w-3.5 text-indigo-500 shrink-0 ml-2" />
                  </button>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
