'use client'

import { useState, useEffect, useMemo } from 'react'
import { Search, Users, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { ClientRow } from './ClientRow'
import { ClientDetailModal } from './ClientDetailModal'
import { normalizeClient } from './normalize-client'
import type { ClientSummary } from './types'

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
			const res = await fetch('/api/provider/clients')
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

	useEffect(() => {
		void fetchClients()
	}, [])

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase()
		if (!q) return clients
		return clients.filter((c) =>
			[c.clientUid, c.email, c.fullName, c.referralCode].some((v) =>
				v?.toLowerCase().includes(q),
			),
		)
	}, [clients, search])
	const selectedClient = useMemo(
		() => clients.find((client) => client.clientUid === selectedId) ?? null,
		[clients, selectedId],
	)

	if (loading) {
		return (
			<div className='overflow-hidden rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm'>
				<div className='flex items-center justify-between border-b border-slate-100 dark:border-border px-3 py-2.5'>
					<div className='h-4 w-24 animate-pulse rounded bg-slate-200 dark:bg-muted' />
					<div className='h-7 w-16 animate-pulse rounded bg-slate-200 dark:bg-muted' />
				</div>
				<div className='divide-y divide-slate-100 dark:divide-border'>
					{[...Array(5)].map((_, i) => (
						<div key={i} className='flex items-center gap-3 px-3 py-3'>
							<div className='h-9 w-9 animate-pulse rounded-full bg-slate-100 dark:bg-muted' />
							<div className='flex-1 space-y-1.5'>
								<div className='h-3.5 w-36 animate-pulse rounded bg-slate-100 dark:bg-muted' />
								<div className='h-3 w-52 animate-pulse rounded bg-slate-100 dark:bg-muted' />
							</div>
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='overflow-hidden rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm'>
			<div className='flex items-center gap-2 border-b border-slate-100 dark:border-border px-3 py-2 lg:px-4 lg:py-3'>
				<div className='relative flex-1'>
					<Search className='absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400 dark:text-muted-foreground/70' />
					<Input
						placeholder='Search clients…'
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className='h-8 pl-8 text-[13px] lg:h-10 lg:text-sm'
					/>
				</div>
				<span className='text-[12px] text-slate-400 dark:text-muted-foreground/70 lg:text-sm'>
					{filtered.length}
				</span>
				<button
					type='button'
					onClick={() => void fetchClients(true)}
					disabled={refreshing}
					className='flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 dark:border-border text-slate-500 dark:text-muted-foreground transition hover:bg-slate-50 dark:hover:bg-muted disabled:opacity-50'
					title='Refresh'
				>
					<RefreshCw
						className={`h-3.5 w-3.5 ${refreshing ? 'animate-spin' : ''}`}
					/>
				</button>
			</div>

			{filtered.length === 0 ? (
				<div className='flex flex-col items-center justify-center py-14 text-center'>
					<Users className='mb-2 h-8 w-8 text-slate-300 dark:text-muted-foreground/50' />
					<p className='text-[13px] font-semibold text-slate-600 dark:text-muted-foreground'>
						{search ? 'No matching clients' : 'No clients yet'}
					</p>
					<p className='mt-1 text-[12px] text-slate-400 dark:text-muted-foreground/70'>
						{search
							? 'Try a different search'
							: 'Clients will appear here once they submit requests'}
					</p>
				</div>
			) : (
				<div className='divide-y divide-slate-100 dark:divide-border'>
					{filtered.map((client) => (
						<ClientRow
							key={client.clientUid || client.email}
							client={client}
							onClick={() => setSelectedId(client.clientUid)}
						/>
					))}
				</div>
			)}

			<ClientDetailModal
				client={selectedClient}
				onClose={() => setSelectedId(null)}
			/>
		</div>
	)
}
