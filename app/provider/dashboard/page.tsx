import { PageContainer } from '@/components/shared'
import { ProviderDashboard } from './components/ProviderDashboard'

export default function DashboardPage() {
	return (
		<PageContainer
			title='Dashboard'
			subtitle='Overview of your support operations'
		>
			<ProviderDashboard />
		</PageContainer>
	)
}
