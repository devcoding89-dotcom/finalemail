// Database types matching the expanded Supabase schema

// Contact verification status levels
export type ContactStatus =
  | 'pending'
  | 'format_valid'
  | 'verified'
  | 'deliverable'
  | 'valid'
  | 'invalid'
  | 'bounced'

// Campaign lifecycle status
export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'active'
  | 'sending'
  | 'paused'
  | 'completed'
  | 'cancelled'

// Email job send status
export type EmailJobStatus =
  | 'pending'
  | 'queued'
  | 'sending'
  | 'sent'
  | 'opened'
  | 'clicked'
  | 'bounced'
  | 'failed'

export interface Profile {
  id: string
  full_name: string | null
  company_name: string | null
  plan: 'free' | 'premium'
  plan_expires_at: string | null
  emails_sent_today: number
  daily_limit: number
  created_at: string
}

export interface EmailList {
  id: string
  user_id: string
  name: string
  total_contacts: number
  created_at: string
}

export interface Contact {
  id: string
  list_id: string
  email: string
  name: string | null
  company: string | null
  status: ContactStatus
  created_at: string
}

export interface Template {
  id: string
  user_id: string
  name: string
  subject: string
  body: string
  is_default: boolean
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  list_id: string
  template_id: string
  name: string
  status: CampaignStatus
  current_index: number
  total_count: number
  sent_count: number
  skipped_count: number
  open_count: number
  click_count: number
  bounce_count: number
  created_at: string
}

export interface EmailLog {
  id: string
  campaign_id: string
  contact_id: string
  status: EmailJobStatus
  opened_at: string | null
  clicked_at: string | null
  sent_at: string | null
  created_at: string
}

// API response format
export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}

// CSV parsing types
export interface CsvRow {
  [key: string]: string
}

export interface ParsedContact {
  email: string
  name: string | null
  company: string | null
  isValid: boolean
}

export interface UploadResult {
  listId: string
  listName: string
  totalContacts: number
  validContacts: number
  invalidContacts: number
  contacts: ParsedContact[]
}
