'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import {
  Plus,
  Mail,
  RefreshCw,
  Users,
  FileText,
  ArrowRight,
  Send,
  Trash2,
} from 'lucide-react'
import type { Campaign, EmailList, Template } from '@/types'
import { CampaignStatusBadge } from '@/components/campaign-status-badge'
import Link from 'next/link'

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [lists, setLists] = useState<EmailList[]>([])
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form
  const [campaignName, setCampaignName] = useState('')
  const [selectedListId, setSelectedListId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      const [campaignsRes, listsRes, templatesRes] = await Promise.all([
        fetch('/api/campaigns'),
        fetch('/api/lists'),
        fetch('/api/templates'),
      ])
      const [campaignsJson, listsJson, templatesJson] = await Promise.all([
        campaignsRes.json(),
        listsRes.json(),
        templatesRes.json(),
      ])

      if (campaignsJson.success) setCampaigns(campaignsJson.data)
      if (listsJson.success) setLists(listsJson.data)
      if (templatesJson.success) setTemplates(templatesJson.data)
    } catch {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCreate = async () => {
    if (!campaignName.trim() || !selectedListId || !selectedTemplateId) {
      toast.error('Please fill in all fields')
      return
    }

    setCreating(true)
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: campaignName.trim(),
          list_id: selectedListId,
          template_id: selectedTemplateId,
        }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success('Campaign created!')
        setDialogOpen(false)
        resetForm()
        fetchData()
      } else {
        toast.error(json.error || 'Failed to create campaign')
      }
    } catch {
      toast.error('Failed to create campaign')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return

    setDeletingId(id)
    try {
      const res = await fetch(`/api/campaigns?id=${id}`, {
        method: 'DELETE',
      })
      const json = await res.json()

      if (json.success) {
        toast.success('Campaign deleted')
        fetchData()
      } else {
        toast.error(json.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete campaign')
    } finally {
      setDeletingId(null)
    }
  }

  const resetForm = () => {
    setCampaignName('')
    setSelectedListId('')
    setSelectedTemplateId('')
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Create and manage your email outreach campaigns
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25"
              id="new-campaign-btn"
            >
              <Plus className="mr-2 h-4 w-4" />
              New <span className="hidden md:inline ml-1">Campaign</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-indigo-500" />
                Create Campaign
              </DialogTitle>
              <DialogDescription>
                Select a contact list and template to create your campaign
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Campaign name */}
              <div className="space-y-2">
                <Label htmlFor="campaign-name">Campaign Name</Label>
                <Input
                  id="campaign-name"
                  placeholder="e.g. Lagos Tech Outreach"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  disabled={creating}
                />
              </div>

              {/* Select list */}
              <div className="space-y-2">
                <Label>Contact List</Label>
                {lists.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 rounded-lg border border-dashed text-center">
                    No lists yet.{' '}
                    <Link
                      href="/dashboard/lists"
                      className="text-indigo-500 hover:underline"
                    >
                      Upload one first
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {lists.map((list) => (
                      <div
                        key={list.id}
                        onClick={() => setSelectedListId(list.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedListId === list.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                            : 'hover:border-muted-foreground/30 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold">
                            {list.name}
                          </span>
                          <Badge variant="outline" className="text-[10px] font-black uppercase">
                            {list.total_contacts} Contacts
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Select template */}
              <div className="space-y-2">
                <Label>Email Template</Label>
                {templates.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-3 rounded-lg border border-dashed text-center">
                    No templates yet.{' '}
                    <Link
                      href="/dashboard/templates"
                      className="text-indigo-500 hover:underline"
                    >
                      Create one first
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {templates.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          selectedTemplateId === tmpl.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                            : 'hover:border-muted-foreground/30 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-bold truncate block">
                              {tmpl.name}
                            </span>
                            <p className="text-[10px] text-muted-foreground truncate italic">
                              {tmpl.subject}
                            </p>
                          </div>
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Create button */}
              <Button
                onClick={handleCreate}
                disabled={
                  !campaignName.trim() ||
                  !selectedListId ||
                  !selectedTemplateId ||
                  creating
                }
                className="w-full h-12 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black shadow-lg shadow-indigo-500/20"
                id="create-campaign-btn"
              >
                {creating ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  'CREATE CAMPAIGN'
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Campaigns list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card className="border-dashed border-slate-200 dark:border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4 text-slate-400">
              <Mail className="h-8 w-8" />
            </div>
            <CardTitle className="text-lg mb-1">No campaigns yet</CardTitle>
            <CardDescription className="mb-6 text-center max-w-sm">
              Create your first campaign to start reaching out to your contacts!
            </CardDescription>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 pb-12">
          {campaigns.map((campaign) => {
            const progress =
              campaign.total_emails > 0
                ? Math.round(
                    (campaign.sent_count / campaign.total_emails) * 100
                  )
                : 0

            return (
              <Card
                key={campaign.id}
                className="group border-slate-200 dark:border-slate-800 shadow-sm transition-all"
              >
                <CardHeader className="pb-3 px-4">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base truncate font-bold">
                        {campaign.name}
                      </CardTitle>
                      <CardDescription className="text-[10px] uppercase font-black text-slate-400 tracking-widest mt-0.5">
                        {campaign.total_emails} Contacts
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-2">
                       <CampaignStatusBadge status={campaign.status} />
                       <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          onClick={() => handleDelete(campaign.id)}
                          disabled={deletingId === campaign.id}
                        >
                          {deletingId === campaign.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-4">
                    {/* Progress */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase">
                        <span>
                          {campaign.sent_count} / {campaign.total_emails} sent
                        </span>
                        <span className="text-indigo-600">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-2 rounded-full bg-slate-100 dark:bg-slate-900" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-[10px] text-slate-400 font-bold">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                      <Link href={`/dashboard/campaigns/${campaign.id}/send`}>
                        <Button
                          size="sm"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-black uppercase tracking-wider rounded-lg h-8 px-4"
                        >
                          SEND NOW
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
