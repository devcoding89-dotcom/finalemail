'use client'
// Force build trigger 1


import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Copy, Mail, Zap, Check, X, Pause, RefreshCw, ArrowLeft, User, Building } from 'lucide-react'
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
  templates: {
    subject: string
    body: string
  }[] | any
}

interface Contact {
  id: string
  email: string
  name: string
  company: string
  status: string
}

export default function CampaignSendPage() {
  const params = useParams()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<CampaignDetail | null>(null)
  const [contacts, setContacts] = useState<Contact[]>([])
  const [loading, setLoading] = useState(true)
  const [sendingMode, setSendingMode] = useState<'manual' | 'quick' | 'auto'>('manual')
  const [currentIndex, setCurrentIndex] = useState(0)

  const fetchCampaignData = useCallback(async () => {
    try {
      setLoading(true)
      const campaignRes = await fetch('/api/campaigns')
      const campaignJson = await campaignRes.json()
      
      if (campaignJson.success) {
        const found = campaignJson.data.find((c: CampaignDetail) => c.id === campaignId)
        if (found) {
          setCampaign(found)
          setSendingMode(found.sending_mode || 'manual')
          setCurrentIndex(found.current_index || 0)

          const contactsRes = await fetch(`/api/contacts?listId=${found.list_id}`)
          const contactsJson = await contactsRes.json()
          if (contactsJson.success) {
            setContacts(
              contactsJson.data
                .filter((c: Contact) => c.status !== 'invalid' && c.status !== 'bounced')
                .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
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

  const handleUpdateMode = async (mode: 'manual' | 'quick' | 'auto') => {
    setSendingMode(mode)
    // Update in DB (optional, assuming we had an endpoint)
    toast.success(`Switched to ${mode} mode`)
  }

  const getPersonalizedData = (contact: Contact) => {
    const template = campaign?.templates?.[0] || campaign?.templates
    if (!contact || !template) return { subject: '', body: '' }

    const contactName = contact.name || 'there'
    const contactCompany = contact.company || 'your company'
    
    return {
      subject: template.subject
        .replace(/\{name\}/gi, contactName)
        .replace(/\{company\}/gi, contactCompany),
      body: template.body
        .replace(/\{name\}/gi, contactName)
        .replace(/\{company\}/gi, contactCompany)
    }
  }

  const handleOpenGmail = (contactOverride?: Contact) => {
    const targetContact = contactOverride || currentContact
    if (!targetContact) return

    const { subject, body } = getPersonalizedData(targetContact)
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetContact.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.open(gmailUrl, 'emailll_target')
  }

  const handleMarkSent = async (status: 'sent' | 'failed') => {
    if (!campaign || !contacts[currentIndex]) return

    // INSTANTLY OPEN NEXT IN QUICK MODE (to avoid popup blocker)
    const nextIndex = currentIndex + 1
    if (sendingMode === 'quick' && nextIndex < contacts.length) {
      handleOpenGmail(contacts[nextIndex])
    }

    try {
      const res = await fetch(`/api/campaigns/${campaignId}/mark-sent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contactId: contacts[currentIndex].id,
          method: sendingMode
        }),
      })

      if (res.ok) {
        setCurrentIndex(nextIndex)
        setCampaign(prev => prev ? { 
          ...prev, 
          sent_count: status === 'sent' ? prev.sent_count + 1 : prev.sent_count,
          current_index: prev.current_index + 1
        } : prev)
        
        if (status === 'sent') toast.success('Marked as sent!')
        else toast.info('Skipped contact.')
      } else {
        toast.error('Failed to update status')
      }
    } catch {
      toast.error('Network error')
    }
  }

  const handleCopyEmail = () => {
    const { body } = getPersonalizedData(currentContact!)
    if (!body) return
    navigator.clipboard.writeText(body)
    toast.success('Email copied to clipboard!')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!campaign || contacts.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Campaign not found or no contacts.</p>
        <Link href="/dashboard/campaigns">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Campaigns
          </Button>
        </Link>
      </div>
    )
  }

  const isComplete = currentIndex >= contacts.length
  const currentContact = isComplete ? null : contacts[currentIndex]
  const { subject: personalizedSubject, body: personalizedBody } = getPersonalizedData(currentContact!)

  const progressPct = contacts.length > 0 ? Math.round((currentIndex / contacts.length) * 100) : 0

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/dashboard/campaigns">
          <Button variant="ghost" size="sm" className="text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
        </Link>
        <h1 className="text-xl font-bold truncate max-w-[200px]">{campaign.name}</h1>
      </div>

      <Card className="border-indigo-500/20 shadow-xl dark:bg-slate-900/50">
        <CardHeader className="pb-4 border-b border-white/5">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Sending Controls</CardTitle>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Mode:</span>
              <Select value={sendingMode} onValueChange={(val: any) => handleUpdateMode(val)}>
                <SelectTrigger className="w-[140px] h-8 text-xs bg-slate-100 dark:bg-slate-800 border-none">
                  <SelectValue placeholder="Select Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manual</SelectItem>
                  <SelectItem value="quick">Quick Send</SelectItem>
                  <SelectItem value="auto">Auto Scout</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <span>Progress: {currentIndex} / {contacts.length} sent</span>
              <span className="text-indigo-500">{progressPct}%</span>
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          {isComplete ? (
            <div className="py-12 text-center space-y-4">
              <div className="h-16 w-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-8 w-8 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold">Campaign Complete!</h3>
              <p className="text-muted-foreground">All contacts in this list have been processed.</p>
            </div>
          ) : (
            <>
              {/* Current Contact Info */}
              <div className="bg-slate-100 dark:bg-slate-800/50 p-4 rounded-xl space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 bg-indigo-500/10 text-indigo-500 text-[10px] font-black uppercase tracking-widest rounded-bl-xl border-b border-l border-indigo-500/10">
                   Contact #{currentIndex + 1} of {contacts.length}
                </div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Contact:</p>
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-slate-400" />
                  <span className="font-mono text-sm">{currentContact?.email}</span>
                </div>
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{currentContact?.name || 'No name'}</span>
                  <span className="text-slate-300">@</span>
                  <Building className="h-4 w-4 text-slate-400" />
                  <span className="text-sm">{currentContact?.company || 'No company'}</span>
                </div>
              </div>

              {/* Email Preview */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-black">
                <div className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-3 text-sm font-medium flex gap-2">
                  <span className="text-muted-foreground">Subject:</span> {personalizedSubject}
                </div>
                <div className="p-4 text-sm whitespace-pre-wrap font-sans leading-relaxed text-slate-700 dark:text-slate-300 min-h-[120px]">
                  {personalizedBody}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-4">
                <Button 
                    className="w-full h-16 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xl shadow-xl shadow-indigo-500/30 group animate-in zoom-in-95 duration-300"
                    onClick={() => {
                      if (currentIndex === 0 && !sendingMode) {
                        handleOpenGmail();
                        setSendingMode('manual');
                      } else {
                        handleMarkSent('sent');
                      }
                    }}
                    id="primary-action-btn"
                  >
                    {currentIndex === 0 && !sendingMode ? '🚀 START SENDING' : '✅ SENT — NEXT CONTACT'}
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <div className="grid grid-cols-3 gap-3">
                    <Button 
                      variant="outline"
                      className="h-10 text-[10px] font-bold uppercase"
                      onClick={handleCopyEmail}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" /> Copy
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-10 text-[10px] font-bold uppercase"
                      onClick={() => handleOpenGmail()}
                    >
                      <Mail className="mr-2 h-3.5 w-3.5" /> Re-open
                    </Button>
                    <Button 
                      variant="outline"
                      className={`h-10 text-[10px] font-bold uppercase ${sendingMode === 'auto' ? 'border-indigo-500 bg-indigo-500/10' : ''}`}
                      onClick={() => {
                        setSendingMode('auto')
                        window.postMessage({ 
                          type: 'START_AUTO_SCOUT', 
                          campaignId: campaignId,
                          apiUrl: window.location.origin 
                        }, '*')
                        toast.success('Auto Scout started!')
                      }}
                    >
                      <Zap className="mr-2 h-3.5 w-3.5" /> Auto
                    </Button>
                  </div>
              </div>
            </>
          )}

          <div className="pt-4 flex justify-center">
             <Button variant="ghost" size="sm" className="text-muted-foreground">
               <Pause className="mr-2 h-4 w-4" /> Pause Campaign
             </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
