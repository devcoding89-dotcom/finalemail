'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import {
  Send,
  Zap,
  CheckCircle2,
  Clock,
  RefreshCw,
  Square,
  Mail,
  ArrowLeft,
  ExternalLink,
  Play,
  ArrowRight,
} from 'lucide-react'
import type { Contact } from '@/types'
import { CampaignStatusBadge } from '@/components/campaign-status-badge'
import { EmailJobStatusBadge } from '@/components/email-job-status'
import Link from 'next/link'

interface CampaignDetail {
  id: string
  name: string
  status: string
  total_emails: number
  sent_count: number
  list_id: string
  current_index: number
  sending_mode: 'manual' | 'quick' | 'auto'
}

export default function CampaignSendPage() {
  const params = useParams()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [sentContacts, setSentContacts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [batchLimit, setBatchLimit] = useState('10')
  const [autoScoutRunning, setAutoScoutRunning] = useState(false)
  const [autoScoutProgress, setAutoScoutProgress] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [currentContactEmail, setCurrentContactEmail] = useState('')
  const autoScoutAbort = useRef(false)
  const isAutoScoutRunningRef = useRef(false)
  const nextTriggerRef = useRef<(() => void) | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Sync ref
  useEffect(() => {
    isAutoScoutRunningRef.current = autoScoutRunning
  }, [autoScoutRunning])

  // Focus detection for seamless loop
  useEffect(() => {
    const handleFocus = () => {
      if (isAutoScoutRunningRef.current && nextTriggerRef.current) {
        console.log('[AutoScout] Tab focused, triggering next email immediately...')
        // Small delay to let the user see the UI
        setTimeout(() => {
          if (nextTriggerRef.current) nextTriggerRef.current()
        }, 800)
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => {
      window.removeEventListener('focus', handleFocus)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  const fetchCampaignData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch campaign
      const campaignRes = await fetch('/api/campaigns')
      const campaignJson = await campaignRes.json()
      if (campaignJson.success) {
        const found = campaignJson.data.find(
          (c: CampaignDetail) => c.id === campaignId
        )
        if (found) {
          setCampaign(found)

          // Fetch contacts for this campaign's list
          const contactsRes = await fetch(
            `/api/contacts?listId=${found.list_id}`
          )
          const contactsJson = await contactsRes.json()
          if (contactsJson.success) {
            setContacts(
              contactsJson.data.filter(
                (c: Contact) => c.status !== 'invalid' && c.status !== 'bounced'
              )
            )
          }
        }
      }
    } catch {
      toast.error('Failed to load campaign data')
    } finally {
      setLoading(false)
    }
  }, [campaignId])

  useEffect(() => {
    fetchCampaignData()
  }, [fetchCampaignData])

  // Send a single email — generates mailto link and opens it
  const handleSendOne = async (contactId: string) => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contactId }),
      })
      const json = await res.json()

      if (json.success) {
        // Open mailto link in new tab
        window.open(json.data.mailtoLink, '_blank')

        // Mark as sent in UI
        setSentContacts((prev) => new Set(prev).add(contactId))

        // Update campaign counter
        setCampaign((prev) =>
          prev ? { ...prev, sent_count: prev.sent_count + 1 } : prev
        )

        toast.success(`Email ready for ${json.data.contactEmail}`)
      } else {
        toast.error(json.error || 'Failed to send')
      }
    } catch {
      toast.error('Failed to generate email')
    }
  }

  // Auto Scout — batch send with delay between each
  const handleAutoScout = async () => {
    const unsent = contacts.filter((c) => !sentContacts.has(c.id))
    if (unsent.length === 0) {
      toast.info('All contacts have been sent already!')
      return
    }

    const limit = parseInt(batchLimit) || 1
    const toSend = unsent.slice(0, limit)

    setAutoScoutRunning(true)
    autoScoutAbort.current = false
    setAutoScoutProgress(0)

    for (let i = 0; i < toSend.length; i++) {
      if (autoScoutAbort.current) {
        toast.info(`Auto Scout stopped. Sent ${i} of ${toSend.length}.`)
        break
      }

      const contact = toSend[i]
      setCurrentContactEmail(contact.email)
      setAutoScoutProgress(Math.round(((i + 1) / toSend.length) * 100))

      try {
        const res = await fetch(`/api/campaigns/${campaignId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: contact.id }),
        })
        const json = await res.json()

        if (json.success) {
          // Use location.href for smoother mailto handling (doesn't open empty tabs)
          window.location.href = json.data.mailtoLink
          
          setSentContacts((prev) => new Set(prev).add(contact.id))
          setCampaign((prev) =>
            prev ? { ...prev, sent_count: prev.sent_count + 1 } : prev
          )
        } else {
          if (res.status === 429) {
            toast.error('Daily limit reached! Upgrade to Premium.')
            break
          }
          toast.error(`Failed for ${contact.email}: ${json.error}`)
        }
      } catch {
        toast.error(`Error sending to ${contact.email}`)
      }

      // Wait for next with focus-triggered skip
      if (i < toSend.length - 1 && !autoScoutAbort.current) {
        setCountdown(5)
        await new Promise<void>((resolve) => {
          nextTriggerRef.current = () => {
             nextTriggerRef.current = null
             if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
             setCountdown(0)
             resolve()
          }
          
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                if (nextTriggerRef.current) nextTriggerRef.current()
                return 0
              }
              return prev - 1
            })
          }, 1000)
        })
      }
    }

    setAutoScoutRunning(false)
    if (!autoScoutAbort.current) {
      toast.success(`Auto Scout batch of ${toSend.length} complete! Check your email client.`)
    }
  }

  const stopAutoScout = () => {
    autoScoutAbort.current = true
    if (nextTriggerRef.current) nextTriggerRef.current() // Wake up the promise loop
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setCountdown(0)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Campaign not found</p>
        <Link href="/dashboard/campaigns">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Campaigns
          </Button>
        </Link>
      </div>
    )
  }

  const remaining = contacts.length - sentContacts.size
  const progressPct =
    contacts.length > 0
      ? Math.round((sentContacts.size / contacts.length) * 100)
      : 0

  return (
    <div className="space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
            {campaign.name}
            <CampaignStatusBadge status={campaign.status} />
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Send personalized emails to your contacts
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-indigo-500/10 p-2.5">
                <Mail className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contacts.length}</p>
                <p className="text-xs text-muted-foreground">Total Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-emerald-500/10 p-2.5">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{sentContacts.size}</p>
                <p className="text-xs text-muted-foreground">Sent This Session</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-amber-500/10 p-2.5">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {remaining}
                </p>
                <p className="text-xs text-muted-foreground">Remaining</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto Scout section */}
      <Card className="border-indigo-500/20 bg-gradient-to-r from-indigo-50/50 to-violet-50/50 dark:from-indigo-950/20 dark:to-violet-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-amber-500" />
              Auto Scout
            </div>
            <Badge variant="outline" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
              {campaign.sending_mode === 'auto' ? 'Full Automation' : 'Quick Send (mailto)'}
            </Badge>
          </CardTitle>
          <CardDescription>
            {campaign.sending_mode === 'auto' 
              ? 'Use the Auto Scout Chrome Extension for full 100% browser automation.'
              : 'Automatically open email for each contact with 5-second intervals'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {campaign.sending_mode === 'auto' ? (
            <div className="bg-indigo-950/40 p-4 rounded-lg border border-indigo-500/30">
              <h4 className="font-semibold text-white mb-2 flex items-center gap-2">
                <Play className="h-4 w-4" /> Ready for Chrome Extension
              </h4>
              <p className="text-sm text-slate-300 mb-4">
                You have configured this campaign for Full Automation. To start sending, open the <strong>Auto Scout Chrome Extension</strong> and paste this Campaign ID:
              </p>
              <code className="block w-full p-3 bg-black/50 rounded text-indigo-300 font-mono text-sm border border-white/5 select-all text-center">
                {campaign.id}
              </code>
              <p className="text-xs text-slate-500 mt-3 text-center">
                Current Index: {campaign.current_index || 0} / {contacts.length}
              </p>
            </div>
          ) : (
            <div className="flex items-end gap-4 max-w-md">
            {!autoScoutRunning ? (
              <>
                <div className="flex-1 space-y-1.5">
                  <Label htmlFor="scout-limit" className="text-xs font-semibold">Amount to Send</Label>
                  <Input 
                    id="scout-limit"
                    type="number"
                    value={batchLimit}
                    onChange={(e) => setBatchLimit(e.target.value)}
                    className="h-10"
                    min="1"
                    max={remaining}
                  />
                </div>
                <Button
                  onClick={handleAutoScout}
                  disabled={contacts.length === 0 || remaining === 0}
                  className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white h-10"
                  id="auto-scout-btn"
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Start Auto Scout
                </Button>
              </>
            ) : (
              <Button
                onClick={stopAutoScout}
                variant="destructive"
                className="w-full h-10"
                id="stop-scout-btn"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Auto Scout
              </Button>
            )}
          </div>

          {autoScoutRunning && (
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Batch Progress</span>
                <span>{autoScoutProgress}%</span>
              </div>
              <Progress value={autoScoutProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center italic">
                Tip: Allow popups and keep this tab active for best results.
              </p>
            </div>
          )}
          
          {campaign.sending_mode !== 'auto' && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <Button 
                variant="link" 
                className="text-xs text-indigo-400 p-0 h-auto"
                onClick={async () => {
                  toast.success("Switched to Full Automation mode!");
                  setCampaign(prev => prev ? {...prev, sending_mode: 'auto'} : prev);
                }}
              >
                Switch to Full Chrome Extension Automation →
              </Button>
            </div>
          )}
          {campaign.sending_mode === 'auto' && (
             <div className="mt-4">
               <Button 
                 variant="link" 
                 className="text-xs text-slate-400 p-0 h-auto"
                 onClick={async () => {
                   toast.success("Switched back to Quick Send mode");
                   setCampaign(prev => prev ? {...prev, sending_mode: 'quick'} : prev);
                 }}
               >
                 ← Back to Quick Send (mailto)
               </Button>
             </div>
          )}
          
          </div>
        </CardContent>
      </Card>

      {/* Session progress */}
      {sentContacts.size > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Overall Session progress</span>
            <span>{progressPct}%</span>
          </div>
          <Progress value={progressPct} className="h-2" />
        </div>
      )}

      {/* Contacts table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contacts</CardTitle>
          <CardDescription>
            Click &quot;Send&quot; to open your email client with a pre-filled,
            personalized email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead className="text-center w-24">Status</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => {
                  const isSent = sentContacts.has(contact.id)
                  return (
                    <TableRow
                      key={contact.id}
                      className={isSent ? 'opacity-60' : ''}
                    >
                      <TableCell className="font-mono text-sm">
                        {contact.email}
                      </TableCell>
                      <TableCell className="text-sm">
                        {contact.name || '—'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {contact.company || '—'}
                      </TableCell>
                      <TableCell className="text-center">
                        <EmailJobStatusBadge
                          status={isSent ? 'sent' : 'pending'}
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant={isSent ? 'ghost' : 'default'}
                          onClick={() => handleSendOne(contact.id)}
                          disabled={autoScoutRunning}
                          className={
                            isSent
                              ? 'text-xs'
                              : 'text-xs bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white'
                          }
                          id={`send-${contact.id}`}
                        >
                          {isSent ? (
                            <>
                              <ExternalLink className="mr-1 h-3 w-3" />
                              Resend
                            </>
                          ) : (
                            <>
                              <Send className="mr-1 h-3 w-3" />
                              Send
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
          {contacts.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">
              No valid contacts in this campaign&apos;s list
            </p>
          )}
        </CardContent>
      </Card>

      {/* Floating Status Bar for Auto Scout */}
      {autoScoutRunning && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-[#020617]/95 backdrop-blur-2xl border-t border-white/10 z-[1000] animate-in slide-in-from-bottom duration-300 shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.6)]">
           <div className="max-w-2xl mx-auto space-y-4 text-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      {countdown > 0 ? 'Preparing Next' : 'Auto Scout Running'} 
                    </p>
                    <span className="text-slate-500 font-black text-[10px]">({sentContacts.size} / {campaign.total_emails})</span>
                  </div>
                  <p className="text-sm font-bold truncate">
                    {currentContactEmail || 'Processing...'}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={stopAutoScout} className="rounded-xl h-12 font-black px-5 shadow-lg shadow-red-500/20">
                  <Square className="mr-2 h-4 w-4 fill-white" /> STOP
                </Button>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                  <span>Batch Progress</span>
                  <span>{autoScoutProgress}%</span>
                </div>
                <Progress value={autoScoutProgress} className="h-2 rounded-full bg-white/10" />
              </div>
              
              {countdown > 0 && (
                <Button
                  onClick={() => {
                    if (nextTriggerRef.current) nextTriggerRef.current()
                  }}
                  className="w-full h-14 text-lg font-black rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 text-white animate-pulse"
                >
                  <Play className="mr-2 h-5 w-5 fill-white" />
                  SEND NEXT IN {countdown}...
                </Button>
              )}
           </div>
        </div>
      )}
    </div>
  )
}
