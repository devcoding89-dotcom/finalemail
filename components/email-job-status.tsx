import { Badge } from '@/components/ui/badge'
import { getJobStatusStyle } from '@/lib/status-colors'
import {
  CircleDashed,
  Loader2,
  Send,
  Check,
  Eye,
  MousePointerClick,
  Ban,
  AlertTriangle,
} from 'lucide-react'

const jobStatusConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }>; animated?: boolean }
> = {
  pending:  { label: 'Pending', icon: CircleDashed, animated: true },
  queued:   { label: 'Queued', icon: Loader2, animated: true },
  sending:  { label: 'Sending', icon: Send, animated: true },
  sent:     { label: 'Sent', icon: Check },
  opened:   { label: 'Opened', icon: Eye },
  clicked:  { label: 'Clicked', icon: MousePointerClick },
  bounced:  { label: 'Bounced', icon: Ban },
  failed:   { label: 'Failed', icon: AlertTriangle },
}

export function EmailJobStatusBadge({ status }: { status: string }) {
  const config = jobStatusConfig[status] || jobStatusConfig.pending
  const Icon = config.icon
  const style = getJobStatusStyle(status)

  return (
    <Badge variant="outline" className={`text-[10px] gap-1 ${style}`}>
      <Icon
        className={`h-3 w-3 ${
          config.animated
            ? status === 'pending'
              ? 'animate-pulse'
              : status === 'queued'
                ? 'animate-spin'
                : 'animate-bounce'
            : ''
        }`}
      />
      {config.label}
    </Badge>
  )
}
