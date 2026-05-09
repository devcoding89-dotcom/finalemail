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
import Link from 'next/link'

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
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Fetch lists
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

  // Initial fetch on mount
  useEffect(() => {
    fetchLists()
  }, [fetchLists])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const isCsv = file.name.endsWith('.csv')
      const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')
      
      if (!isCsv && !isExcel) {
        toast.error('Please select a CSV or Excel file')
        return
      }
      setSelectedFile(file)
      if (!listName) {
        setListName(file.name.replace(/\.[^/.]+$/, ""))
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
        toast.success(`Uploaded ${json.data.totalContacts} contacts!`)
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

    setDeletingId(id)
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
    } finally {
      setDeletingId(null)
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
    <div className="space-y-8 pb-12">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contact Lists</h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20"
              id="upload-contacts-btn"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload <span className="hidden md:inline ml-1">File</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-indigo-500" />
                Upload Contact List
              </DialogTitle>
              <DialogDescription>
                Upload a CSV, Excel (.xlsx), or Text (.txt) file. 
                <span className="block mt-1 text-[10px] text-slate-400">Tip: For Word docs, copy the list into a Text file first.</span>
              </DialogDescription>
            </DialogHeader>

            {!uploadResult ? (
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label htmlFor="list-name">List Name</Label>
                  <Input
                    id="list-name"
                    placeholder="e.g. Outreach List"
                    value={listName}
                    onChange={(e) => setListName(e.target.value)}
                    disabled={uploading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="csv-file">File (CSV, Excel, or Text)</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv,.xlsx,.xls,.txt"
                    onChange={handleFileSelect}
                    disabled={uploading}
                    className="file:bg-indigo-50 file:text-indigo-700"
                  />
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-indigo-100 bg-indigo-50/30 dark:bg-indigo-950/20">
                  <input
                    type="checkbox"
                    id="use-ai"
                    checked={useAI}
                    onChange={(e) => setUseAI(e.target.checked)}
                    disabled={uploading}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <Label htmlFor="use-ai" className="flex items-center gap-2 cursor-pointer text-sm font-bold">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    Use AI Data Extraction
                  </Label>
                </div>

                {uploading && (
                  <div className="space-y-2 pt-2">
                    <Progress value={uploadProgress} className="h-2 rounded-full" />
                    <p className="text-[10px] text-center font-black uppercase text-slate-500">
                      Processing... {uploadProgress}%
                    </p>
                  </div>
                )}

                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || !listName.trim() || uploading}
                  className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black"
                >
                  {uploading ? <RefreshCw className="h-5 w-5 animate-spin" /> : 'START UPLOAD'}
                </Button>
              </div>
            ) : (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="h-10 w-10 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-black italic">UPLOAD SUCCESSFUL!</h3>
                  <p className="text-sm text-slate-500">List &quot;{uploadResult.listName}&quot; is ready.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-center">
                      <div className="text-2xl font-black text-indigo-600">{uploadResult.totalContacts}</div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                   </div>
                   <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center">
                      <div className="text-2xl font-black text-emerald-600">{uploadResult.validContacts}</div>
                      <div className="text-[10px] font-bold text-emerald-500 uppercase">Valid</div>
                   </div>
                </div>

                <Button onClick={() => setDialogOpen(false)} className="w-full font-bold">DONE</Button>
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
        <Card className="border-dashed border-slate-200 dark:border-slate-800">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-slate-100 p-4 mb-4 text-slate-400">
              <Users className="h-8 w-8" />
            </div>
            <CardTitle className="text-lg mb-1">No lists yet</CardTitle>
            <CardDescription className="mb-6 text-center max-w-sm">
              Upload a CSV file to start building your outreach campaigns.
            </CardDescription>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Your First List
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-slate-200 dark:border-slate-800 overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 dark:bg-slate-900/50">
                  <TableRow>
                    <TableHead className="w-12 pl-6 font-bold text-slate-500 uppercase text-[10px] tracking-widest">#</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Name</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest text-center">Contacts</TableHead>
                    <TableHead className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Created</TableHead>
                    <TableHead className="w-16 pr-6" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.map((list, index) => (
                    <TableRow key={list.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <TableCell className="pl-6 py-4 text-slate-400 font-mono text-xs">{index + 1}</TableCell>
                      <TableCell className="font-bold py-4">{list.name}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 px-3">
                          {list.total_contacts}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-[11px] font-bold">
                        {new Date(list.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="pr-6">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(list.id)}
                          className="h-9 w-9 text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                          disabled={deletingId === list.id}
                        >
                          {deletingId === list.id ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
