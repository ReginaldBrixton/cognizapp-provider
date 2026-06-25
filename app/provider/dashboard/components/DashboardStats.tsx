import { FileText, MessageSquare, Repeat2, TrendingUp, Users } from 'lucide-react'
import type { ProviderDashboardStats } from '../../_lib/server-data'

interface DashboardStatsProps {
	stats: ProviderDashboardStats | null
}

interface StatItem {
	label: string
	value: string | number
	icon: typeof FileText
	color: string
	bg: string
}

export function DashboardStats({ stats }: DashboardStatsProps) {
	const totalRequests = stats?.totalRequests ?? 0
	const openRequests = stats?.openRequests ?? 0
	const convertedRequests = stats?.convertedRequests ?? 0
	const completionRate =
		totalRequests > 0 ? Math.round((convertedRequests / totalRequests) * 100) : 0

	const items: StatItem[] = [
		{ label: 'Total', value: totalRequests, icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
		{ label: 'Open', value: openRequests, icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
		{ label: 'Threads', value: stats?.messageThreads ?? 0, icon: MessageSquare, color: 'text-emerald-600', bg: 'bg-emerald-50' },
		{ label: 'Referrals', value: stats?.referrals ?? 0, icon: Users, color: 'text-violet-600', bg: 'bg-violet-50' },
		{ label: 'Conversion', value: `${completionRate}%`, icon: Repeat2, color: 'text-indigo-600', bg: 'bg-indigo-50' },
	]

	return (
		<div className='grid min-w-0 grid-cols-2 gap-2 sm:grid-cols-5 lg:gap-4'>
			{items.map((stat) => {
				const Icon = stat.icon
				return (
					<div
						key={stat.label}
						aria-label={`${stat.label}: ${stat.value}`}
						className='flex min-h-[72px] min-w-0 flex-col justify-between gap-1.5 overflow-hidden rounded-provider-card border border-slate-200 bg-white p-2.5 shadow-sm lg:min-h-32 lg:gap-2 lg:rounded-xl lg:p-5'
					>
						<div className={`flex h-7 w-7 items-center justify-center rounded-lg lg:h-10 lg:w-10 ${stat.bg}`}>
							<Icon className={`h-3.5 w-3.5 lg:h-5 lg:w-5 ${stat.color}`} />
						</div>
						<p className={`truncate text-[16px] font-bold leading-none lg:text-3xl ${stat.color}`}>
							{stat.value}
						</p>
						<p className='truncate text-[10px] font-medium text-slate-500 lg:text-sm'>
							{stat.label}
						</p>
					</div>
				)
			})}
		</div>
	)
}
