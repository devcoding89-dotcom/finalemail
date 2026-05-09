'use client'
// Force build trigger 1


import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Copy, Mail, Zap, Check, X, Pause, RefreshCw, ArrowLeft, ArrowRight, User, Building } from 'lucide-react'
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
        <CardContent className="p-6">
          {sendingMode === 'auto' ? (
            /* MODE 3: Auto Scout Active State */
            <div className="space-y-6 animate-in fade-in duration-500">
              <div className="flex items-center justify-between p-4 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-500/30">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-black italic uppercase tracking-wider">Auto Scout Running...</h3>
                    <p className="text-[10px] text-indigo-100 font-bold uppercase">{currentContact?.email}</p>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-white hover:bg-white/10 font-bold"
                  onClick={() => setSendingMode(null)}
                >
                  <Pause className="mr-2 h-4 w-4" /> PAUSE
                </Button>
              </div>

              <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full" />
                    [Opening Gmail...]
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-600">
                    <div className="h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                    [Filling email...]
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                    <div className="h-2 w-2 bg-slate-300 rounded-full" />
                    [Clicking send...]
                  </div>
                  <div className="flex items-center gap-3 text-sm font-bold text-slate-400">
                    <div className="h-2 w-2 bg-slate-300 rounded-full" />
                    [Waiting for confirmation...]
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase mb-2">
                    <span>Progress: {currentIndex} / {contacts.length}</span>
                    <span className="text-indigo-600">{Math.round((currentIndex / contacts.length) * 100)}%</span>
                  </div>
                  <Progress value={(currentIndex / contacts.length) * 100} className="h-3 rounded-full" />
                </div>
              </div>
              
              <div className="flex justify-center">
                <Select defaultValue="normal">
                  <SelectTrigger className="w-[180px] h-10 font-bold uppercase text-[10px]">
                    <Zap className="mr-2 h-3 w-3 text-indigo-500" />
                    <SelectValue placeholder="Speed" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">⚡ Speed: Fast</SelectItem>
                    <SelectItem value="normal">⚡ Speed: Normal</SelectItem>
                    <SelectItem value="slow">⚡ Speed: Slow</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            /* MODE 1 & 2: Manual / Quick Send UI */
            <>
              {/* Progress & Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">Manual Outreach</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black">{currentIndex + 1}</span>
                    <span className="text-slate-300 font-bold">/</span>
                    <span className="text-slate-400 font-bold">{contacts.length}</span>
                  </div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center">
                   <User className="h-6 w-6 text-indigo-600" />
                </div>
              </div>

              {/* Contact Info Card */}
              <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4 mb-6">
                <div className="flex flex-col gap-1">
                   <div className="text-xl font-black tracking-tight">{currentContact?.name || 'Unknown Contact'}</div>
                   <div className="flex items-center gap-2 text-indigo-600 text-sm font-bold">
                     <Mail className="h-3.5 w-3.5" />
                     {currentContact?.email}
                   </div>
                   <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase mt-1">
                     <Building className="h-3.5 w-3.5" />
                     {currentContact?.company || 'No Company'}
                   </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Personalized Message:</p>
                   <div className="p-4 bg-white dark:bg-black rounded-2xl border border-slate-100 dark:border-slate-800 text-sm leading-relaxed min-h-[100px] whitespace-pre-wrap">
                      {personalizedBody}
                   </div>
                </div>
              </div>

              <div className="space-y-4">
                <Button 
                    className="w-full h-16 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-xl shadow-xl shadow-indigo-500/30 group animate-in zoom-in-95 duration-300"
                    onClick={() => {
                      handleOpenGmail();
                      handleMarkSent('sent');
                    }}
                    id="primary-action-btn"
                  >
                    📨 OPEN & SEND NEXT
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
                  </Button>

                  <div className="grid grid-cols-3 gap-3">
                    <Button 
                      variant="outline"
                      className="h-12 text-[10px] font-bold uppercase rounded-2xl"
                      onClick={handleCopyEmail}
                    >
                      <Copy className="mr-2 h-4 w-4" /> Copy
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-12 text-[10px] font-bold uppercase rounded-2xl"
                      onClick={() => handleOpenGmail()}
                    >
                      <Mail className="mr-2 h-4 w-4" /> Mailto
                    </Button>
                    <Button 
                      variant="outline"
                      className="h-12 text-[10px] font-bold uppercase rounded-2xl bg-indigo-50 text-indigo-600 border-indigo-100"
                      onClick={() => setSendingMode('auto')}
                    >
                      <Zap className="mr-2 h-4 w-4" /> Auto Scout
                    </Button>
                  </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
