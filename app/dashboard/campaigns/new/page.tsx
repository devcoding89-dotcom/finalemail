'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft, Rocket, Mail, LayoutGrid, Zap } from 'lucide-react';
import Link from 'next/link';

export default function NewCampaignPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [listId, setListId] = useState('');
  const [templateId, setTemplateId] = useState('');
  const [lists, setLists] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/lists').then(r => r.json()).then(d => d.success && setLists(d.data || d.lists));
    fetch('/api/templates').then(r => r.json()).then(d => d.success && setTemplates(d.data || d.templates));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !listId || !templateId) {
      toast.error('Fill all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, list_id: listId, template_id: templateId }),
      });
      const data = await res.json();
      
      if (data.success) {
        toast.success('Campaign created!');
        router.push(`/dashboard/campaigns/${data.data.id}/send`);
      } else {
        toast.error(data.error || 'Failed to create');
      }
    } catch (error) {
      toast.error('Failed to create');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-6">
        <Button variant="outline" size="icon" onClick={() => router.push('/dashboard/campaigns')} className="h-12 w-12 rounded-2xl shadow-sm hover:bg-slate-50 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter">New Campaign</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Set up your next manual outreach</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="border-2 border-slate-100 dark:border-slate-800 shadow-2xl shadow-indigo-500/5 rounded-[2.5rem] overflow-hidden">
            <CardContent className="p-10 space-y-8">
                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Campaign Name</Label>
                    <div className="relative group">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                        <Input 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            placeholder="e.g., Lagos Tech Founders Q1" 
                            className="h-16 pl-12 bg-slate-50/50 border-slate-200 dark:border-slate-800 rounded-2xl font-bold text-lg focus-visible:ring-indigo-500 focus-visible:border-indigo-500" 
                            required 
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contact List</Label>
                        <div className="relative">
                            <LayoutGrid className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none" />
                            <select 
                                className="w-full h-16 pl-12 bg-slate-50/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={listId} 
                                onChange={e => setListId(e.target.value)}
                                required
                            >
                                <option value="">Select List...</option>
                                {lists.map(l => (
                                <option key={l.id} value={l.id}>{l.name} ({l.total_contacts || l.valid_contacts || 0})</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Template</Label>
                        <div className="relative">
                            <Zap className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300 pointer-events-none" />
                            <select 
                                className="w-full h-16 pl-12 bg-slate-50/50 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={templateId} 
                                onChange={e => setTemplateId(e.target.value)}
                                required
                            >
                                <option value="">Select Template...</option>
                                {templates.map(t => (
                                <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Button 
            type="submit" 
            className="w-full h-20 bg-indigo-600 hover:bg-indigo-500 text-white font-black italic uppercase tracking-widest text-lg rounded-3xl shadow-2xl shadow-indigo-500/40 group transition-all" 
            disabled={loading}
        >
          {loading ? (
            <RefreshCw className="h-6 w-6 animate-spin" />
          ) : (
            <>
              <Rocket className="mr-3 h-6 w-6 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
              Start Outreach Campaign
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
