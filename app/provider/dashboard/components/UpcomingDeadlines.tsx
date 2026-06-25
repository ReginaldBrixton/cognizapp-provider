import Link from 'next/link'
import { Clock, CalendarCheck } from 'lucide-react'
import { formatRelativeTime } from '@/lib/format'
import { getDeadlineInfo } from '@/lib/status-config'
import type { ProviderDeadline } from '@/lib/server/provider-data'

interface UpcomingDeadlinesProps {
	deadlines: ProviderDeadline[]
}

export function UpcomingDeadlines({ deadlines }: UpcomingDeadlinesProps) {
	return (
		<div className='min-w-0 overflow-hidden rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-3 shadow-sm'>
			<div className='mb-2.5 flex items-center gap-1.5'>
				<Clock className='h-4 w-4 text-slate-500 dark:text-muted-foreground' />
				<p className='text-[13px] font-semibold text-slate-800 dark:text-foreground'>
					Upcoming Deadlines
				</p>
			</div>

			{deadlines.length === 0 ? (
				<div className='flex flex-col items-center justify-center py-8 text-center'>
					<CalendarCheck className='mb-1.5 h-7 w-7 text-slate-300 dark:text-muted-foreground/50' />
					<p className='text-[12px] text-slate-400 dark:text-muted-foreground/70'>
						No upcoming deadlines
					</p>
				</div>
			) : (
				<div className='space-y-1.5'>
					{deadlines.map((item) => {
						const info = getDeadlineInfo(item.deadline)
						return (
							<Link
								key={item.id}
								href={`/provider/inbox?request=${item.id}`}
								className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg ${info.bg} px-2.5 py-2 transition hover:opacity-80`}
							>
								<span className={`h-2 w-2 shrink-0 rounded-full ${info.dot}`} />
								<span className='min-w-0 flex-1 truncate text-[12px] font-medium text-slate-800 dark:text-foreground'>
									{item.title}
								</span>
								<div className='flex min-w-0 max-w-[4.5rem] shrink-0 flex-col items-end gap-0.5'>
									{info.label && info.label !== 'No deadline' && (
										<span
											className={`truncate text-[10px] font-bold ${info.color}`}
										>
											{info.label}
										</span>
									)}
									<span className='hidden truncate text-[10px] text-slate-400 dark:text-muted-foreground/70 xs:block'>
										{formatRelativeTime(item.deadline)}
									</span>
								</div>
							</Link>
						)
					})}
				</div>
			)}
		</div>
	)
}
