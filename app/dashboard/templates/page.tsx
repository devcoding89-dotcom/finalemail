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
import { toast } from 'sonner'
import {
  Plus,
  FileText,
  Trash2,
  RefreshCw,
  Star,
  Copy,
  Eye,
} from 'lucide-react'
import type { Template } from '@/types'

// Merge tag helper
const MERGE_TAGS = [
  { tag: '{name}', label: 'Contact Name', example: 'John Doe' },
  { tag: '{company}', label: 'Company', example: 'Acme Corp' },
  { tag: '{email}', label: 'Email', example: 'john@acme.com' },
]

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/templates')
      const json = await res.json()
      if (json.success) {
        setTemplates(json.data)
      }
    } catch {
      toast.error('Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTemplates()
  }, [fetchTemplates])

  const handleCreate = async () => {
    if (!name.trim() || !subject.trim() || !body.trim()) {
      toast.error('Please fill in all fields')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          subject: subject.trim(),
          body: body,
          is_default: isDefault,
        }),
      })
      const json = await res.json()

      if (json.success) {
        toast.success('Template created!')
        setDialogOpen(false)
        resetForm()
        fetchTemplates()
      } else {
        toast.error(json.error || 'Failed to create template')
      }
    } catch {
      toast.error('Failed to create template')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return

    try {
      const res = await fetch('/api/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Template deleted')
        fetchTemplates()
      } else {
        toast.error(json.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete template')
    }
  }

  const insertMergeTag = (tag: string) => {
    setBody((prev) => prev + tag)
  }

  const resetForm = () => {
    setName('')
    setSubject('')
    setBody('')
    setIsDefault(false)
  }

  // Preview with sample data
  const previewText = (text: string) => {
    return text
      .replace(/\{name\}/gi, 'John Doe')
      .replace(/\{company\}/gi, 'Acme Corp')
      .replace(/\{email\}/gi, 'john@acme.com')
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground mt-1">
            Create email templates with merge tags for personalization
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
              id="create-template-btn"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-500" />
                Create Email Template
              </DialogTitle>
              <DialogDescription>
                Use merge tags like {'{name}'}, {'{company}'}, {'{email}'} to
                personalize your emails.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5 py-2">
              {/* Template name */}
              <div className="space-y-2">
                <Label htmlFor="template-name">Template Name</Label>
                <Input
                  id="template-name"
                  placeholder="e.g. Cold Outreach v1"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                />
              </div>

              {/* Subject line */}
              <div className="space-y-2">
                <Label htmlFor="template-subject">Subject Line</Label>
                <Input
                  id="template-subject"
                  placeholder="e.g. Quick question about {company}"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={saving}
                />
                {subject && (
                  <p className="text-xs text-muted-foreground">
                    Preview: <span className="text-foreground">{previewText(subject)}</span>
                  </p>
                )}
              </div>

              {/* Merge tags toolbar */}
              <div className="space-y-2">
                <Label>Merge Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {MERGE_TAGS.map((mt) => (
                    <Button
                      key={mt.tag}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => insertMergeTag(mt.tag)}
                      className="text-xs font-mono hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 dark:hover:bg-indigo-950 dark:hover:text-indigo-300"
                      disabled={saving}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      {mt.tag}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Click a tag to insert it into the body
                </p>
              </div>

              {/* Email body */}
              <div className="space-y-2">
                <Label htmlFor="template-body">Email Body</Label>
                <textarea
                  id="template-body"
                  placeholder={`Hi {name},\n\nI noticed {company} is doing great work in the industry. I'd love to connect and explore how we might collaborate.\n\nLooking forward to hearing from you.\n\nBest regards`}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={saving}
                  rows={10}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                />
              </div>

              {/* Live preview */}
              {body && (
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Eye className="h-3.5 w-3.5" />
                    Live Preview
                  </Label>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Subject:
                    </p>
                    <p className="text-sm font-medium mb-3">
                      {previewText(subject || '(no subject)')}
                    </p>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Body:
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {previewText(body)}
                    </p>
                  </div>
                </div>
              )}

              {/* Default checkbox */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is-default"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  disabled={saving}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="is-default" className="cursor-pointer text-sm">
                  Set as default template
                </Label>
              </div>

              {/* Save button */}
              <Button
                onClick={handleCreate}
                disabled={
                  !name.trim() || !subject.trim() || !body.trim() || saving
                }
                className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
                id="save-template-btn"
              >
                {saving ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Create Template
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Template Preview</DialogTitle>
            <DialogDescription>
              Showing with sample data: John Doe at Acme Corp
            </DialogDescription>
          </DialogHeader>
          {previewTemplate && (
            <div className="space-y-4 py-2">
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Subject:
                </p>
                <p className="text-sm font-medium">
                  {previewText(previewTemplate.subject)}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-1">
                  Body:
                </p>
                <div className="rounded-lg border bg-muted/30 p-4">
                  <p className="text-sm whitespace-pre-wrap">
                    {previewText(previewTemplate.body)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Templates grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <FileText className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg mb-1">No templates yet</CardTitle>
            <CardDescription className="mb-6 text-center max-w-sm">
              Create an email template with merge tags to personalize your
              outreach. Use {'{name}'} and {'{company}'} for automatic
              personalization.
            </CardDescription>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template.id}
              className="group hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {template.name}
                      {template.is_default && (
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      )}
                    </CardTitle>
                    <CardDescription className="text-xs font-mono truncate max-w-[250px]">
                      {template.subject}
                    </CardDescription>
                  </div>
                  {template.is_default && (
                    <Badge
                      variant="outline"
                      className="text-amber-600 border-amber-200 bg-amber-50 dark:bg-amber-950/30 text-[10px] shrink-0"
                    >
                      Default
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4 whitespace-pre-wrap">
                  {template.body}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {new Date(template.created_at).toLocaleDateString()}
                  </p>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setPreviewTemplate(template)
                        setPreviewOpen(true)
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-indigo-500"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(template.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
