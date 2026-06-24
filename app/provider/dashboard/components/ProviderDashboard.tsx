import { DashboardStats } from './DashboardStats'
import { UpcomingDeadlines } from './UpcomingDeadlines'
import { RecentActivity } from './RecentActivity'
import { QuickActions } from './QuickActions'
import { RecentRequests } from './RecentRequests'
import {
	fetchProviderData,
	type ProviderDashboardStats,
	type ProviderDeadline,
	type ProviderActivity,
	type ProviderRequest,
} from '../../_lib/server-data'

export async function ProviderDashboard() {
	const [stats, deadlines, activities, requests] = await Promise.all([
		fetchProviderData<ProviderDashboardStats>(
			'/api/support/provider/dashboard/stats',
			{ revalidate: 30 },
		),
		fetchProviderData<ProviderDeadline[]>(
			'/api/support/provider/dashboard/deadlines?limit=5',
			{ revalidate: 30 },
		),
		fetchProviderData<ProviderActivity[]>(
			'/api/support/provider/dashboard/activity?limit=8',
			{ revalidate: 30 },
		),
		fetchProviderData<ProviderRequest[]>(
			'/api/support/provider/requests',
			{ revalidate: 30 },
		),
	])

	const recentRequests = (requests ?? []).slice(0, 5)

	return (
		<div className='grid min-w-0 gap-3 overflow-x-hidden lg:gap-6'>
			<DashboardStats stats={stats} />
			<QuickActions />
			<div className='grid min-w-0 gap-3 lg:gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]'>
				<UpcomingDeadlines deadlines={deadlines ?? []} />
				<RecentActivity activities={activities ?? []} />
			</div>
			<RecentRequests requests={recentRequests} />
		</div>
	)
}
