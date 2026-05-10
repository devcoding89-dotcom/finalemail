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
            <span>Progress Bar</span>
            <span>{Math.round(((progress?.current || 0) / (progress?.total || 1)) * 100)}%</span>
        </div>
        <Progress value={((progress?.current || 0) / (progress?.total || 1)) * 100} className="h-2 rounded-full" />
      </div>

      {/* Contact Navigator */}
      <div className="space-y-2">
        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">Jump to Contact</p>
        <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide no-scrollbar">
            {Array.from({ length: progress?.total || 0 }).map((_, i) => (
                <button
                    key={i}
                    onClick={async () => {
                        // We need to update current_index in DB then reload
                        setLoading(true);
                        await fetch(`/api/campaigns/${id}/action`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'skipped', contactId: data.contact.id, jumpToIndex: i }),
                        });
                        loadNext();
                    }}
                    className={`h-7 w-7 rounded-lg text-[9px] font-black flex-shrink-0 transition-all ${
                        (i + 1) === progress?.current 
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110' 
                        : (i + 1) < progress?.current 
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20' 
                        : 'bg-slate-100 text-slate-400 dark:bg-slate-900'
                    }`}
                >
                    {i + 1}
                </button>
            ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Contact Info & Preview */}
        <div className="lg:col-span-7 space-y-4">
            <Card className="bg-indigo-600 dark:bg-indigo-900 border-none shadow-xl shadow-indigo-500/20 rounded-[2rem] overflow-hidden relative group">
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <CardContent className="p-8 flex items-center gap-6 relative z-10">
                    <div className="h-20 w-20 rounded-3xl bg-white text-indigo-600 flex items-center justify-center text-3xl font-black italic shadow-2xl relative">
                        {data?.contact?.name?.charAt(0) || data?.contact?.email?.charAt(0) || '?'}
                        <div className="absolute -top-3 -right-3 bg-black text-white text-[10px] px-3 py-1 rounded-full border-2 border-white dark:border-slate-800 font-black shadow-lg">
                            #{progress?.current}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] mb-1">Current Lead</p>
                        <h2 className="font-black text-3xl tracking-tighter text-white truncate italic uppercase">{data?.contact?.name || 'Unknown'}</h2>
                        <p className="text-xs font-bold text-indigo-100/70 truncate mt-1">{data?.contact?.email}</p>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none bg-white dark:bg-slate-900 shadow-xl rounded-[2rem] overflow-hidden">
                <CardHeader className="py-4 px-6 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-100 dark:border-slate-800">
                    <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <Mail className="h-3 w-3 text-indigo-600" />
                            Message Preview
                        </div>
                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 text-[8px] font-black border-none">PERSONALIZED</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div>
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Subject Line</label>
                        <div className="text-sm font-black text-slate-800 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner italic">
                            {data?.email?.subject}
                        </div>
                    </div>
                    <div className="pt-2">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Email Content</label>
                        <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed whitespace-pre-wrap max-h-[200px] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/30 p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                            {data?.email?.bodyText}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>        {/* Actions */}
        <div className="lg:col-span-5 space-y-4">
            {sendingMode === 'auto' ? (
              <Card className="bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[2.5rem] border-none shadow-2xl shadow-indigo-500/40 overflow-hidden animate-in zoom-in-95 duration-500">
                <CardContent className="p-10 text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 bg-white/20 rounded-[1.5rem] flex items-center justify-center animate-bounce shadow-xl backdrop-blur-md">
                            <Zap className="h-8 w-8 fill-white" />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <h3 className="font-black italic uppercase tracking-widest text-lg">Auto-Pilot Mode</h3>
                        <p className="text-[10px] font-bold text-indigo-100/70 uppercase tracking-widest leading-tight">
                        Extension is handling the mission.
                        </p>
                    </div>
                    <Button 
                      variant="ghost" 
                      className="w-full h-14 font-black text-xs bg-white/10 hover:bg-white/20 text-white rounded-2xl border border-white/10 transition-all active:scale-95"
                      onClick={() => setSendingMode('manual')}
                    >
                      <Pause className="mr-2 h-4 w-4" /> ABORT AUTO
                    </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                  <Button 
                      className="w-full h-20 text-sm font-black uppercase tracking-widest rounded-[2rem] bg-indigo-600 hover:bg-indigo-500 text-white shadow-2xl shadow-indigo-500/30 group transition-all active:scale-95"
                      onClick={() => handleAction('sent')}
                      disabled={actionLoading}
                  >
                      <CheckCircle2 className="mr-3 h-6 w-6" /> Mission Complete ✓
                  </Button>
                  
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl border-2 hover:bg-slate-50" onClick={handleMailto}>
                          <ExternalLink className="mr-2 h-4 w-4" /> Quick Send
                      </Button>
                      <Button className="h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl bg-black text-white hover:bg-slate-800 shadow-xl shadow-black/10" onClick={() => setSendingMode('auto')}>
                          <Zap className="mr-2 h-4 w-4 text-indigo-400 fill-indigo-400" /> Auto Scout
                      </Button>
                    </div>

                    <div className="pt-2">
                      <Button variant="outline" disabled className="w-full h-14 text-[10px] font-black uppercase tracking-widest rounded-2xl opacity-40 cursor-not-allowed bg-slate-50 border-dashed border-2">
                        Send 1,000 Bulk
                        <Badge className="ml-2 bg-amber-100 text-amber-700 text-[8px] border-none font-black px-2 h-5">LOCKED</Badge>
                      </Button>
                    </div>

                  <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                      <Button variant="ghost" className="h-10 text-[9px] font-black uppercase rounded-xl hover:bg-slate-100 transition-colors" onClick={handleCopy}>
                          <Copy className="mr-2 h-4 w-4" /> Copy Content
                      </Button>
                      <Button variant="ghost" className="h-10 text-[9px] font-black uppercase rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors" onClick={() => handleAction('skipped')}>
                          <SkipForward className="mr-2 h-4 w-4" /> Skip Lead
                      </Button>
                  </div>
              </div>
            )}

            <Card className="bg-slate-900 text-white border-none rounded-[2rem] overflow-hidden">
                <CardContent className="p-6 flex items-start gap-4">
                    <div className="h-8 w-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0 mt-1">
                        <Users className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Mission Control</h4>
                        <p className="text-[10px] font-bold text-slate-400 leading-normal italic">
                            Your personalized subject line is ready. Use Quick Send for manual control or Auto Scout for speed.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
iv>
      </div>
    </div>
  );
}
