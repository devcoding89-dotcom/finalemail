-- RPC functions for atomic increments
-- Run this in Supabase SQL Editor

-- Increment campaign sent_count
create or replace function increment_campaign_sent(campaign_id uuid)
returns void as $$
begin
  update campaigns
  set sent_count = sent_count + 1
  where id = campaign_id;
end;
$$ language plpgsql security definer;

-- Increment profile emails_sent_today
create or replace function increment_emails_sent_today(user_id uuid)
returns void as $$
begin
  update profiles
  set emails_sent_today = emails_sent_today + 1
  where id = user_id;
end;
$$ language plpgsql security definer;
