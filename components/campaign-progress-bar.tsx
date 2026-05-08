'use client'

interface CampaignProgressBarProps {
  sent: number
  opened: number
  clicked: number
  bounced: number
  total: number
}

export function CampaignProgressBar({
  sent,
  opened,
  clicked,
  bounced,
  total,
}: CampaignProgressBarProps) {
  if (total === 0) return null

  const remaining = total - sent - opened - clicked - bounced
  const pct = (n: number) => Math.max((n / total) * 100, 0)

  const segments = [
    { value: pct(clicked), color: 'bg-teal-500', label: 'Clicked', count: clicked },
    { value: pct(opened), color: 'bg-emerald-500', label: 'Opened', count: opened },
    { value: pct(sent), color: 'bg-green-400', label: 'Sent', count: sent },
    { value: pct(bounced), color: 'bg-red-500', label: 'Bounced', count: bounced },
    { value: pct(remaining), color: 'bg-slate-200 dark:bg-slate-700', label: 'Pending', count: remaining },
  ]

  return (
    <div className="space-y-2">
      {/* Segmented bar */}
      <div className="h-3 rounded-full overflow-hidden flex bg-slate-100 dark:bg-slate-800">
        {segments.map((seg, i) =>
          seg.value > 0 ? (
            <div
              key={i}
              className={`${seg.color} transition-all duration-500 ease-out`}
              style={{ width: `${seg.value}%` }}
              title={`${seg.label}: ${seg.count}`}
            />
          ) : null
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {segments
          .filter((s) => s.count > 0 && s.label !== 'Pending')
          .map((seg, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <div className={`h-2 w-2 rounded-full ${seg.color}`} />
              <span>
                {seg.count.toLocaleString()} {seg.label}
              </span>
            </div>
          ))}
      </div>
    </div>
  )
}
