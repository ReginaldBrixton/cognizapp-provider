'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select'

interface Filters {
	status: string
	paymentStatus: string
	service: string
	search: string
	deadline: string
	subscription: string
	priority: string
}

interface RequestFiltersProps {
	filters: Filters
	onFiltersChange: (filters: Filters) => void
}

function formatFilterLabel(value: string) {
	return value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function FilterSelectControls({
	filters,
	onFiltersChange,
	compact = false,
}: RequestFiltersProps & { compact?: boolean }) {
	return (
		<>
			<Select value={filters.status || 'all'} onValueChange={(v) => onFiltersChange({ ...filters, status: v === 'all' ? '' : v })}>
				<SelectTrigger className={`${compact ? 'h-10' : 'h-9 lg:h-10'} w-full text-[13px] lg:w-[150px]`}>
					<SelectValue placeholder='Status' />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value='all'>All Status</SelectItem>
					<SelectItem value='submitted'>Submitted</SelectItem>
					<SelectItem value='payment_pending'>Payment pending</SelectItem>
					<SelectItem value='in_progress'>In progress</SelectItem>
					<SelectItem value='work_ready'>Work ready</SelectItem>
					<SelectItem value='quoted'>Quoted</SelectItem>
					<SelectItem value='accepted'>Accepted</SelectItem>
					<SelectItem value='completed'>Completed</SelectItem>
				</SelectContent>
			</Select>

			<Select value={filters.paymentStatus || 'all'} onValueChange={(v) => onFiltersChange({ ...filters, paymentStatus: v === 'all' ? '' : v })}>
				<SelectTrigger className={`${compact ? 'h-10' : 'h-9 lg:h-10'} w-full text-[13px] lg:w-[160px]`}>
					<SelectValue placeholder='Payment' />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value='all'>All Payments</SelectItem>
					<SelectItem value='deposit_required'>Deposit required</SelectItem>
					<SelectItem value='deposit_paid'>Deposit paid</SelectItem>
					<SelectItem value='final_payment_required'>Final due</SelectItem>
					<SelectItem value='paid'>Paid</SelectItem>
				</SelectContent>
			</Select>

			<Select value={filters.deadline || 'all'} onValueChange={(v) => onFiltersChange({ ...filters, deadline: v === 'all' ? '' : v })}>
				<SelectTrigger className={`${compact ? 'h-10' : 'h-9 lg:h-10'} w-full text-[13px] lg:w-[150px]`}>
					<SelectValue placeholder='Deadline' />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value='all'>Any Deadline</SelectItem>
					<SelectItem value='overdue'>Overdue</SelectItem>
					<SelectItem value='24h'>Next 24h</SelectItem>
					<SelectItem value='7d'>Next 7 days</SelectItem>
					<SelectItem value='none'>No deadline</SelectItem>
				</SelectContent>
			</Select>

			<Select value={filters.priority || 'all'} onValueChange={(v) => onFiltersChange({ ...filters, priority: v === 'all' ? '' : v })}>
				<SelectTrigger className={`${compact ? 'h-10' : 'h-9 lg:h-10'} w-full text-[13px] lg:w-[150px]`}>
					<SelectValue placeholder='Priority' />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value='all'>All Priority</SelectItem>
					<SelectItem value='high'>Priority</SelectItem>
					<SelectItem value='standard'>Standard</SelectItem>
				</SelectContent>
			</Select>
		</>
	)
}

export function RequestFilters({ filters, onFiltersChange }: RequestFiltersProps) {
	const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
	const hasActiveFilters =
		filters.status ||
		filters.paymentStatus ||
		filters.service ||
		filters.search ||
		filters.deadline ||
		filters.subscription ||
		filters.priority

	const clearAll = () =>
		onFiltersChange({
			status: '',
			paymentStatus: '',
			service: '',
			search: '',
			deadline: '',
			subscription: '',
			priority: '',
		})

	const activeFilterCount = [
		filters.status,
		filters.paymentStatus,
		filters.service,
		filters.deadline,
		filters.subscription,
		filters.priority,
	].filter(Boolean).length

	return (
		<>
			<div className='lg:hidden'>
				<div className='flex gap-2'>
					<div className='relative min-w-0 flex-1'>
						<Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
						<Input
							placeholder='Search requests...'
							value={filters.search}
							onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
							className='h-10 pl-8 text-[13px]'
						/>
					</div>
					<button
						type='button'
						onClick={() => setMobileFiltersOpen(true)}
						className='relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm'
						aria-label='Open filters'
					>
						<SlidersHorizontal className='h-4 w-4' />
						{activeFilterCount > 0 && (
							<span className='absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-bold text-white'>
								{activeFilterCount}
							</span>
						)}
					</button>
				</div>

				{hasActiveFilters && (
					<div className='mt-2 flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none'>
						{[
							filters.status,
							filters.paymentStatus,
							filters.deadline,
							filters.priority,
						].filter(Boolean).slice(0, 3).map((filter) => (
							<span key={filter} className='shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600'>
								{formatFilterLabel(filter)}
							</span>
						))}
						<button type='button' onClick={clearAll} className='shrink-0 text-[10px] font-semibold text-slate-500'>
							Clear
						</button>
					</div>
				)}

				{mobileFiltersOpen && (
					<div className='fixed inset-0 z-modal flex items-end bg-slate-950/40 p-mobile-sheet-gutter pb-mobile-nav-safe' onClick={() => setMobileFiltersOpen(false)}>
						<div className='max-h-mobile-sheet w-full overflow-hidden rounded-provider-sheet border border-slate-200 bg-white shadow-mobile-sheet' onClick={(e) => e.stopPropagation()}>
							<div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
								<div>
									<p className='text-[13px] font-semibold text-slate-900'>Filters</p>
									<p className='text-[11px] text-slate-400'>Narrow the request list</p>
								</div>
								<button type='button' onClick={() => setMobileFiltersOpen(false)} className='flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100'>
									<X className='h-4 w-4' />
								</button>
							</div>
							<div className='space-y-2 overflow-y-auto p-3'>
								<FilterSelectControls filters={filters} onFiltersChange={onFiltersChange} compact />
							</div>
							<div className='grid grid-cols-2 gap-2 border-t border-slate-100 p-3'>
								<button type='button' onClick={clearAll} className='h-9 rounded-lg border border-slate-200 text-[12px] font-medium text-slate-600'>
									Clear
								</button>
								<button type='button' onClick={() => setMobileFiltersOpen(false)} className='h-9 rounded-lg bg-emerald-600 text-[12px] font-semibold text-white'>
									Done
								</button>
							</div>
						</div>
					</div>
				)}
			</div>

			<div className='hidden grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center'>
				<div className='relative min-w-[180px] flex-1 sm:col-span-2 lg:min-w-[280px]'>
					<Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
					<Input
						placeholder='Search requests...'
						value={filters.search}
						onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
						className='h-9 pl-8 text-[13px] lg:h-10 lg:text-sm'
					/>
				</div>

				<FilterSelectControls filters={filters} onFiltersChange={onFiltersChange} />

				{hasActiveFilters && (
					<button
						type='button'
						onClick={clearAll}
						className='flex h-8 items-center gap-1 rounded-md px-2 text-[12px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700'
					>
						<X className='h-3.5 w-3.5' />
						Clear
					</button>
				)}
			</div>
		</>
	)
}
