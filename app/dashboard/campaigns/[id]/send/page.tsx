'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { 
  Mail, Copy, ExternalLink, CheckCircle2, 
  SkipForward, Ban, ArrowLeft, Send, Loader2, Building, User, Zap
} from 'lucide-react';

export default function CampaignSendPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [complete, setComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loadNext = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/next`);
      const result = await res.json();

      if (result.complete) {
        setComplete(true);
        setData(result.stats);
      } else {
        setData(result);
      }
    } catch (error) {
      toast.error('Failed to load contact');
    }
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  const handleCopy = async () => {
    if (!data?.email) return;
    const text = `${data.email.bodyText}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied! Paste into your email app');
  };

  const handleMailto = () => {
    if (!data?.email?.mailtoLink) return;
    window.open(data.email.mailtoLink, '_blank');
    
    // Automatically mark as sent and load next after a small delay
    // This removes the need for the user to manually click "I Sent This"
    toast.info('Opening Gmail... Auto-loading next contact.');
    setTimeout(() => {
      handleAction('sent');
    }, 1500);
  };

  const handleAction = async (action: 'sent' | 'skipped' | 'bounced') => {
    if (!data?.contact) return;
    setActionLoading(true);

    try {
      const res = await fetch(`/api/campaigns/${id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          contactId: data.contact.id,
        }),
      });

      const result = await res.json();
      if (result.success) {
        if (action === 'sent') toast.success('Marked sent! Loading next...');
        if (action === 'skipped') toast.info('Skipped. Next...');
        if (action === 'bounced') toast.error('Marked bounced. Next...');
        loadNext();
      }
    } catch (error) {
      toast.error('Failed to save');
    }
    setActionLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            <p className="font-black italic uppercase tracking-widest text-[10px] animate-pulse">Loading Next Contact...</p>
        </div>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center space-y-8 animate-in zoom-in-95 duration-500">
        <div className="h-24 w-24 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
        </div>
        <div>
            <h2 className="text-4xl font-black italic uppercase tracking-tighter">Campaign Complete!</h2>
            <p className="text-muted-foreground mt-2 font-medium">
              Excellent work. You processed {data?.total} contacts.
            </p>
        </div>
        
        <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
            <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black">{data?.total}</p>
            </div>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sent</p>
                <p className="text-2xl font-black text-emerald-700">{data?.sent}</p>
            </div>
        </div>

        <div className="flex gap-4 justify-center">
          <Button onClick={() => router.push('/dashboard/campaigns')} className="bg-indigo-600 hover:bg-indigo-500 font-bold px-8 h-12 rounded-xl">
            View Campaigns
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/analytics')} className="font-bold px-8 h-12 rounded-xl">
            Analytics
          </Button>
        </div>
      </div>
    );
  }

  const progress = data?.progress;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/campaigns')} className="h-12 w-12 rounded-2xl shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Manual Outreach</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
            Contact {progress?.current} of {progress?.total} • {progress?.remaining} remaining
          </p>
        </div>
        <div className="bg-indigo-600 text-white px-6 py-2 rounded-2xl font-black italic shadow-lg shadow-indigo-500/30">
          {progress?.sent} SENT
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <span>Progress</span>
            <span>{Math.round(((progress?.current || 0) / (progress?.total || 1)) * 100)}%</span>
        </div>
        <Progress value={((progress?.current || 0) / (progress?.total || 1)) * 100} className="h-3 rounded-full" />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Left Col: Info & Preview */}
        <div className="lg:col-span-3 space-y-6">
            {/* Contact Info */}
            <Card className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm rounded-3xl overflow-hidden">
                <CardContent className="p-8 flex items-center gap-6">
                    <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-2xl font-black italic shadow-xl shadow-indigo-500/20">
                        {data?.contact?.name?.charAt(0) || data?.contact?.email?.charAt(0) || '?'}
                    </div>
                    <div className="space-y-1">
                        <p className="font-black text-lg tracking-tight">{data?.contact?.name || 'Unknown'}</p>
                        <div className="flex items-center gap-4 text-sm font-bold">
                            <span className="text-indigo-600">{data?.contact?.email}</span>
                            {data?.contact?.company && (
                            <span className="flex items-center gap-1.5 text-slate-400 uppercase tracking-widest text-[10px]">
                                <Building className="h-3 w-3" /> {data?.contact?.company}
                            </span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Email Preview */}
            <Card className="border-slate-200 dark:border-slate-800 shadow-xl rounded-3xl overflow-hidden border-2">
                <CardHeader className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="flex items-center gap-3 text-sm font-black uppercase tracking-widest">
                        <Mail className="h-4 w-4 text-indigo-600" />
                        Generated Email
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subject</label>
                        <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl font-bold text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-800">
                            {data?.email?.subject}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Personalized Body</label>
                        <div 
                            className="p-6 bg-white dark:bg-black rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 leading-relaxed text-sm whitespace-pre-wrap min-h-[200px]"
                        >
                            {data?.email?.bodyText}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Right Col: Actions & Instructions */}
        <div className="lg:col-span-2 space-y-6">
            {/* Action Grid */}
            <div className="space-y-4">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Step 1: Get the Email</p>
                <div className="grid grid-cols-1 gap-3">
                    <Button variant="outline" className="w-full h-16 text-sm font-black uppercase tracking-widest rounded-2xl hover:bg-slate-50" onClick={handleCopy}>
                        {copied ? <CheckCircle2 className="mr-2 h-5 w-5 text-emerald-500" /> : <Copy className="mr-2 h-5 w-5 text-indigo-500" />}
                        {copied ? 'Copied Content!' : 'Copy Body Content'}
                    </Button>
                    
                    <Button className="w-full h-16 text-sm font-black uppercase tracking-widest rounded-2xl bg-slate-900 hover:bg-black text-white shadow-xl shadow-black/10" onClick={handleMailto}>
                        <ExternalLink className="mr-2 h-5 w-5 text-indigo-400" />
                        Open Gmail Compose
                    </Button>
                </div>

                <div className="pt-8 space-y-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 text-center">Step 2: Mark Progress</p>
                    <Button 
                        className="w-full h-20 text-lg font-black uppercase tracking-widest rounded-3xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-500/40 group"
                        onClick={() => handleAction('sent')}
                        disabled={actionLoading}
                    >
                        {actionLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : (
                            <>
                                <Send className="mr-3 h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                I Sent This ✓
                            </>
                        )}
                    </Button>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                            variant="outline" 
                            className="h-12 font-bold uppercase text-[10px] rounded-xl"
                            onClick={() => handleAction('skipped')}
                            disabled={actionLoading}
                        >
                            <SkipForward className="mr-2 h-4 w-4" />
                            Skip
                        </Button>
                        
                        <Button 
                            variant="ghost" 
                            className="h-12 font-bold uppercase text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl"
                            onClick={() => handleAction('bounced')}
                            disabled={actionLoading}
                        >
                            <Ban className="mr-2 h-4 w-4" />
                            Bounced
                        </Button>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <Card className="bg-indigo-50 dark:bg-indigo-950/20 border-none rounded-3xl p-2">
                <CardContent className="p-6">
                    <h3 className="font-black italic uppercase tracking-widest text-[10px] text-indigo-600 mb-4 flex items-center gap-2">
                        <Zap className="h-3 w-3" /> Quick Instructions:
                    </h3>
                    <ul className="space-y-4">
                        <li className="flex items-start gap-4">
                            <span className="bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-indigo-500/20">1</span>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight">Click <strong>"Open Gmail"</strong> to start a new message.</p>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-indigo-500/20">2</span>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight">Paste the content and hit <strong>Send</strong> in Gmail.</p>
                        </li>
                        <li className="flex items-start gap-4">
                            <span className="bg-indigo-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-[10px] font-black shrink-0 shadow-lg shadow-indigo-500/20">3</span>
                            <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-tight">Click <strong>"I Sent This"</strong> to load the next person.</p>
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
