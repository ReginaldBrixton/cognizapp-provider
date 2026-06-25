import { PageContainer } from '@/components/shared'
import { ClientList } from './components'

export default function ClientsPage() {
	return (
		<PageContainer title='Clients' subtitle='View and manage client relationships' fillHeight>
			<ClientList />
		</PageContainer>
	)
}
