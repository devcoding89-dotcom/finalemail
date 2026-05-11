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
import type { EmailList, Contact } from '@/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  Play,
} from 'lucide-react'

interface EmailEntry {
  email: string
  name: string
  status: 'pending' | 'sending' | 'sent' | 'failed'
}

export default function QuickSendPage() {
  const [emailInput, setEmailInput] = useState('')
  const [emails, setEmails] = useState<EmailEntry[]>([])
  const [subject, setSubject] = useState('Quick Question for {name}')
  const [body, setBody] = useState('')
  const [activeBatch, setActiveBatch] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const [progress, setProgress] = useState(0)
  const [batchLimit, setBatchLimit] = useState('10')
  const [isAutoSending, setIsAutoSending] = useState(false)
  const [sentInBatch, setSentInBatch] = useState(0)
  const [countdown, setCountdown] = useState(0)
  const [lists, setLists] = useState<EmailList[]>([])
  const [selectedListId, setSelectedListId] = useState<string>('')
  const [isFetchingLists, setIsFetchingLists] = useState(true)
  const [isFetchingContacts, setIsFetchingContacts] = useState(false)
  
  // Refs for stable values across timeouts and event listeners
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null)
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const isAutoSendingRef = useRef(false)
  const emailsRef = useRef<EmailEntry[]>([])
  const currentIndexRef = useRef(-1)
  const sentInBatchRef = useRef(0)
  const batchLimitRef = useRef(10)
  const subjectRef = useRef(subject)
  const bodyRef = useRef(body)

  // Keep refs in sync
  useEffect(() => {
    emailsRef.current = emails
    currentIndexRef.current = currentIndex
    sentInBatchRef.current = sentInBatch
    batchLimitRef.current = parseInt(batchLimit) || 10
    subjectRef.current = subject
    bodyRef.current = body
  }, [emails, currentIndex, sentInBatch, batchLimit, subject, body])

  // Smart Focus Trigger: When user returns to the tab, if we're waiting, trigger next.
  useEffect(() => {
    const handleFocus = () => {
      // If we are auto-sending and the window gets focus, it means the user likely 
      // just came back from their email app. Trigger the next one immediately!
      if (isAutoSendingRef.current) {
        console.log('[QuickSend] Tab focused, triggering next email immediately...')
        triggerNextNow()
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [])

  // Stop everything on unmount
  useEffect(() => {
    return () => {
      stopBatch()
    }
  }, [])

  // Fetch lists on mount
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const res = await fetch('/api/lists')
        const json = await res.json()
        if (json.success && json.data) {
          setLists(json.data)
        }
      } catch (err) {
        console.error('Failed to fetch lists', err)
      } finally {
        setIsFetchingLists(false)
      }
    }
    fetchLists()
  }, [])

  // Add emails from input
  const addEmails = () => {
    const lines = emailInput.split(/[\n,;]+/).map(l => l.trim()).filter(l => l.length > 0);
    const newEntries: EmailEntry[] = [];

    lines.forEach(line => {
      let email = '';
      let name = '';

      // Match "Name <email@...>"
      const match = line.match(/^([^<]+)<([^>]+)>$/);
      if (match) {
        name = match[1].trim();
        email = match[2].trim();
      } else {
        email = line;
        // Simple extraction: john.doe@... -> John Doe
        const namePart = email.split('@')[0].split(/[._-]+/);
        name = namePart.map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' ');
      }

      if (email.includes('@') && !emails.some(ex => ex.email === email)) {
        newEntries.push({ email, name, status: 'pending' });
      }
    });

    if (newEntries.length === 0) {
      toast.error('No new valid emails found');
      return
    }

    setEmails((prev) => [...prev, ...newEntries]);
    setEmailInput('')
    toast.success(`Added ${newEntries.length} contact(s)`)
  }

  const removeEmail = (email: string) => {
    setEmails((prev) => prev.filter((e) => e.email !== email))
  }

  const importFromList = async () => {
    if (!selectedListId) return
    setIsFetchingContacts(true)
    try {
      const res = await fetch(`/api/contacts?listId=${selectedListId}`)
      const json = await res.json()
      if (json.success && json.data) {
        const contacts: Contact[] = json.data
        const newEntries: EmailEntry[] = contacts
          .filter(c => c.email && !emailsRef.current.some(ex => ex.email === c.email))
          .map(c => ({
            email: c.email,
            name: c.name || c.email.split('@')[0],
            status: 'pending'
          }))
          
        if (newEntries.length === 0) {
          toast.info('No new contacts found in this list')
        } else {
          setEmails(prev => [...prev, ...newEntries])
          toast.success(`Imported ${newEntries.length} contacts!`)
          setSelectedListId('') // Reset selection
        }
      } else {
        toast.error(json.error || 'Failed to import contacts')
      }
    } catch (err) {
      console.error(err)
      toast.error('An error occurred during import')
    } finally {
      setIsFetchingContacts(false)
    }
  }

  // Generate mailto link
  const getMailto = (entry: EmailEntry) => {
    const personalizedSubject = subjectRef.current.replace(/\{name\}/gi, entry.name)
    const personalizedBody = bodyRef.current.replace(/\{name\}/gi, entry.name).replace(/\{email\}/gi, entry.email)
    return `mailto:${encodeURIComponent(entry.email)}?subject=${encodeURIComponent(personalizedSubject)}&body=${encodeURIComponent(personalizedBody)}`
  }

  // BATCH SEND LOGIC
  const startBatch = () => {
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
    openEmail(pendingIndex, 0, limit)
  }

  const openEmail = (index: number, currentBatchCount: number, limit: number) => {
    // Check if we should stop
    if (index >= emailsRef.current.length || currentBatchCount >= limit || !isAutoSendingRef.current) {
      stopBatch()
      if (currentBatchCount > 0) {
        toast.success(`Batch of ${currentBatchCount} complete!`)
      }
      return
    }

    const entry = emailsRef.current[index]
    if (entry.status !== 'pending') {
      const nextPending = emailsRef.current.findIndex((e, i) => i > index && e.status === 'pending')
      if (nextPending !== -1) {
        openEmail(nextPending, currentBatchCount, limit)
      } else {
        stopBatch()
      }
      return
    }

    setCurrentIndex(index)
    
    const mailtoUrl = getMailto(entry)
    window.location.href = mailtoUrl // Using location.href is more reliable on mobile for mailto
    
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

    // Start countdown for next
    if (isAutoSendingRef.current && (currentBatchCount + 1) < limit) {
      startCountdown(index, currentBatchCount + 1, limit)
    } else if ((currentBatchCount + 1) >= limit) {
      setTimeout(() => stopBatch(), 500)
    }
  }

  const startCountdown = (lastIndex: number, nextBatchCount: number, limit: number) => {
    setCountdown(3) // 3 second countdown
    
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
          const nextPending = emailsRef.current.findIndex((e, i) => i > lastIndex && e.status === 'pending')
          if (nextPending !== -1) {
            openEmail(nextPending, nextBatchCount, limit)
          } else {
            stopBatch()
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const triggerNextNow = () => {
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setCountdown(0)
    
    // Find the next pending email
    const nextPending = emailsRef.current.findIndex((e, i) => i > currentIndexRef.current && e.status === 'pending')
    
    // Small delay to ensure the UI updates and the user sees what's happening
    // before the next mailto triggers.
    if (nextPending !== -1) {
      setTimeout(() => {
        if (isAutoSendingRef.current) {
          openEmail(nextPending, sentInBatchRef.current, batchLimitRef.current)
        }
      }, 800) 
    } else {
      stopBatch()
    }
  }

  const stopBatch = () => {
    if (autoSendTimerRef.current) clearTimeout(autoSendTimerRef.current)
    if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    setIsAutoSending(false)
    isAutoSendingRef.current = false
    setActiveBatch(false)
    setCurrentIndex(-1)
    setCountdown(0)
  }

  const pendingCount = emails.filter((e) => e.status === 'pending').length

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-32 md:pb-8">
      {/* Header */}
      <div className="flex items-center justify-between px-2">
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
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-600">
            <Users className="h-4 w-4" />
            Step 1: Add Recipients
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {/* List Import Section */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1">Import from Saved List</Label>
            <div className="flex gap-2">
              <Select value={selectedListId} onValueChange={setSelectedListId} disabled={isFetchingLists || lists.length === 0}>
                <SelectTrigger className="w-full h-12 bg-white dark:bg-slate-950 rounded-xl border-slate-200 dark:border-slate-800 shadow-sm">
                  <SelectValue placeholder={isFetchingLists ? "Loading lists..." : lists.length === 0 ? "No lists available" : "Select a list..."} />
                </SelectTrigger>
                <SelectContent>
                  {lists.map(list => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name} ({list.total_contacts} contacts)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={importFromList} 
                disabled={!selectedListId || isFetchingContacts}
                className="h-12 px-5 rounded-xl bg-violet-100 text-violet-700 hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-400 font-bold transition-all"
              >
                {isFetchingContacts ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Users className="h-4 w-4 mr-2" />}
                Import
              </Button>
            </div>
          </div>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink-0 mx-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">OR PASTE EMAILS</span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          <textarea
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder={"Paste emails here...\njohn@company.com\njane@agency.ng"}
            className="w-full min-h-[100px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
          />
          <Button
            onClick={addEmails}
            disabled={!emailInput.trim()}
            className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 h-12 font-bold shadow-lg shadow-indigo-500/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add to List
          </Button>

          {emails.length > 0 && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap gap-1.5 pt-2 max-h-[300px] overflow-y-auto pr-2 pb-2">
              {emails.map((entry, i) => (
                <Badge
                  key={entry.email}
                  variant="secondary"
                  className={cn(
                    "pl-2 pr-1 py-1 rounded-lg text-[11px] gap-1.5 border transition-colors",
                    entry.status === 'sent' 
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                      : "bg-orange-500/10 text-orange-600 border-orange-500/30"
                  )}
                >
                  <span className="text-[8px] font-black opacity-50">#{i + 1}</span>
                  {entry.status === 'sent' && <CheckCircle2 className="h-3 w-3" />}
                  <span className="font-black italic uppercase text-[9px]">{entry.name}</span>
                  <span 
                    className="opacity-60 cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-400 hover:opacity-100 hover:underline transition-colors"
                    onClick={() => {
                      window.location.href = getMailto(entry);
                      setEmails((prev) =>
                        prev.map((e, idx) => (idx === i ? { ...e, status: 'sent' } : e))
                      );
                      fetch('/api/logs/quick-send', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: entry.email }),
                      }).catch(console.error);
                    }}
                    title="Click to send message"
                  >
                    ({entry.email})
                  </span>
                  {entry.status === 'pending' && (
                    <button onClick={() => removeEmail(entry.email)} className="hover:text-red-500 ml-1">
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              </div>
              <Button 
                variant="outline" 
                onClick={() => {
                  document.getElementById('step-2-config')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="w-full text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900/50 dark:hover:bg-indigo-950 font-bold"
              >
                Continue to Settings <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Step 2: Configuration */}
      <Card id="step-2-config" className="border-indigo-500/20 bg-indigo-50/20 dark:bg-indigo-950/10 rounded-2xl scroll-mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-600">
            <Settings2 className="h-4 w-4" />
            Step 2: How many to send?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
           <div className="space-y-2">
              <Label htmlFor="batch-limit" className="text-[10px] font-black uppercase text-slate-500 tracking-widest ml-1 flex justify-between">
                <span>Amount to Auto-Send</span>
                <span className="text-indigo-600">{batchLimit} emails</span>
              </Label>
              <Input 
                id="batch-limit"
                type="number"
                value={batchLimit}
                onChange={(e) => setBatchLimit(e.target.value)}
                className="h-14 rounded-xl bg-white dark:bg-slate-950 font-black text-2xl text-center text-indigo-600 shadow-lg border-indigo-200 dark:border-indigo-900"
                min="1"
              />
              <p className="text-[10px] text-center text-slate-400 font-bold italic">
                Choose the number of emails to trigger in this automatic session.
              </p>
           </div>
        </CardContent>
      </Card>

      {/* Step 3: Message */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl">
        <CardHeader className="pb-3 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-bold flex items-center gap-2 text-indigo-600">
            <Mail className="h-4 w-4" />
            Step 3: Write Message
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Subject</Label>
            <Input
              placeholder="e.g. Quick Question"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="rounded-xl h-11 bg-white dark:bg-slate-950"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Body</Label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={"Hi there,\n\nI wanted to connect..."}
              className="w-full min-h-[160px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
            />
          </div>
        </CardContent>
      </Card>

      {/* Start Button */}
      <div className="pt-2 px-2">
         <Button
            onClick={startBatch}
            disabled={pendingCount === 0 || activeBatch}
            className="w-full h-20 text-2xl font-black rounded-3xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-2xl shadow-indigo-500/30 transition-all active:scale-95 flex flex-col items-center justify-center gap-1"
          >
            <div className="flex items-center gap-2">
               <Zap className="h-7 w-7 fill-white" />
               {activeBatch ? 'SESSION ACTIVE' : 'START AUTO-SEND'}
            </div>
            {!activeBatch && <span className="text-[10px] opacity-70 font-bold uppercase tracking-widest">Process {Math.min(pendingCount, parseInt(batchLimit))} Emails</span>}
          </Button>
          <p className="text-[10px] text-center text-slate-400 font-bold italic mt-4 px-4 leading-relaxed">
             NOTE: Your browser will switch to your email app. Just send the email and return here for the next one.
          </p>
      </div>

      {/* Active Session Status (Floating Footer) */}
      {activeBatch && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-[#020617]/95 backdrop-blur-2xl border-t border-white/10 z-[1000] animate-in slide-in-from-bottom duration-300 shadow-[0_-30px_60px_-15px_rgba(0,0,0,0.6)]">
           <div className="max-w-2xl mx-auto space-y-4 text-white">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                      {countdown > 0 ? 'Preparing Next' : 'Session Running'} 
                    </p>
                    <span className="text-slate-500 font-black text-[10px]">({sentInBatch} / {batchLimit})</span>
                  </div>
                  <p className="text-sm font-bold truncate">
                    {emails[currentIndex]?.email || 'Processing...'}
                  </p>
                </div>
                <Button variant="destructive" size="sm" onClick={stopBatch} className="rounded-xl h-12 font-black px-5 shadow-lg shadow-red-500/20">
                  <Square className="mr-2 h-4 w-4 fill-white" /> STOP
                </Button>
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-black uppercase text-slate-500">
                  <span>Progress</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2 rounded-full bg-white/10" />
              </div>
              
              {countdown > 0 && (
                <Button
                  onClick={triggerNextNow}
                  className="w-full h-14 text-lg font-black rounded-2xl bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/30 text-white animate-pulse"
                >
                  <Play className="mr-2 h-5 w-5 fill-white" />
                  SEND NEXT IN {countdown}...
                </Button>
              )}

              {!isAutoSending && !countdown && (
                <Button
                  onClick={() => {
                    isAutoSendingRef.current = true
                    setIsAutoSending(true)
                    openEmail(currentIndex + 1, sentInBatch, parseInt(batchLimit))
                  }}
                  className="w-full h-14 text-lg font-black rounded-2xl bg-emerald-600 hover:bg-emerald-500 shadow-xl shadow-emerald-600/30 text-white"
                >
                  RESUME SESSION
                  <ArrowRight className="ml-2 h-6 w-6" />
                </Button>
              )}
           </div>
        </div>
      )}
    </div>
  )
}
