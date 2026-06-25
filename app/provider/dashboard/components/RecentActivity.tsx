import Link from 'next/link'
import {
	Activity,
	FileText,
	MessageSquare,
	CheckCircle,
	CreditCard,
	RotateCcw,
	UserPlus,
	Truck,
	AlertTriangle,
	Sparkles,
} from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'
import { getEventStyle, type EventStyle } from '@/lib/status-config'
import type { ProviderActivity } from '@/lib/server/provider-data'

const EVENT_ICONS: Record<EventStyle['icon'], typeof FileText> = {
	payment: CreditCard,
	message: MessageSquare,
	order: Truck,
	quote: CheckCircle,
	refund: RotateCcw,
	revision: AlertTriangle,
	ai: Sparkles,
	client: UserPlus,
	default: FileText,
}

interface RecentActivityProps {
	activities: ProviderActivity[]
}

export function RecentActivity({ activities }: RecentActivityProps) {
	return (
		<div className='min-w-0 overflow-hidden rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-3 shadow-sm'>
			<div className='mb-2.5 flex items-center gap-1.5'>
				<Activity className='h-4 w-4 text-slate-500 dark:text-muted-foreground' />
				<p className='text-[13px] font-semibold text-slate-800 dark:text-foreground'>
					Recent Activity
				</p>
			</div>

			{activities.length === 0 ? (
				<p className='flex items-center justify-center py-8 text-[12px] text-slate-400 dark:text-muted-foreground/70'>
					No recent activity
				</p>
			) : (
				<div className='space-y-1.5'>
					{activities.map((item) => {
						const { icon, color, bg } = getEventStyle(item.type)
						const Icon = EVENT_ICONS[icon]
						return (
							<div
								key={item.id}
								className='flex min-w-0 items-start gap-2.5 rounded-lg bg-slate-50 dark:bg-muted px-2.5 py-2'
							>
								<div
									className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${bg}`}
								>
									<Icon className={`h-3.5 w-3.5 ${color}`} />
								</div>
								<div className='min-w-0 flex-1'>
									<p className='text-[12px] font-medium leading-snug text-slate-800 dark:text-foreground'>
										{item.message}
									</p>
									{item.title && item.requestId ? (
										<Link
											href={`/provider/inbox?request=${item.requestId}`}
											className='truncate text-[11px] text-slate-400 dark:text-muted-foreground/70 hover:text-slate-600 dark:text-muted-foreground block'
										>
											{item.title}
										</Link>
									) : item.title ? (
										<p className='truncate text-[11px] text-slate-400 dark:text-muted-foreground/70'>
											{item.title}
										</p>
									) : null}
									<p className='mt-0.5 text-[10px] text-slate-300 dark:text-muted-foreground/50'>
										{formatRelativeTime(item.time)}
									</p>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
