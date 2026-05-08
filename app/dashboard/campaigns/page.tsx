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
        toast.success('Campaign created! Go to Send to start sending.')
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
          <p className="text-muted-foreground mt-1">
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
              New Campaign
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
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {lists.map((list) => (
                      <div
                        key={list.id}
                        onClick={() => setSelectedListId(list.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedListId === list.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                            : 'hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {list.name}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            <Users className="mr-1 h-3 w-3" />
                            {list.total_contacts}
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
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {templates.map((tmpl) => (
                      <div
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          selectedTemplateId === tmpl.id
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                            : 'hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-sm font-medium">
                              {tmpl.name}
                            </span>
                            <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {tmpl.subject}
                            </p>
                          </div>
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
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
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
                id="create-campaign-btn"
              >
                {creating ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Campaign
                  </>
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
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Mail className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg mb-1">No campaigns yet</CardTitle>
            <CardDescription className="mb-6 text-center max-w-sm">
              Create a campaign by selecting a contact list and an email
              template. Then start sending!
            </CardDescription>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                className="group hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">
                      {campaign.name}
                    </CardTitle>
                    <CampaignStatusBadge status={campaign.status} />
                  </div>
                  <CardDescription className="text-xs">
                    {campaign.total_emails} contacts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Progress */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {campaign.sent_count} / {campaign.total_emails} sent
                        </span>
                        <span>{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-1">
                      <p className="text-xs text-muted-foreground">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </p>
                      <Link href={`/dashboard/campaigns/${campaign.id}/send`}>
                        <Button
                          size="sm"
                          className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs"
                        >
                          <Send className="mr-1 h-3 w-3" />
                          Send
                          <ArrowRight className="ml-1 h-3 w-3" />
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
