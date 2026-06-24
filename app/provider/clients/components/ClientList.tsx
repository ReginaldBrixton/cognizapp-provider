'use client'

import { useState, useEffect, useMemo } from 'react'
import { DollarSign, FileText, Search, ShoppingBag, Users, RefreshCw, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ClientRow } from './ClientRow'

interface ClientSummary {
	clientUid: string
	email: string
	fullName?: string
	institution?: string
	referralCode?: string
	totalRequests: number
	totalOrders: number
	totalSpent: number
	lastActivityAt: string
	tags: string[]
}

function normalizeClient(row: Record<string, unknown>): ClientSummary | null {
	const clientUid = String(row.clientUid ?? row.userKeyId ?? row.userId ?? row.id ?? '').trim()
	const email = String(row.email ?? '').trim()
	if (!clientUid && !email) return null
	return {
		clientUid: clientUid || email,
		email,
		fullName: String(row.fullName ?? row.full_name ?? ''),
		institution: String(row.institution ?? ''),
		referralCode: String(row.referralCode ?? row.referral_code ?? ''),
		totalRequests: Number(row.totalRequests ?? row.requestCount ?? row.request_count ?? 0) || 0,
		totalOrders: Number(row.totalOrders ?? row.total_orders ?? 0) || 0,
		totalSpent: Number(row.totalSpent ?? row.total_spent ?? row.lifetimeValue ?? 0) || 0,
		lastActivityAt: String(row.lastActivityAt ?? row.updatedAt ?? row.createdAt ?? ''),
		tags: Array.isArray(row.tags)
			? (row.tags as string[])
			: [
				row.institution ? String(row.institution) : '',
				row.referralCode ? `Ref: ${row.referralCode}` : '',
			].filter(Boolean),
	}
}

export function ClientList() {
	const [clients, setClients] = useState<ClientSummary[]>([])
	const [loading, setLoading] = useState(true)
	const [refreshing, setRefreshing] = useState(false)
	const [search, setSearch] = useState('')
	const [selectedId, setSelectedId] = useState<string | null>(null)

	const fetchClients = async (silent = false) => {
		try {
			if (!silent) setLoading(true)
			else setRefreshing(true)
			const res = await fetch('/api/support/provider/clients')
			if (res.ok) {
				const data = await res.json()
				const rows = Array.isArray(data.data) ? data.data : []
				setClients(rows.map(normalizeClient).filter(Boolean) as ClientSummary[])
			}
		} catch (err) {
			console.error('Failed to fetch clients:', err)
		} finally {
			setLoading(false)
			setRefreshing(false)
		}
	}

	useEffect(() => { void fetchClients() }, [])

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase()
		if (!q) return clients
		return clients.filter((c) =>
			[c.clientUid, c.email, c.fullName, c.referralCode].some((v) => v?.toLowerCase().includes(q)),
		)
	}, [clients, search])
	const selectedClient = useMemo(
		() => clients.find((client) => client.clientUid === selectedId) ?? null,
		[clients, selectedId],
	)

	if (loading) {
		return (
			<div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
				<div className='flex items-center justify-between border-b border-slate-100 px-3 py-2.5'>
					<div className='h-4 w-24 animate-pulse rounded bg-slate-200' />
					<div className='h-7 w-16 animate-pulse rounded bg-slate-200' />
				</div>
				<div className='divide-y divide-slate-100'>
					{[...Array(5)].map((_, i) => (
						<div key={i} className='flex items-center gap-3 px-3 py-3'>
							<div className='h-9 w-9 animate-pulse rounded-full bg-slate-100' />
							<div className='flex-1 space-y-1.5'>
								<div className='h-3.5 w-36 animate-pulse rounded bg-slate-100' />
								<div className='h-3 w-52 animate-pulse rounded bg-slate-100' />
							</div>
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
			{/* Toolbar */}
			<div className='flex items-center gap-2 border-b border-slate-100 px-3 py-2 lg:px-4 lg:py-3'>
				<div className='relative flex-1'>
					<Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400' />
					<Input
						placeholder='Search clients…'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
					className='h-8 pl-8 text-[13px] lg:h-10 lg:text-sm'
					/>
				</div>
				<span className='text-[12px] text-slate-400 lg:text-sm'>{filtered.length}</span>
				<button
					type='button'
					onClick={() => void fetchClients(true)}
					disabled={refreshing}
					className='flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50'
					title='Refresh'
				>
					<RefreshCw className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`} />
				</button>
			</div>

			{/* List */}
			{filtered.length === 0 ? (
				<div className='flex flex-col items-center justify-center py-14 text-center'>
					<Users className='mb-2 h-8 w-8 text-slate-300' />
					<p className='text-[13px] font-semibold text-slate-600'>{search ? 'No matching clients' : 'No clients yet'}</p>
					<p className='mt-1 text-[12px] text-slate-400'>{search ? 'Try a different search' : 'Clients will appear here once they submit requests'}</p>
				</div>
			) : (
				<div className='divide-y divide-slate-100'>
					{filtered.map((client) => (
						<ClientRow
							key={client.clientUid || client.email}
							client={client}
							onClick={() => setSelectedId(client.clientUid)}
						/>
					))}
				</div>
			)}
			{selectedClient && (
				<div className='fixed inset-0 z-modal flex items-end bg-slate-950/40 p-3 pb-mobile-nav-safe sm:items-center sm:justify-center sm:pb-3' onClick={() => setSelectedId(null)}>
					<div className='max-h-mobile-dialog w-full max-w-lg overflow-y-auto rounded-t-provider-sheet border border-slate-200 bg-white shadow-mobile-sheet sm:rounded-2xl' onClick={(e) => e.stopPropagation()}>
						<div className='flex items-center justify-between border-b border-slate-100 px-4 py-3'>
							<div>
								<p className='text-sm font-semibold text-slate-900'>{selectedClient.fullName || selectedClient.email}</p>
								<p className='text-xs text-slate-500'>{selectedClient.email || selectedClient.clientUid}</p>
							</div>
							<button type='button' aria-label='Close client details' onClick={() => setSelectedId(null)} className='flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-ring'>
								<X className='h-4 w-4' />
							</button>
						</div>
						<div className='grid gap-2.5 p-3 sm:grid-cols-3 sm:gap-3 sm:p-4'>
							<ClientMetric icon={<FileText className='h-4 w-4' />} label='Requests' value={selectedClient.totalRequests} />
							<ClientMetric icon={<ShoppingBag className='h-4 w-4' />} label='Orders' value={selectedClient.totalOrders} />
							<ClientMetric icon={<DollarSign className='h-4 w-4' />} label='Spent' value={`GHS ${selectedClient.totalSpent?.toFixed(0) || 0}`} />
						</div>
						<div className='border-t border-slate-100 p-3 sm:p-4'>
							<p className='text-xs font-semibold uppercase tracking-wide text-slate-400'>Profile tags</p>
							<div className='mt-2 flex flex-wrap gap-2'>
								{selectedClient.tags.length ? selectedClient.tags.map((tag) => (
									<span key={tag} className='rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600'>{tag}</span>
								)) : <span className='text-sm text-slate-400'>No tags yet</span>}
							</div>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}

function ClientMetric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
	return (
		<div className='rounded-xl border border-slate-200 bg-slate-50 p-2.5 sm:p-3'>
			<div className='mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm sm:mb-2 sm:h-9 sm:w-9'>
				{icon}
			</div>
			<p className='text-base font-semibold text-slate-900 sm:text-lg'>{value}</p>
			<p className='text-[11px] text-slate-500 sm:text-xs'>{label}</p>
		</div>
	)
}
