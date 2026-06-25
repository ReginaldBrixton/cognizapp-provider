'use client'

import { DollarSign, FileText, ShoppingBag, X } from 'lucide-react'
import { formatMoney } from '@/lib/format'
import { ClientMetric } from './ClientMetric'
import type { ClientSummary } from './types'

interface ClientDetailModalProps {
	client: ClientSummary | null
	onClose: () => void
}

export function ClientDetailModal({ client, onClose }: ClientDetailModalProps) {
	if (!client) return null

	return (
		<div
			className='fixed inset-0 z-modal flex items-end bg-slate-950/40 p-3 pb-mobile-nav-safe sm:items-center sm:justify-center sm:pb-3'
			onClick={onClose}
		>
			<div
				className='max-h-mobile-dialog w-full max-w-lg overflow-y-auto rounded-t-provider-sheet border border-slate-200 bg-white shadow-mobile-sheet sm:rounded-2xl'
				onClick={(e) => e.stopPropagation()}
			>
				<div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
					<div>
						<p className='text-sm font-semibold text-slate-900'>{client.fullName || client.email}</p>
						<p className='text-xs text-slate-500'>{client.email || client.clientUid}</p>
					</div>
					<button
						type='button'
						aria-label='Close client details'
						onClick={onClose}
						className='flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring'
					>
						<X className='h-4 w-4' />
					</button>
				</div>
				<div className='grid gap-2.5 p-3 sm:grid-cols-3 sm:gap-3 sm:p-4'>
					<ClientMetric icon={<FileText className='h-4 w-4' />} label='Requests' value={client.totalRequests} />
					<ClientMetric icon={<ShoppingBag className='h-4 w-4' />} label='Orders' value={client.totalOrders} />
					<ClientMetric icon={<DollarSign className='h-4 w-4' />} label='Spent' value={formatMoney(client.totalSpent)} />
				</div>
				<div className='border-t border-slate-100 p-3 sm:p-4'>
					<p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Profile tags</p>
					<div className='mt-2 flex flex-wrap gap-2'>
						{client.tags.length ? (
							client.tags.map((tag) => (
								<span key={tag} className='rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600'>
									{tag}
								</span>
							))
						) : (
							<span className='text-sm text-slate-400'>No tags yet</span>
						)}
					</div>
				</div>
			</div>
		</div>
	)
}
