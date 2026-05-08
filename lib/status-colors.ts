// Centralized color definitions for all status types across OutreachPro

export const statusColors = {
  // User verification
  user_unverified: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444', darkBg: 'rgba(220,38,38,0.15)', darkText: '#FCA5A5' },
  user_pending:    { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B', darkBg: 'rgba(217,119,6,0.15)', darkText: '#FCD34D' },
  user_verified:   { bg: '#D1FAE5', text: '#16A34A', border: '#22C55E', darkBg: 'rgba(22,163,74,0.15)', darkText: '#86EFAC' },

  // Contact verification
  contact_pending:      { bg: '#F1F5F9', text: '#64748B', border: '#94A3B8', darkBg: 'rgba(100,116,139,0.15)', darkText: '#94A3B8' },
  contact_format_valid: { bg: '#DBEAFE', text: '#2563EB', border: '#3B82F6', darkBg: 'rgba(37,99,235,0.15)', darkText: '#93C5FD' },
  contact_verified:     { bg: '#D1FAE5', text: '#16A34A', border: '#22C55E', darkBg: 'rgba(22,163,74,0.15)', darkText: '#86EFAC' },
  contact_deliverable:  { bg: '#166534', text: '#FFFFFF', border: '#15803D', darkBg: 'rgba(22,101,52,0.5)', darkText: '#86EFAC' },
  contact_invalid:      { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444', darkBg: 'rgba(220,38,38,0.15)', darkText: '#FCA5A5' },
  contact_bounced:      { bg: '#7F1D1D', text: '#FFFFFF', border: '#991B1B', darkBg: 'rgba(127,29,29,0.5)', darkText: '#FCA5A5' },

  // Email job status
  job_pending:  { bg: '#F1F5F9', text: '#64748B', border: '#94A3B8', darkBg: 'rgba(100,116,139,0.15)', darkText: '#94A3B8' },
  job_queued:   { bg: '#DBEAFE', text: '#2563EB', border: '#3B82F6', darkBg: 'rgba(37,99,235,0.15)', darkText: '#93C5FD' },
  job_sending:  { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B', darkBg: 'rgba(217,119,6,0.15)', darkText: '#FCD34D' },
  job_sent:     { bg: '#D1FAE5', text: '#16A34A', border: '#22C55E', darkBg: 'rgba(22,163,74,0.15)', darkText: '#86EFAC' },
  job_opened:   { bg: '#D1FAE5', text: '#059669', border: '#10B981', darkBg: 'rgba(5,150,105,0.15)', darkText: '#6EE7B7' },
  job_clicked:  { bg: '#CCFBF1', text: '#0D9488', border: '#14B8A6', darkBg: 'rgba(13,148,136,0.15)', darkText: '#5EEAD4' },
  job_bounced:  { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444', darkBg: 'rgba(220,38,38,0.15)', darkText: '#FCA5A5' },
  job_failed:   { bg: '#7F1D1D', text: '#FFFFFF', border: '#991B1B', darkBg: 'rgba(127,29,29,0.5)', darkText: '#FCA5A5' },

  // Campaign status
  campaign_draft:     { bg: '#F1F5F9', text: '#64748B', border: '#94A3B8', darkBg: 'rgba(100,116,139,0.15)', darkText: '#94A3B8' },
  campaign_scheduled: { bg: '#F3E8FF', text: '#7C3AED', border: '#8B5CF6', darkBg: 'rgba(124,58,237,0.15)', darkText: '#C4B5FD' },
  campaign_sending:   { bg: '#FEF3C7', text: '#D97706', border: '#F59E0B', darkBg: 'rgba(217,119,6,0.15)', darkText: '#FCD34D' },
  campaign_paused:    { bg: '#FFEDD5', text: '#EA580C', border: '#F97316', darkBg: 'rgba(234,88,12,0.15)', darkText: '#FDBA74' },
  campaign_completed: { bg: '#D1FAE5', text: '#16A34A', border: '#22C55E', darkBg: 'rgba(22,163,74,0.15)', darkText: '#86EFAC' },
  campaign_cancelled: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444', darkBg: 'rgba(220,38,38,0.15)', darkText: '#FCA5A5' },
} as const

export type StatusColorKey = keyof typeof statusColors

// Helper to get Tailwind-compatible class names for contact status
export function getContactStatusStyle(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400'
    case 'format_valid':
      return 'bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400'
    case 'verified':
      return 'bg-emerald-100 text-emerald-600 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400'
    case 'deliverable':
      return 'bg-green-900 text-white border-green-700 dark:bg-green-900/50'
    case 'valid':
      return 'bg-emerald-100 text-emerald-600 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400'
    case 'invalid':
      return 'bg-red-100 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400'
    case 'bounced':
      return 'bg-red-900 text-white border-red-800 line-through dark:bg-red-950/50'
    default:
      return 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400'
  }
}

// Helper for campaign status
export function getCampaignStatusStyle(status: string) {
  switch (status) {
    case 'draft':
      return 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400'
    case 'scheduled':
      return 'bg-purple-100 text-purple-600 border-purple-300 dark:bg-purple-950/30 dark:text-purple-400'
    case 'sending':
    case 'active':
      return 'bg-amber-100 text-amber-600 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400 animate-pulse'
    case 'paused':
      return 'bg-orange-100 text-orange-600 border-orange-300 dark:bg-orange-950/30 dark:text-orange-400'
    case 'completed':
      return 'bg-emerald-100 text-emerald-600 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400'
    case 'cancelled':
      return 'bg-red-100 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400'
    default:
      return 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400'
  }
}

// Helper for email job status
export function getJobStatusStyle(status: string) {
  switch (status) {
    case 'pending':
      return 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400'
    case 'queued':
      return 'bg-blue-100 text-blue-600 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400'
    case 'sending':
      return 'bg-amber-100 text-amber-600 border-amber-300 dark:bg-amber-950/30 dark:text-amber-400'
    case 'sent':
      return 'bg-emerald-100 text-emerald-600 border-emerald-300 dark:bg-emerald-950/30 dark:text-emerald-400'
    case 'opened':
      return 'bg-emerald-100 text-emerald-700 border-emerald-400 dark:bg-emerald-950/40 dark:text-emerald-300'
    case 'clicked':
      return 'bg-teal-100 text-teal-600 border-teal-300 dark:bg-teal-950/30 dark:text-teal-400'
    case 'bounced':
      return 'bg-red-100 text-red-600 border-red-300 dark:bg-red-950/30 dark:text-red-400'
    case 'failed':
      return 'bg-red-900 text-white border-red-800 dark:bg-red-950/50'
    default:
      return 'bg-slate-100 text-slate-500 border-slate-300 dark:bg-slate-800/50 dark:text-slate-400'
  }
}
