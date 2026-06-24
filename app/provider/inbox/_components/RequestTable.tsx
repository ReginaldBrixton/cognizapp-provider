'use client'

import { FileText, RefreshCw } from 'lucide-react'
import { RequestRow } from './RequestRow'

interface SupportRequest {
	id: string
	title: string
	status: string
	serviceTags: string[]
	academicLevel: string
	deadline?: string
	deadlineAt?: string
	createdAt: string
	clientUid: string
	email?: string
	fullName?: string
	paymentStatus?: string
	subscriptionPlanId?: string
	subscriptionPlanName?: string
	subscriptionPriorityLevel?: number
	fileCount?: number
	messageCount?: number
	messageThreadId?: string
}

interface RequestTableProps {
	requests: SupportRequest[]
	loading: boolean
	selectedId?: string | null
	onRefresh: () => void
	viewMode?: 'list' | 'split'
}

export function RequestTable({ requests, loading, selectedId, onRefresh, viewMode = 'list' }: RequestTableProps) {
	if (loading) {
		return (
			<div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
				<div className='flex items-center justify-between border-b border-slate-100 px-3 py-2.5'>
					<div className='h-4 w-28 animate-pulse rounded bg-slate-200' />
					<div className='h-7 w-20 animate-pulse rounded bg-slate-200' />
				</div>
				<div className='space-y-px p-2'>
					{[...Array(5)].map((_, i) => (
						<div key={i} className='h-14 animate-pulse rounded-lg bg-slate-100' />
					))}
				</div>
			</div>
		)
	}

	if (requests.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-10 text-center lg:py-14'>
				<FileText className='mb-2.5 h-9 w-9 text-slate-300' />
				<p className='text-[13px] font-semibold text-slate-700'>No requests found</p>
				<p className='mt-1 text-[12px] text-slate-400'>Adjust filters or check back later</p>
			</div>
		)
	}

	return (
		<div className='min-h-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
			<div className='flex items-center justify-between border-b border-slate-100 px-3 py-2 lg:px-4 lg:py-3'>
				<div className='flex items-center gap-2'>
					<span className='text-[13px] font-semibold text-slate-700'>{requests.length} {requests.length === 1 ? 'request' : 'requests'}</span>
				</div>
				<button
					type='button'
					onClick={onRefresh}
					className='flex h-8 items-center gap-1.5 rounded-md border border-slate-200 px-2.5 text-[12px] font-medium text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-ring'
				>
					<RefreshCw className='h-3 w-3' /> Refresh
				</button>
			</div>

			{viewMode === 'list' ? (
				<div className='grid gap-2 p-2.5 sm:grid-cols-2 lg:gap-2.5 lg:p-3 2xl:grid-cols-3'>
					{requests.map((request) => (
						<RequestRow key={request.id} request={request} selected={selectedId === request.id} viewMode={viewMode} layout='card' />
					))}
				</div>
			) : (
				<div className='max-h-provider-list divide-y divide-slate-100 overflow-y-auto'>
					{requests.map((request) => (
						<RequestRow key={request.id} request={request} selected={selectedId === request.id} viewMode={viewMode} />
					))}
				</div>
			)}
		</div>
	)
}
