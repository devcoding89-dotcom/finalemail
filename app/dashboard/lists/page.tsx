'use client'

import { useState, useCallback } from 'react'
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
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
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
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  Sparkles,
  Trash2,
  RefreshCw,
  Users,
} from 'lucide-react'
import type { EmailList, UploadResult } from '@/types'
import { ContactStatusBadge } from '@/components/contact-status-badge'

export default function ListsPage() {
  const [lists, setLists] = useState<EmailList[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null)
  const [listName, setListName] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [useAI, setUseAI] = useState(false)

  // Fetch lists on mount
  const fetchLists = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/lists')
      const json = await res.json()
      if (json.success) {
        setLists(json.data)
      }
    } catch {
      toast.error('Failed to load contact lists')
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useState(() => {
    fetchLists()
  })

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      setSelectedFile(file)
      if (!listName) {
        setListName(file.name.replace('.csv', ''))
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file')
      return
    }
    if (!listName.trim()) {
      toast.error('Please enter a list name')
      return
    }

    setUploading(true)
    setUploadProgress(10)
    setUploadResult(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('listName', listName.trim())
      formData.append('useAI', useAI.toString())

      setUploadProgress(30)

      const res = await fetch('/api/contacts/upload', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(80)

      const json = await res.json()

      if (json.success) {
        setUploadProgress(100)
        setUploadResult(json.data)
        toast.success(
          `Uploaded ${json.data.totalContacts} contacts (${json.data.validContacts} valid)`
        )
        fetchLists()
      } else {
        toast.error(json.error || 'Upload failed')
      }
    } catch {
      toast.error('Upload failed — check your connection')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this list and all its contacts?')) return

    try {
      const res = await fetch('/api/lists', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('List deleted')
        fetchLists()
      } else {
        toast.error(json.error || 'Failed to delete')
      }
    } catch {
      toast.error('Failed to delete list')
    }
  }

  const resetUploadDialog = () => {
    setSelectedFile(null)
    setListName('')
    setUseAI(false)
    setUploadProgress(0)
    setUploadResult(null)
  }

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Lists</h1>
          <p className="text-muted-foreground mt-1">
            Upload and manage your email contact lists
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetUploadDialog()
          }}
        >
          <DialogTrigger asChild>
            <Button
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-500/25"
              id="upload-contacts-btn"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
                Upload Contact List
              </DialogTitle>
              <DialogDescription>
                Upload a CSV file with an &quot;email&quot; column. Names and
                companies will be auto-detected.
              </DialogDescription>
            </DialogHeader>

            {!uploadResult ? (
              <div className="space-y-5 py-2">
                {/* List name */}
                <div className="space-y-2">
                  <Label htmlFor="list-name">List Name</Label>
                  <Input
                    id="list-name"
                    placeholder="e.g. Startup Founders Q2"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    disabled={uploading}
                  />
                </div>

                {/* File picker */}
                <div className="space-y-2">
                  <Label htmlFor="csv-file">CSV File</Label>
                  <div className="relative">
                    <Input
                      id="csv-file"
                      type="file"
                      accept=".csv"
                      onChange={handleFileSelect}
                      disabled={uploading}
                      className="file:mr-4 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950 dark:file:text-indigo-300"
                    />
                  </div>
                  {selectedFile && (
                    <p className="text-xs text-muted-foreground">
                      Selected: {selectedFile.name} (
                      {(selectedFile.size / 1024).toFixed(1)} KB)
                    </p>
                  )}
                </div>

                {/* AI toggle */}
                <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50">
                  <input
                    type="checkbox"
                    id="use-ai"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    disabled={uploading}
                    className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label
                    htmlFor="use-ai"
                    className="flex items-center gap-2 cursor-pointer text-sm"
                  >
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Use AI to extract names & companies
                  </Label>
                </div>

                {/* Upload progress */}
                {uploading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-center text-muted-foreground">
                      {uploadProgress < 30
                        ? 'Preparing upload...'
                        : uploadProgress < 80
                          ? 'Processing contacts...'
                          : 'Saving to database...'}
                    </p>
                  </div>
                )}

                {/* Upload button */}
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !listName.trim() || uploading}
                  className="w-full bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
                  id="start-upload-btn"
                >
                  {uploading ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Upload & Process
                    </>
                  )}
                </Button>
              </div>
            ) : (
              /* Upload results */
              <div className="space-y-5 py-2">
                <div className="text-center">
                  <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                  <h3 className="text-lg font-semibold">Upload Complete!</h3>
                  <p className="text-sm text-muted-foreground">
                    &quot;{uploadResult.listName}&quot; has been created
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-lg bg-muted">
                    <div className="text-2xl font-bold">
                      {uploadResult.totalContacts}
                    </div>
                    <div className="text-xs text-muted-foreground">Total</div>
                  </div>
                  <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                    <div className="text-2xl font-bold text-emerald-600">
                      {uploadResult.validContacts}
                    </div>
                    <div className="text-xs text-emerald-600/70">Valid</div>
                  </div>
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30">
                    <div className="text-2xl font-bold text-red-500">
                      {uploadResult.invalidContacts}
                    </div>
                    <div className="text-xs text-red-500/70">Invalid</div>
                  </div>
                </div>

                {/* Sample of processed contacts */}
                {uploadResult.contacts.length > 0 && (
                  <div className="max-h-48 overflow-y-auto rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-xs">Email</TableHead>
                          <TableHead className="text-xs">Name</TableHead>
                          <TableHead className="text-xs">Company</TableHead>
                          <TableHead className="text-xs w-16">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {uploadResult.contacts.slice(0, 10).map((contact, i) => (
                          <TableRow key={i}>
                            <TableCell className="text-xs font-mono">
                              {contact.email}
                            </TableCell>
                            <TableCell className="text-xs">
                              {contact.name || '—'}
                            </TableCell>
                            <TableCell className="text-xs">
                              {contact.company || '—'}
                            </TableCell>
                            <TableCell>
                              <ContactStatusBadge
                                status={contact.isValid ? 'valid' : 'invalid'}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {uploadResult.contacts.length > 10 && (
                      <p className="text-xs text-center text-muted-foreground py-2">
                        ... and {uploadResult.contacts.length - 10} more
                      </p>
                    )}
                  </div>
                )}

                <Button
                  onClick={() => {
                    setDialogOpen(false)
                    resetUploadDialog()
                  }}
                  className="w-full"
                  id="done-upload-btn"
                >
                  Done
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Lists table */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : lists.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
            <CardTitle className="text-lg mb-1">No contact lists yet</CardTitle>
            <CardDescription className="mb-6 text-center max-w-sm">
              Upload a CSV file with email addresses to get started with your
              first outreach campaign.
            </CardDescription>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Your First List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your Lists</CardTitle>
            <CardDescription>
              {lists.length} list{lists.length !== 1 ? 's' : ''} total
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="text-center">Total Contacts</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {lists.map((list) => (
                  <TableRow key={list.id}>
                    <TableCell className="font-medium">{list.name}</TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="text-indigo-600 border-indigo-200 bg-indigo-50 dark:bg-indigo-950/30"
                      >
                        {list.total_contacts}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(list.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(list.id)}
                        className="h-8 w-8 text-muted-foreground hover:text-red-500"
                        id={`delete-list-${list.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
