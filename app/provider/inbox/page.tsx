import { PageContainer } from '@/components/shared'
import { RequestInbox } from './_components/RequestInbox'
import { fetchProviderData, type ProviderRequest } from '@/lib/server/provider-data'

type InboxSearchParams =
	| Record<string, string | string[] | undefined>
	| Promise<Record<string, string | string[] | undefined>>

function firstParam(value: string | string[] | undefined) {
	return Array.isArray(value) ? value[0] : value
}

export default async function InboxPage({
	searchParams,
}: {
	searchParams?: InboxSearchParams
}) {
	const resolvedSearchParams = await Promise.resolve(searchParams ?? {})
	const filters = {
		status: firstParam(resolvedSearchParams.status) ?? '',
		paymentStatus:
			firstParam(resolvedSearchParams.paymentStatus) ??
			firstParam(resolvedSearchParams.payment_status) ??
			'',
		deadline: firstParam(resolvedSearchParams.deadline) ?? '',
		subscription: firstParam(resolvedSearchParams.subscription) ?? '',
		priority: firstParam(resolvedSearchParams.priority) ?? '',
	}
	const params = new URLSearchParams()
	Object.entries(filters).forEach(([key, value]) => {
		if (value && value !== 'all') params.set(key, value)
	})
	const initialRequests = await fetchProviderData<ProviderRequest[]>(
		`/api/support/provider/requests${params.size ? `?${params}` : ''}`,
		{ revalidate: 15 },
	)

	return (
		<PageContainer
			title='Request Inbox'
			subtitle='Manage incoming support requests'
			fillHeight
		>
			<RequestInbox
				key={params.toString()}
				initialRequests={initialRequests ?? []}
				initialFilters={filters}
			/>
		</PageContainer>
	)
}
