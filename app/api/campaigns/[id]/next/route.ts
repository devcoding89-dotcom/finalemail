import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;

  // Get campaign with template
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, templates(*)')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (!campaign) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Get ALL valid contacts for this list
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('list_id', campaign.list_id)
    .not('status', 'in', '("invalid","bounced")')
    .order('created_at', { ascending: true });

  if (!contacts || contacts.length === 0) {
    await supabase.from('campaigns').update({ status: 'completed' }).eq('id', id);
    return NextResponse.json({ complete: true, message: 'All done!' });
  }

  const total = contacts.length;

  // Check if we already processed all
  if (campaign.current_index >= total) {
    await supabase.from('campaigns').update({ status: 'completed' }).eq('id', id);
    return NextResponse.json({ 
      complete: true, 
      stats: { sent: campaign.sent_count, total } 
    });
  }

  // Get current contact
  const contact = contacts[campaign.current_index];

  // Personalize
  // Handle both templates as array or object
  const template = Array.isArray(campaign.templates) ? campaign.templates[0] : campaign.templates;
  
  const subject = (template.subject || '')
    .replace(/{name}/g, contact.name || 'there')
    .replace(/{company}/g, contact.company || 'your company')
    .replace(/{email}/g, contact.email);

  const bodyHtml = (template.body || '')
    .replace(/{name}/g, contact.name || 'there')
    .replace(/{company}/g, contact.company || 'your company')
    .replace(/{email}/g, contact.email);

  const bodyText = bodyHtml.replace(/<[^>]*>/g, '');

  // Build mailto link
  const mailtoLink = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(contact.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(bodyText)}`;

  return NextResponse.json({
    complete: false,
    progress: {
      current: campaign.current_index + 1,
      total,
      sent: campaign.sent_count,
      remaining: total - campaign.current_index,
    },
    contact: {
      id: contact.id,
      email: contact.email,
      name: contact.name,
      company: contact.company,
    },
    email: {
      to: contact.email,
      subject,
      bodyHtml,
      bodyText,
      mailtoLink,
    }
  });
}
