'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Send, Zap, Rocket, Clock, Mail, 
  ArrowLeft, ArrowRight, CheckCircle2, BarChart3, Settings
} from 'lucide-react';
import { toast } from 'sonner';

export default function CampaignDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [campaign, setCampaign] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/campaigns`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const c = data.campaigns.find((item: any) => item.id === id);
          setCampaign(c);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) return <div className="p-20 text-center animate-pulse font-black uppercase text-[10px] tracking-widest text-slate-400">Loading...</div>;
  if (!campaign) return <div className="p-20 text-center font-black">Campaign not found</div>;

  const progress = (campaign.sent_count / (campaign.total_count || 1)) * 100;

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center gap-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/campaigns')} className="h-12 w-12 rounded-2xl shadow-sm">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">{campaign.name}</h1>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Campaign Overview & Actions</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10">
                <BarChart3 className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="rounded-xl h-10 w-10">
                <Settings className="h-4 w-4" />
            </Button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-slate-50 dark:bg-slate-900 border-none rounded-3xl p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Progress</p>
              <div className="space-y-3">
                  <div className="flex justify-between items-end">
                      <p className="text-3xl font-black italic">{Math.round(progress)}%</p>
                      <p className="text-[10px] font-bold text-slate-400 mb-1">{campaign.sent_count} / {campaign.total_count}</p>
                  </div>
                  <Progress value={progress} className="h-2 rounded-full" />
              </div>
          </Card>
          <Card className="bg-indigo-50 dark:bg-indigo-950/20 border-none rounded-3xl p-6">
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2">Template</p>
              <p className="text-xl font-black truncate">{campaign.templates?.name || 'Default'}</p>
              <p className="text-[10px] font-bold text-indigo-400 mt-1 uppercase">Ready to send</p>
          </Card>
          <Card className="bg-slate-50 dark:bg-slate-900 border-none rounded-3xl p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Contact List</p>
              <p className="text-xl font-black truncate">{campaign.lists?.name || 'Default'}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">{campaign.total_count} leads total</p>
          </Card>
      </div>

      {/* Action Selection */}
      <div className="space-y-6">
          <h2 className="text-sm font-black italic uppercase tracking-widest text-slate-400 px-2">Choose Sending Mode</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Manual Mode - ACTIVE */}
              <Card className="group relative overflow-hidden rounded-[2.5rem] border-2 border-indigo-500/20 hover:border-indigo-500 transition-all shadow-xl hover:shadow-indigo-500/10 cursor-pointer" 
                    onClick={() => router.push(`/dashboard/campaigns/${id}/send`)}>
                  <CardContent className="p-10 space-y-6">
                      <div className="h-16 w-16 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xl shadow-indigo-500/20">
                          <Send className="h-8 w-8" />
                      </div>
                      <div className="space-y-2">
                          <h3 className="text-2xl font-black italic uppercase tracking-tighter">Manual Outreach</h3>
                          <p className="text-sm font-medium text-slate-500 leading-relaxed">
                              Perfect for high-conversion. Copy, open in Gmail, and track progress contact by contact.
                          </p>
                      </div>
                      <Button className="w-full h-12 bg-indigo-600 hover:bg-indigo-500 text-white font-black italic uppercase tracking-widest rounded-2xl">
                          Start Sending <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                  </CardContent>
              </Card>

              {/* Bulk Mode - COMING SOON */}
              <Card className="group relative overflow-hidden rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 opacity-70 grayscale-[0.5]">
                  <Badge className="absolute top-6 right-6 bg-amber-100 text-amber-700 font-black italic tracking-widest px-4 py-1 rounded-full border-none">
                      COMING SOON
                  </Badge>
                  <CardContent className="p-10 space-y-6">
                      <div className="h-16 w-16 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center">
                          <Zap className="h-8 w-8" />
                      </div>
                      <div className="space-y-2">
                          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-400">Bulk Send 1000</h3>
                          <p className="text-sm font-medium text-slate-400 leading-relaxed">
                              Send hundreds of emails instantly via Resend API. High speed automation for large lists.
                          </p>
                      </div>
                      <Button disabled className="w-full h-12 bg-slate-100 dark:bg-slate-800 text-slate-400 font-black italic uppercase tracking-widest rounded-2xl">
                          Locked <Clock className="ml-2 h-4 w-4" />
                      </Button>
                  </CardContent>
              </Card>
          </div>
      </div>
    </div>
  );
}
