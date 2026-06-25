'use client'

import { FileText, RefreshCw } from 'lucide-react'
import { RequestRow } from './RequestRow'
import type { ProviderRequest } from '@/lib/server/provider-data'

interface RequestTableProps {
	requests: ProviderRequest[]
	loading: boolean
	selectedId?: string | null
	onRefresh: () => void
	viewMode?: 'list' | 'split'
}

export function RequestTable({
	requests,
	loading,
	selectedId,
	onRefresh,
	viewMode = 'list',
}: RequestTableProps) {
	if (loading) {
		return (
			<div className='overflow-hidden rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm'>
				<div className='flex items-center justify-between border-b border-slate-100 dark:border-border px-3 py-2.5'>
					<div className='h-4 w-28 animate-pulse rounded bg-slate-200 dark:bg-muted' />
					<div className='h-7 w-20 animate-pulse rounded bg-slate-200 dark:bg-muted' />
				</div>
				<div className='space-y-px p-2'>
					{[...Array(5)].map((_, i) => (
						<div
							key={i}
							className='h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-muted'
						/>
					))}
				</div>
			</div>
		)
	}

	if (requests.length === 0) {
		return (
			<div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-border bg-white dark:bg-card py-10 text-center lg:py-14'>
				<FileText className='mb-2.5 h-9 w-9 text-slate-300 dark:text-muted-foreground/50' />
				<p className='text-[13px] font-semibold text-slate-700 dark:text-foreground'>
					No requests found
				</p>
				<p className='mt-1 text-[12px] text-slate-400 dark:text-muted-foreground/70'>
					Adjust filters or check back later
				</p>
			</div>
		)
	}

	return (
		<div className='min-h-0 overflow-hidden rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm'>
			<div className='flex items-center justify-between border-b border-slate-100 dark:border-border px-3 py-2 lg:px-4 lg:py-3'>
				<div className='flex items-center gap-2'>
					<span className='text-[13px] font-semibold text-slate-700 dark:text-foreground'>
						{requests.length} {requests.length === 1 ? 'request' : 'requests'}
					</span>
				</div>
				<button
					type='button'
					onClick={onRefresh}
					className='flex h-8 items-center gap-1.5 rounded-md border border-slate-200 dark:border-border px-2.5 text-[12px] font-medium text-slate-600 dark:text-muted-foreground transition hover:bg-slate-50 dark:hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring'
				>
					<RefreshCw className='h-3 w-3' /> Refresh
				</button>
			</div>

			{viewMode === 'list' ? (
				<div className='grid gap-2 p-2.5 sm:grid-cols-2 lg:gap-2.5 lg:p-3 2xl:grid-cols-3'>
					{requests.map((request) => (
						<RequestRow
							key={request.id}
							request={request}
							selected={selectedId === request.id}
							viewMode={viewMode}
							layout='card'
						/>
					))}
				</div>
			) : (
				<div className='max-h-provider-list divide-y divide-slate-100 dark:divide-border overflow-y-auto'>
					{requests.map((request) => (
						<RequestRow
							key={request.id}
							request={request}
							selected={selectedId === request.id}
							viewMode={viewMode}
						/>
					))}
				</div>
			)}
		</div>
	)
}
