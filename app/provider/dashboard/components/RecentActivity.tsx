'use client'

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
import { formatDistanceToNow } from 'date-fns'
import Link from 'next/link'

interface ActivityItem {
	id: string
	type: string
	message: string
	time: string
	title?: string
	requestId?: string
}

function getEventStyle(type: string): { icon: React.ElementType; color: string; bg: string } {
	if (type.includes('payment')) return { icon: CreditCard, color: 'text-emerald-600', bg: 'bg-emerald-50' }
	if (type.includes('message') || type.includes('chat')) return { icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50' }
	if (type.includes('order') || type.includes('delivery')) return { icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50' }
	if (type.includes('quote')) return { icon: CheckCircle, color: 'text-indigo-600', bg: 'bg-indigo-50' }
	if (type.includes('refund')) return { icon: RotateCcw, color: 'text-rose-600', bg: 'bg-rose-50' }
	if (type.includes('revision')) return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50' }
	if (type.includes('ai')) return { icon: Sparkles, color: 'text-violet-600', bg: 'bg-violet-50' }
	if (type.includes('client') || type.includes('user')) return { icon: UserPlus, color: 'text-cyan-600', bg: 'bg-cyan-50' }
	return { icon: FileText, color: 'text-slate-500', bg: 'bg-slate-100' }
}

export function RecentActivity({ activities }: { activities: ActivityItem[] }) {
	return (
		<div className='min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
			<div className='mb-2.5 flex items-center gap-1.5'>
				<Activity className='h-4 w-4 text-slate-500' />
				<p className='text-[13px] font-semibold text-slate-800'>Recent Activity</p>
			</div>

			{activities.length === 0 ? (
				<div className='flex items-center justify-center py-8 text-[12px] text-slate-400'>No recent activity</div>
			) : (
				<div className='space-y-1.5'>
					{activities.map((item) => {
						const { icon: Icon, color, bg } = getEventStyle(item.type)
						return (
							<div key={item.id} className='flex min-w-0 items-start gap-2.5 rounded-lg bg-slate-50 px-2.5 py-2'>
								<div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${bg}`}>
									<Icon className={`h-3.5 w-3.5 ${color}`} />
								</div>
								<div className='min-w-0 flex-1'>
									<p className='text-[12px] font-medium text-slate-800 leading-snug'>{item.message}</p>
									{item.title && item.requestId ? (
										<Link href={`/provider/inbox?request=${item.requestId}`} className='truncate text-[11px] text-slate-400 hover:text-slate-600 block'>
											{item.title}
										</Link>
									) : item.title ? (
										<p className='truncate text-[11px] text-slate-400'>{item.title}</p>
									) : null}
									<p className='text-[10px] text-slate-300 mt-0.5'>
										{formatDistanceToNow(new Date(item.time), { addSuffix: true })}
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
