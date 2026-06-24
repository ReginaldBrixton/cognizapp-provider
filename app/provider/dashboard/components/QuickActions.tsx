'use client'

import Link from 'next/link'
import { Inbox, Users, BadgePercent, Gift, Settings } from 'lucide-react'

const actions = [
	{ label: 'Inbox', href: '/provider/inbox', icon: Inbox, color: 'text-blue-600', bg: 'bg-blue-50', desc: 'New requests' },
	{ label: 'Clients', href: '/provider/clients', icon: Users, color: 'text-violet-600', bg: 'bg-violet-50', desc: 'Manage clients' },
	{ label: 'Discounts', href: '/provider/discount-codes', icon: BadgePercent, color: 'text-emerald-600', bg: 'bg-emerald-50', desc: 'Promo codes' },
	{ label: 'Referrals', href: '/provider/referrals', icon: Gift, color: 'text-amber-600', bg: 'bg-amber-50', desc: 'Track referrals' },
	{ label: 'Settings', href: '/provider/settings', icon: Settings, color: 'text-slate-600', bg: 'bg-slate-100', desc: 'Preferences' },
]

export function QuickActions() {
	return (
		<div className='hidden rounded-xl border border-slate-200 bg-white p-3 shadow-sm lg:block lg:p-5'>
			<p className='mb-2.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:text-xs'>Quick actions</p>
			<div className='grid grid-cols-3 gap-2 sm:grid-cols-5 lg:gap-3'>
				{actions.map((a) => {
					const Icon = a.icon
					return (
						<Link
							key={a.label}
							href={a.href}
							className='flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-100 p-2.5 text-center transition hover:bg-slate-50 hover:shadow-sm lg:min-h-24'
						>
							<div className={`flex h-8 w-8 items-center justify-center rounded-lg ${a.bg}`}>
								<Icon className={`h-4 w-4 ${a.color}`} />
							</div>
							<p className='text-[11px] font-medium leading-tight text-slate-700 lg:text-sm'>{a.label}</p>
						</Link>
					)
				})}
			</div>
		</div>
	)
}
