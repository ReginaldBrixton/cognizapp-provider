'use client'

import Link from 'next/link'
import { ChevronRight, Clock, Crown, MessageSquare, Paperclip } from 'lucide-react'
import { formatLabel, getInitials } from '@/lib/format'
import { getRequestStatus, getPaymentStatus, getDeadlineInfo } from '@/lib/status-config'
import type { ProviderRequest } from '../../_lib/server-data'

interface RequestRowProps {
	request: ProviderRequest
	selected?: boolean
	viewMode?: 'list' | 'split'
	layout?: 'row' | 'card'
}

export function RequestRow({ request, selected = false, layout = 'row' }: RequestRowProps) {
	const name = request.fullName || request.email || 'Client'
	const initials = getInitials(name)
	const deadlineValue = request.deadlineAt || request.deadline
	const deadline = getDeadlineInfo(deadlineValue)
	const isPriority = Number(request.subscriptionPriorityLevel ?? 0) >= 2
	const statusDot = getRequestStatus(request.status).dot
	const paymentDot = getPaymentStatus(request.paymentStatus ?? 'pending')?.dot ?? 'bg-slate-400'
	const detailHref = `/provider/inbox/${request.id}`

	if (layout === 'card') {
		return (
			<Link
				href={detailHref}
				className={`group relative flex flex-col gap-2.5 rounded-xl border bg-white p-2.5 shadow-sm transition-all hover:shadow-md sm:p-3.5 ${selected ? 'border-emerald-500 ring-2 ring-emerald-100' : 'border-slate-200 hover:border-slate-300'
					}`}
			>
				{isPriority && (
					<span className='absolute right-3 top-3 flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white'>
						<Crown className='h-2.5 w-2.5' /> PRO
					</span>
				)}

				<div className='flex items-start gap-2.5'>
					<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-[10px] font-bold text-white sm:h-9 sm:w-9 sm:text-[11px]'>
						{initials}
					</div>
					<div className='min-w-0 flex-1 pt-0.5'>
						<p className='line-clamp-2 text-[12px] font-semibold leading-snug text-slate-900 sm:text-[13px]'>
							{request.title || 'Untitled request'}
						</p>
						<p className='mt-0.5 truncate text-[11px] text-slate-500'>{name}</p>
					</div>
				</div>

				<div className='hidden flex-wrap items-center gap-1.5 xs:flex'>
					<span className='flex items-center gap-1 text-[11px] font-medium text-slate-700'>
						<span className={`inline-block h-1.5 w-1.5 rounded-full ${statusDot}`} />
						{formatLabel(request.status)}
					</span>
					{request.paymentStatus && (
						<span className='flex items-center gap-1 text-[11px] text-slate-600'>
							<span className={`inline-block h-1.5 w-1.5 rounded-full ${paymentDot}`} />
							{formatLabel(request.paymentStatus)}
						</span>
					)}
				</div>

				<div className='flex items-center justify-between border-t border-slate-100 pt-2 text-[10px] sm:pt-2.5 sm:text-[11px]'>
					<span className={`flex items-center gap-1 font-medium ${deadline.color}`}>
						<Clock className='h-3 w-3' />
						{deadline.label}
					</span>
					<div className='flex items-center gap-3 text-slate-400'>
						<span className='flex items-center gap-1'>
							<Paperclip className='h-3 w-3' /> {request.fileCount ?? 0}
						</span>
						<span className='flex items-center gap-1'>
							<MessageSquare className='h-3 w-3' /> {request.messageCount ?? 0}
						</span>
						<ChevronRight className='h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5' />
					</div>
				</div>
			</Link>
		)
	}

	return (
		<Link
			href={detailHref}
			className={`group flex items-center gap-2 px-3 py-2 transition-colors hover:bg-slate-50 sm:gap-3 sm:py-2.5 ${selected ? 'bg-emerald-50 border-l-2 border-emerald-500' : 'border-l-2 border-transparent'
				}`}
		>
			<div className='flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-500 text-[10px] font-bold text-white sm:h-8 sm:w-8 sm:text-[11px]'>
				{initials}
			</div>

			<div className='min-w-0 flex-1'>
				<div className='flex items-start justify-between gap-2'>
					<div className='min-w-0 flex-1'>
						<p className='flex items-center gap-1.5 truncate text-[12px] font-semibold text-slate-900 sm:text-[13px]'>
							{request.title}
							{isPriority && <Crown className='h-3 w-3 shrink-0 text-amber-500' />}
						</p>
						<p className='truncate text-[10.5px] text-slate-500 sm:text-[11px]'>{name}</p>
					</div>
					<div className='hidden shrink-0 flex-col items-end gap-1 sm:flex'>
						<span className='flex items-center gap-1 text-[11px] font-medium text-slate-700'>
							<span className={`h-1.5 w-1.5 rounded-full ${statusDot}`} />
							{formatLabel(request.status)}
						</span>
						<span className={`text-[11px] font-medium ${deadline.color}`}>{deadline.label}</span>
					</div>
				</div>
			</div>

			<ChevronRight className='h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500' />
		</Link>
	)
}
