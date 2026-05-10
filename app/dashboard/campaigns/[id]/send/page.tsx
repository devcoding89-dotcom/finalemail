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
  SkipForward, Ban, ArrowLeft, Send, Loader2, Building, User, Zap, Pause
} from 'lucide-react';

export default function CampaignSendPage() {
  const { id } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [complete, setComplete] = useState(false);
  const [copied, setCopied] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingMode, setSendingMode] = useState<'manual' | 'auto'>('manual');

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
        
        // If in Auto Scout mode, signal the extension
        if (sendingMode === 'auto' && !result.complete) {
          window.postMessage({
            type: 'START_AUTO_SCOUT',
            to: result.email.to,
            subject: result.email.subject,
            body: result.email.bodyHtml,
            contactId: result.contact.id
          }, '*');
        }
      }
    } catch (error) {
      toast.error('Failed to load contact');
    }
    setLoading(false);
  }, [id, sendingMode]);

  useEffect(() => {
    loadNext();
  }, [loadNext]);

  // Listen for extension finish
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'AUTO_SCOUT_FINISHED') {
        if (event.data.success) {
          handleAction('sent');
        } else {
          toast.error('Auto Scout failed: ' + event.data.error);
          setSendingMode('manual');
        }
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [data]);

  const handleCopy = async () => {
    if (!data?.email) return;
    const text = `${data.email.bodyText}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied!');
  };

  const handleMailto = () => {
    if (!data?.email?.mailtoLink) return;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(data.contact.email)}&su=${encodeURIComponent(data.email.subject)}&body=${encodeURIComponent(data.email.bodyText)}`;
    window.open(gmailUrl, 'emailll_compose', 'width=600,height=600');
    toast.info('Opening Gmail... Auto-loading next.');
    setTimeout(() => handleAction('sent'), 1500);
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
            <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            <p className="font-black italic uppercase tracking-widest text-[8px] animate-pulse text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (complete) {
    return (
      <div className="max-w-md mx-auto py-20 text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-950/40 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <CheckCircle2 className="h-10 w-10 text-emerald-600" />
        </div>
        <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">Done!</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">
              Processed {data?.total} contacts.
            </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => router.push('/dashboard/campaigns')} className="bg-indigo-600 hover:bg-indigo-500 font-bold h-10 rounded-xl px-6 text-xs">
            CAMPAIGNS
          </Button>
          <Button variant="outline" onClick={() => router.push('/dashboard/analytics')} className="font-bold h-10 rounded-xl px-6 text-xs">
            ANALYTICS
          </Button>
        </div>
      </div>
    );
  }

  const progress = data?.progress;

  return (
    <div className="max-w-2xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/campaigns')} className="h-10 w-10 rounded-xl shadow-sm">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-black italic uppercase tracking-tighter">Campaign Send</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-[8px] font-black border-slate-200 dark:border-slate-800 rounded-lg h-5 px-2">
                CONTACT #{progress?.current}
            </Badge>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              OF {progress?.total} • {progress?.remaining} LEFT
            </span>
          </div>
        </div>
        <div className="bg-indigo-600 text-white px-4 py-1.5 rounded-xl font-black italic text-[10px] shadow-lg shadow-indigo-500/20">
          {progress?.sent} SENT
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
            <span>Progress</span>
            <span>{Math.round(((progress?.current || 0) / (progress?.total || 1)) * 100)}%</span>
        </div>
        <Progress value={((progress?.current || 0) / (progress?.total || 1)) * 100} className="h-2 rounded-full" />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contact Info & Preview */}
        <div className="lg:col-span-7 space-y-4">
            <Card className="bg-slate-50 dark:bg-slate-900 border-none shadow-sm rounded-2xl">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg font-black italic shadow-lg shadow-indigo-500/20 relative">
                        {data?.contact?.name?.charAt(0) || data?.contact?.email?.charAt(0) || '?'}
                        <div className="absolute -top-2 -right-2 bg-black text-white text-[8px] px-1.5 py-0.5 rounded-full border border-white dark:border-slate-800 font-black">
                            #{progress?.current}
                        </div>
                    </div>
                    <div>
                        <p className="font-black text-base tracking-tight">{data?.contact?.name || 'Unknown'}</p>
                        <p className="text-[10px] font-bold text-indigo-600">{data?.contact?.email}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800 shadow-lg rounded-2xl overflow-hidden border">
                <CardHeader className="py-3 px-4 bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <Mail className="h-3 w-3 text-indigo-600" />
                        Preview
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                    <div>
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Subject</label>
                        <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            {data?.email?.subject}
                        </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Body</label>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap max-h-[150px] overflow-y-auto">
                            {data?.email?.bodyText}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

        {/* Actions */}
        <div className="lg:col-span-5 space-y-4">
            {sendingMode === 'auto' ? (
              <Card className="bg-indigo-600 text-white rounded-2xl border-none shadow-xl shadow-indigo-500/30 overflow-hidden animate-in zoom-in-95">
                <CardContent className="p-6 text-center space-y-4">
                    <div className="flex justify-center">
                        <div className="h-10 w-10 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                            <Zap className="h-6 w-6" />
                        </div>
                    </div>
                    <h3 className="font-black italic uppercase tracking-widest text-sm">Auto Scout Active</h3>
                    <p className="text-[8px] font-bold text-indigo-100 uppercase tracking-widest leading-tight">
                      Automation extension is controlling your Gmail tab.
                    </p>
                    <Button 
                      variant="ghost" 
                      className="w-full h-10 font-black text-[10px] bg-white/10 hover:bg-white/20 text-white rounded-xl"
                      onClick={() => setSendingMode('manual')}
                    >
                      <Pause className="mr-2 h-3 w-3" /> PAUSE AUTO
                    </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                  <Button 
                      className="w-full h-14 text-xs font-black uppercase tracking-widest rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 group"
                      onClick={() => handleAction('sent')}
                      disabled={actionLoading}
                  >
                      <Send className="mr-2 h-4 w-4" /> I Sent This ✓
                  </Button>
                  
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl" onClick={handleMailto}>
                          <ExternalLink className="mr-2 h-3 w-3" /> Quick Send
                      </Button>
                      <Button className="h-10 text-[9px] font-black uppercase tracking-widest rounded-xl bg-slate-900" onClick={() => setSendingMode('auto')}>
                          <Zap className="mr-2 h-3 w-3 text-indigo-400" /> Auto Scout
                      </Button>
                    </div>

                    <div className="pt-1">
                      <Button variant="outline" disabled className="w-full h-10 text-[9px] font-black uppercase tracking-widest rounded-xl opacity-50 cursor-not-allowed bg-slate-50 border-dashed">
                        Send 100 Emails (Resend) 
                        <Badge className="ml-2 bg-amber-100 text-amber-700 text-[7px] border-none font-black px-2 h-4">COMING SOON</Badge>
                      </Button>
                    </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <Button variant="ghost" className="h-8 text-[8px] font-black uppercase rounded-lg" onClick={handleCopy}>
                          <Copy className="mr-2 h-3 w-3" /> Copy
                      </Button>
                      <Button variant="ghost" className="h-8 text-[8px] font-black uppercase rounded-lg text-red-500" onClick={() => handleAction('skipped')}>
                          <SkipForward className="mr-2 h-3 w-3" /> Skip
                      </Button>
                  </div>
              </div>
            )}

            <Card className="bg-slate-50 dark:bg-slate-900 border-none rounded-2xl">
                <CardContent className="p-4">
                    <h4 className="text-[8px] font-black uppercase tracking-widest text-slate-400 mb-2">Instructions:</h4>
                    <p className="text-[9px] font-bold text-slate-500 leading-tight">
                        Use <strong>Quick Send</strong> for mailto links, or <strong>Auto Scout</strong> for full automation with the extension.
                    </p>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
