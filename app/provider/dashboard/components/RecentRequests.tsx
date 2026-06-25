import Link from 'next/link'
import { FileText } from 'lucide-react'
import { formatRelativeTime, formatLabel } from '@/lib/format'
import { getRequestStatus } from '@/lib/status-config'
import type { ProviderRequest } from '@/lib/server/provider-data'

interface RecentRequestsProps {
	requests: ProviderRequest[]
}

export function RecentRequests({ requests }: RecentRequestsProps) {
	return (
		<div className='min-w-0 overflow-hidden rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-3 shadow-sm'>
			<div className='mb-2.5 flex items-center justify-between'>
				<div className='flex items-center gap-1.5'>
					<FileText className='h-4 w-4 text-slate-500 dark:text-muted-foreground' />
					<p className='text-[13px] font-semibold text-slate-800 dark:text-foreground'>
						Recent Requests
					</p>
				</div>
				<Link
					href='/provider/inbox'
					className='text-[11px] font-medium text-emerald-600 hover:underline'
				>
					View all
				</Link>
			</div>

			{requests.length === 0 ? (
				<p className='flex items-center justify-center py-8 text-[12px] text-slate-400 dark:text-muted-foreground/70'>
					No recent requests
				</p>
			) : (
				<div className='space-y-1.5'>
					{requests.map((req) => {
						const status = getRequestStatus(req.status)
						return (
							<Link
								key={req.id}
								href={`/provider/inbox?request=${req.id}`}
								className='flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-muted px-2.5 py-2 transition hover:bg-slate-100 dark:hover:bg-muted'
							>
								<div className='flex min-w-0 flex-1 items-center gap-2'>
									<span
										className={`h-2 w-2 shrink-0 rounded-full ${status.dot}`}
									/>
									<div className='min-w-0'>
										<p className='truncate text-[12px] font-semibold text-slate-800 dark:text-foreground'>
											{req.title || 'Untitled'}
										</p>
										<p className='truncate text-[11px] text-slate-400 dark:text-muted-foreground/70'>
											{req.fullName || req.email || 'Unknown client'}
										</p>
									</div>
								</div>
								<div className='hidden shrink-0 flex-col items-end gap-0.5 xs:flex'>
									<span className='rounded-md border border-slate-200 dark:border-border bg-white dark:bg-card px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:text-muted-foreground shadow-sm'>
										{status.label ?? formatLabel(req.status)}
									</span>
									<span className='text-[10px] text-slate-300 dark:text-muted-foreground/50'>
										{formatRelativeTime(req.createdAt)}
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
