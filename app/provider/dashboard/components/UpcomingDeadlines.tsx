import { Clock, AlertTriangle, CalendarCheck } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface Deadline {
	id: string
	title: string
	type: string
	deadline: string
	status: string
}

function urgency(deadline: string) {
	const h = (new Date(deadline).getTime() - Date.now()) / 3_600_000
	if (h < 0) return { label: 'Overdue', color: 'text-red-600', dot: 'bg-red-500', bg: 'bg-red-50' }
	if (h < 24) return { label: 'Due today', color: 'text-red-500', dot: 'bg-red-400', bg: 'bg-red-50' }
	if (h < 48) return { label: 'Due tomorrow', color: 'text-orange-600', dot: 'bg-orange-400', bg: 'bg-orange-50' }
	return { label: '', color: 'text-slate-500', dot: 'bg-slate-300', bg: 'bg-slate-50' }
}

export function UpcomingDeadlines({ deadlines }: { deadlines: Deadline[] }) {
	return (
		<div className='min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
			<div className='mb-2.5 flex items-center gap-1.5'>
				<Clock className='h-4 w-4 text-slate-500' />
				<p className='text-[13px] font-semibold text-slate-800'>Upcoming Deadlines</p>
			</div>

			{deadlines.length === 0 ? (
				<div className='flex flex-col items-center justify-center py-8 text-center'>
					<CalendarCheck className='mb-1.5 h-7 w-7 text-slate-300' />
					<p className='text-[12px] text-slate-400'>No upcoming deadlines</p>
				</div>
			) : (
				<div className='space-y-1.5'>
					{deadlines.map((item) => {
						const u = urgency(item.deadline)
						return (
							<Link
								key={item.id}
								href={`/provider/inbox?request=${item.id}`}
								className={`grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 rounded-lg ${u.bg} px-2.5 py-2 transition hover:opacity-80`}
							>
								<span className={`h-2 w-2 shrink-0 rounded-full ${u.dot}`} />
								<span className='min-w-0 flex-1 truncate text-[12px] font-medium text-slate-800'>{item.title}</span>
								<div className='flex min-w-0 max-w-[4.5rem] shrink-0 flex-col items-end gap-0.5'>
									{u.label && <span className={`truncate text-[10px] font-bold ${u.color}`}>{u.label}</span>}
									<span className='hidden truncate text-[10px] text-slate-400 xs:block'>
										{formatDistanceToNow(new Date(item.deadline), { addSuffix: true })}
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
