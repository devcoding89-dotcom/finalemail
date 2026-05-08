import { Badge } from '@/components/ui/badge'
import { getContactStatusStyle } from '@/lib/status-colors'
import {
  Loader2,
  Mail,
  CheckCircle2,
  ShieldCheck,
  XCircle,
  Ban,
} from 'lucide-react'

const statusConfig: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  pending: { label: 'Pending', icon: Loader2 },
  format_valid: { label: 'Format Valid', icon: Mail },
  verified: { label: 'Verified', icon: CheckCircle2 },
  valid: { label: 'Valid', icon: CheckCircle2 },
  deliverable: { label: 'Deliverable', icon: ShieldCheck },
  invalid: { label: 'Invalid', icon: XCircle },
  bounced: { label: 'Bounced', icon: Ban },
}

export function ContactStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending
  const Icon = config.icon
  const style = getContactStatusStyle(status)

  return (
    <Badge
      variant="outline"
      className={`text-[10px] gap-1 ${style}`}
    >
      <Icon
        className={`h-3 w-3 ${status === 'pending' ? 'animate-spin' : ''}`}
      />
      {config.label}
    </Badge>
  )
}
