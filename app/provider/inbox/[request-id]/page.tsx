import { notFound } from 'next/navigation'
import { RequestWorkspace } from '../_components/RequestInbox'
import { fetchProviderData } from '@/lib/server/provider-data'
import type { SupportMilestone, SupportRequest } from '@/types/support'

interface PageProps {
	params: Promise<{ 'request-id': string }>
	searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function RequestDetailPage({
	params,
	searchParams,
}: PageProps) {
	const { 'request-id': requestId } = await params
	const resolvedSearchParams = await searchParams

	const request = await fetchProviderData<SupportRequest>(
		`/api/support/provider/requests/${requestId}`,
		{ revalidate: 5 },
	)

	if (!request) notFound()

	const backParams = new URLSearchParams()
	Object.entries(resolvedSearchParams).forEach(([key, value]) => {
		if (!value || key === 'request') return
		if (Array.isArray(value)) value.forEach((v) => backParams.append(key, v))
		else backParams.set(key, value)
	})
	const backUrl = backParams.size
		? `/provider/inbox?${backParams.toString()}`
		: '/provider/inbox'

	const milestones =
		(await fetchProviderData<SupportMilestone[]>(
			`/api/support/provider/requests/${requestId}/milestones`,
			{ revalidate: 5 },
		)) ?? []

	return (
		<div className='flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 dark:bg-muted'>
			<div className='mx-auto min-h-0 w-full max-w-screen-2xl flex-1 overflow-hidden lg:px-6 lg:py-4'>
				<RequestWorkspace
					request={request}
					initialMilestones={milestones}
					backHref={backUrl}
				/>
			</div>
		</div>
	)
}
