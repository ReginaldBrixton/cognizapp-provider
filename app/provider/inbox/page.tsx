import { RequestInbox } from './_components/RequestInbox'
import { fetchProviderData, type ProviderRequest } from '../_lib/server-data'

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
		<div className='h-full min-h-0 w-full overflow-hidden'>
			<div className='mx-auto flex h-full min-h-0 w-full max-w-screen-2xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:gap-6 lg:px-8 lg:py-6'>
				<div>
					<h1 className='text-lg font-semibold tracking-tight text-slate-900 lg:text-2xl'>Request Inbox</h1>
					<p className='text-[12px] text-slate-500 lg:text-sm'>Manage incoming support requests</p>
				</div>
				<RequestInbox
					key={params.toString()}
					initialRequests={initialRequests ?? []}
					initialFilters={filters}
				/>
			</div>
		</div>
	)
}
