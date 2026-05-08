import { Badge } from '@/components/ui/badge'
import { getCampaignStatusStyle } from '@/lib/status-colors'
import {
  FileEdit,
  CalendarClock,
  Loader2,
  PauseCircle,
  CheckCircle2,
  XCircle,
} from 'lucide-react'

const campaignStatusConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  draft: { label: 'Draft', icon: FileEdit },
  scheduled: { label: 'Scheduled', icon: CalendarClock },
  sending: { label: 'Sending', icon: Loader2 },
  active: { label: 'Active', icon: Loader2 },
  paused: { label: 'Paused', icon: PauseCircle },
  completed: { label: 'Completed', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', icon: XCircle },
}

export function CampaignStatusBadge({ status }: { status: string }) {
  const config = campaignStatusConfig[status] || campaignStatusConfig.draft
  const Icon = config.icon
  const style = getCampaignStatusStyle(status)

  return (
    <Badge
      variant="outline"
      className={`text-[10px] gap-1 ${style}`}
    >
      <Icon
        className={`h-3 w-3 ${
          status === 'sending' || status === 'active' ? 'animate-spin' : ''
        }`}
      />
      {config.label}
    </Badge>
  )
}
