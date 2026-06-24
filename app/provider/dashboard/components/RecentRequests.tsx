import { FileText } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

interface Request {
	id: string
	title: string
	status: string
	deadlineAt?: string
	createdAt: string
	fullName?: string
	email?: string
}

const statusDots: Record<string, string> = {
	submitted: 'bg-blue-500',
	under_review: 'bg-blue-400',
	in_progress: 'bg-indigo-500',
	work_ready: 'bg-emerald-500',
	completed: 'bg-green-600',
	cancelled: 'bg-red-500',
}

function formatStatus(s: string) {
	return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function RecentRequests({ requests }: { requests: Request[] }) {
	return (
		<div className='min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
			<div className='mb-2.5 flex items-center justify-between'>
				<div className='flex items-center gap-1.5'>
					<FileText className='h-4 w-4 text-slate-500' />
					<p className='text-[13px] font-semibold text-slate-800'>Recent Requests</p>
				</div>
				<Link href='/provider/inbox' className='text-[11px] font-medium text-emerald-600 hover:underline'>View all</Link>
			</div>

			{requests.length === 0 ? (
				<div className='flex items-center justify-center py-8 text-[12px] text-slate-400'>No recent requests</div>
			) : (
				<div className='space-y-1.5'>
					{requests.map((req) => (
						<Link
							key={req.id}
							href={`/provider/inbox?request=${req.id}`}
							className='flex min-w-0 items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-2 transition hover:bg-slate-100'
						>
							<div className='flex min-w-0 flex-1 items-center gap-2'>
								<span className={`h-2 w-2 shrink-0 rounded-full ${statusDots[req.status] ?? 'bg-slate-400'}`} />
								<div className='min-w-0'>
									<p className='truncate text-[12px] font-semibold text-slate-800'>{req.title || 'Untitled'}</p>
									<p className='truncate text-[11px] text-slate-400'>{req.fullName || req.email || 'Unknown client'}</p>
								</div>
							</div>
							<div className='hidden shrink-0 flex-col items-end gap-0.5 xs:flex'>
								<span className='rounded-md bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-600 shadow-sm border border-slate-200'>
									{formatStatus(req.status)}
								</span>
								<span className='text-[10px] text-slate-300'>
									{formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
								</span>
							</div>
						</Link>
					))}
				</div>
			)}
		</div>
	)
}
