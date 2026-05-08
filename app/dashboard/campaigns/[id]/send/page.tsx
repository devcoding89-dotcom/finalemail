'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
}

export default function CampaignSendPage() {
  const params = useParams()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [sentContacts, setSentContacts] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [autoScoutRunning, setAutoScoutRunning] = useState(false)
  const [autoScoutProgress, setAutoScoutProgress] = useState(0)
  const autoScoutAbort = useRef(false)

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

    setAutoScoutRunning(true)
    autoScoutAbort.current = false
    setAutoScoutProgress(0)

    for (let i = 0; i < unsent.length; i++) {
      if (autoScoutAbort.current) {
        toast.info(`Auto Scout stopped. Sent ${i} of ${unsent.length}.`)
        break
      }

      const contact = unsent[i]
      setAutoScoutProgress(Math.round(((i + 1) / unsent.length) * 100))

      try {
        const res = await fetch(`/api/campaigns/${campaignId}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contactId: contact.id }),
        })
        const json = await res.json()

        if (json.success) {
          window.open(json.data.mailtoLink, '_blank')
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

      // Wait 5 seconds between sends to avoid overwhelming email client
      if (i < unsent.length - 1 && !autoScoutAbort.current) {
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    }

    setAutoScoutRunning(false)
    if (!autoScoutAbort.current) {
      toast.success('Auto Scout complete! Check your email client.')
    }
  }

  const stopAutoScout = () => {
    autoScoutAbort.current = true
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

  const totalSent = sentContacts.size + (campaign?.sent_count || 0) - sentContacts.size
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
                  {contacts.length - sentContacts.size}
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
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5 text-amber-500" />
            Auto Scout
          </CardTitle>
          <CardDescription>
            Automatically open email for each contact with 5-second intervals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {!autoScoutRunning ? (
              <Button
                onClick={handleAutoScout}
                disabled={contacts.length === 0 || sentContacts.size === contacts.length}
                className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
                id="auto-scout-btn"
              >
                <Zap className="mr-2 h-4 w-4" />
                Start Auto Scout ({contacts.length - sentContacts.size} remaining)
              </Button>
            ) : (
              <Button
                onClick={stopAutoScout}
                variant="destructive"
                id="stop-scout-btn"
              >
                <Square className="mr-2 h-4 w-4" />
                Stop Auto Scout
              </Button>
            )}
          </div>

          {autoScoutRunning && (
            <div className="mt-4 space-y-2">
              <Progress value={autoScoutProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-center">
                Sending {autoScoutProgress}% — please don&apos;t close this tab
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session progress */}
      {sentContacts.size > 0 && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Session progress</span>
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
    </div>
  )
}
