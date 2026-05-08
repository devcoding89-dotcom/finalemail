-- RESET: Drop all existing tables and recreate
-- Run this in Supabase SQL Editor

-- Drop triggers first
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- Drop tables in correct order (respecting foreign keys)
drop table if exists email_logs cascade;
drop table if exists campaigns cascade;
drop table if exists templates cascade;
drop table if exists contacts cascade;
drop table if exists email_lists cascade;
drop table if exists profiles cascade;

-- ============================================
-- CREATE TABLES
-- ============================================

create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  company_name text,
  plan text default 'free' check (plan in ('free', 'premium')),
  plan_expires_at timestamptz,
  emails_sent_today int default 0,
  daily_limit int default 500,
  created_at timestamptz default now()
);

create table email_lists (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  total_contacts int default 0,
  created_at timestamptz default now()
);

create table contacts (
  id uuid default gen_random_uuid() primary key,
  list_id uuid references email_lists(id) on delete cascade not null,
  email text not null,
  name text,
  company text,
  status text default 'pending' check (status in ('pending', 'format_valid', 'verified', 'deliverable', 'valid', 'invalid', 'bounced')),
  created_at timestamptz default now()
);

create table templates (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  subject text not null,
  body text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);

create table campaigns (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  list_id uuid references email_lists(id) not null,
  template_id uuid references templates(id) not null,
  name text not null,
  status text default 'draft' check (status in ('draft', 'scheduled', 'active', 'sending', 'paused', 'completed', 'cancelled')),
  total_emails int default 0,
  sent_count int default 0,
  open_count int default 0,
  click_count int default 0,
  bounce_count int default 0,
  created_at timestamptz default now()
);

create table email_logs (
  id uuid default gen_random_uuid() primary key,
  campaign_id uuid references campaigns(id) on delete cascade not null,
  contact_id uuid references contacts(id) not null,
  status text default 'pending' check (status in ('pending', 'queued', 'sending', 'sent', 'opened', 'clicked', 'bounced', 'failed')),
  opened_at timestamptz,
  clicked_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz default now()
);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

alter table profiles enable row level security;
alter table email_lists enable row level security;
alter table contacts enable row level security;
alter table templates enable row level security;
alter table campaigns enable row level security;
alter table email_logs enable row level security;

create policy "Users own their profile"
  on profiles for all
  using (auth.uid() = id);

create policy "Users own their lists"
  on email_lists for all
  using (auth.uid() = user_id);

create policy "Users access their contacts"
  on contacts for all
  using (exists (
    select 1 from email_lists where id = contacts.list_id and user_id = auth.uid()
  ));

create policy "Users own their templates"
  on templates for all
  using (auth.uid() = user_id);

create policy "Users own their campaigns"
  on campaigns for all
  using (auth.uid() = user_id);

create policy "Users access their logs"
  on email_logs for all
  using (exists (
    select 1 from campaigns where id = email_logs.campaign_id and user_id = auth.uid()
  ));

-- ============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- ============================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, daily_limit)
  values (new.id, new.raw_user_meta_data->>'full_name', 500);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================
-- DAILY LIMIT RESET (run via Supabase cron)
-- ============================================
-- select cron.schedule('reset-daily-emails', '0 23 * * *', $$
--   update profiles set emails_sent_today = 0;
-- $$);
