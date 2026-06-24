'use client'

import { FileText, ShoppingBag, DollarSign, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

function initials(name: string) {
	return name.split(' ').filter(Boolean).map((p) => p[0]).join('').toUpperCase().slice(0, 2) || '??'
}

const avatarGradients = [
	'from-blue-500 to-blue-700',
	'from-violet-500 to-violet-700',
	'from-emerald-500 to-emerald-700',
	'from-rose-500 to-rose-700',
	'from-amber-500 to-amber-700',
	'from-cyan-500 to-cyan-700',
]

function getGradient(uid: string) {
	const idx = uid.charCodeAt(0) % avatarGradients.length
	return avatarGradients[idx]
}

export function ClientRow({ client, onClick }: { client: ClientSummary; onClick?: () => void }) {
	const displayName = client.fullName || client.email || client.clientUid.slice(0, 8)
	const lastActive = client.lastActivityAt
		? formatDistanceToNow(new Date(client.lastActivityAt), { addSuffix: true })
		: 'Never'
	const ini = initials(displayName)
	const gradient = getGradient(client.clientUid)

	return (
		<button
			type='button'
			onClick={onClick}
			className='group flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-ring lg:gap-3 lg:px-4 lg:py-4'
		>
			{/* Avatar */}
			<div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${gradient} text-[11px] font-bold text-white lg:h-11 lg:w-11 lg:text-sm`}>
				{ini}
			</div>

			{/* Info */}
			<div className='min-w-0 flex-1'>
				<p className='truncate text-[13px] font-semibold text-slate-900 lg:text-sm'>{displayName}</p>
				<p className='truncate text-[11px] text-slate-400 lg:text-xs'>
					{client.email} · {lastActive}
				</p>
				{client.tags.length > 0 && (
					<div className='mt-0.5 hidden flex-wrap gap-1 sm:flex'>
						{client.tags.slice(0, 2).map((tag) => (
							<span key={tag} className='rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600'>{tag}</span>
						))}
					</div>
				)}
			</div>

			{/* Stats */}
			<div className='hidden shrink-0 items-center gap-6 text-right lg:flex'>
				<Stat icon={<FileText className='h-3 w-3' />} value={client.totalRequests} label='Req' />
				<Stat icon={<ShoppingBag className='h-3 w-3' />} value={client.totalOrders} label='Orders' />
				<Stat icon={<DollarSign className='h-3 w-3' />} value={`GHS ${client.totalSpent?.toFixed(0) || 0}`} label='Spent' />
			</div>

			<ChevronRight className='h-4 w-4 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5' />
		</button>
	)
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: string | number; label: string }) {
	return (
		<div className='flex flex-col items-end'>
			<div className='flex items-center gap-1 text-[12px] font-semibold text-slate-800'>
				{icon} {value}
			</div>
			<p className='text-[10px] text-slate-400'>{label}</p>
		</div>
	)
}
