'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Mail, Play, CheckCircle, Clock, PauseCircle, Plus, LayoutGrid, ArrowRight, Trash2, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Campaign {
  id: string;
  name: string;
  status: string;
  total_count: number;
  sent_count: number;
  current_index: number;
  templates: { name: string };
  lists: { name: string };
  created_at: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/campaigns');
      const data = await r.json();
      if (data.success) setCampaigns(data.campaigns);
    } catch (e) {
      toast.error('Failed to load campaigns');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; icon: any }> = {
      draft: { color: 'bg-slate-100 text-slate-800', icon: Clock },
      active: { color: 'bg-amber-100 text-amber-800', icon: Play },
      completed: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      paused: { color: 'bg-orange-100 text-orange-800', icon: PauseCircle },
    };
    const s = map[status] || map.draft;
    return (
      <Badge className={`${s.color} border-none font-black italic uppercase tracking-widest text-[10px] px-3 py-1 rounded-full`}>
        <s.icon className="h-3 w-3 mr-1.5" />
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600" />
        <p className="font-black italic uppercase tracking-widest text-[10px] animate-pulse">Loading Campaigns...</p>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter">Campaigns</h1>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Manage your manual email outreach</p>
        </div>
        <Link href="/dashboard/campaigns/new">
          <Button className="bg-indigo-600 hover:bg-indigo-500 text-white font-black italic uppercase tracking-wider rounded-2xl h-14 px-8 shadow-xl shadow-indigo-500/30">
            <Plus className="mr-2 h-5 w-5" />
            New Campaign
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 rounded-3xl">
          <CardContent className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="h-20 w-20 bg-slate-100 dark:bg-slate-900 rounded-full flex items-center justify-center text-slate-300">
              <Mail className="h-10 w-10" />
            </div>
            <div className="text-center">
                <h3 className="text-xl font-black italic uppercase">No campaigns yet</h3>
                <p className="text-sm text-slate-400 font-medium">Create your first outreach campaign to start sending.</p>
            </div>
            <Link href="/dashboard/campaigns/new">
                <Button variant="outline" className="mt-2 font-bold uppercase tracking-widest text-[10px] rounded-xl border-2">
                    Create Campaign
                </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {campaigns.map(c => {
            const progress = (c.sent_count / (c.total_count || 1)) * 100;
            return (
              <Card key={c.id} className="group overflow-hidden rounded-3xl border-2 border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 cursor-pointer" 
                    onClick={() => router.push(`/dashboard/campaigns/${c.id}/send`)}>
                <CardContent className="p-0">
                  <div className="p-8 space-y-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <h3 className="font-black text-2xl tracking-tight group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                        <div className="flex items-center gap-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span className="bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{c.lists?.name || 'No List'}</span>
                          <span>•</span>
                          <span>{c.templates?.name || 'No Template'}</span>
                        </div>
                      </div>
                      {getStatusBadge(c.status)}
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
                        <span>{c.sent_count} / {c.total_count} sent</span>
                        <span className="text-indigo-600">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2 rounded-full" />
                    </div>
                  </div>

                  <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            Created {new Date(c.created_at).toLocaleDateString()}
                        </span>
                    </div>
                    <Button variant="ghost" size="sm" className="font-black italic uppercase tracking-wider text-[10px] text-indigo-600 hover:bg-indigo-50">
                        {c.status === 'completed' ? 'VIEW STATS' : 'CONTINUE SENDING'}
                        <ArrowRight className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
