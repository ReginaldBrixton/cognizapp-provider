import { PageContainer } from '@/components/shared'
import { ProviderSettingsForm } from './components/SettingsForm'

export const dynamic = 'force-dynamic'

export default function ProviderSettingsPage() {
	return (
		<PageContainer
			title='Settings'
			subtitle='Manage availability, workload, and notification preferences'
		>
			<ProviderSettingsForm />
		</PageContainer>
	)
}
