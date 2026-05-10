import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  action: z.enum(['sent', 'skipped', 'bounced']),
  contactId: z.string().uuid(),
  notes: z.string().optional(),
  jumpToIndex: z.number().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { action, contactId, notes, jumpToIndex } = schema.parse(body);

  // Verify campaign belongs to user
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // If jumping, just update index and return
  if (typeof jumpToIndex === 'number') {
    await supabase.from('campaigns').update({ current_index: jumpToIndex }).eq('id', id);
    return NextResponse.json({ success: true });
  }

  // Record history
  // Note: we'll use email_logs as our history table since it already exists
  await supabase.from('email_logs').insert({
    campaign_id: id,
    contact_id: contactId,
    status: action === 'sent' ? 'sent' : (action === 'skipped' ? 'failed' : 'bounced'),
  });

  // Update campaign
  const updates: any = {
    current_index: campaign.current_index + 1,
    status: 'active',
  };

  if (action === 'sent') updates.sent_count = (campaign.sent_count || 0) + 1;
  if (action === 'skipped') updates.skipped_count = (campaign.skipped_count || 0) + 1;

  await supabase.from('campaigns').update(updates).eq('id', id);

  return NextResponse.json({ success: true, next: true });
}
