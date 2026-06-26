import { notFound } from 'next/navigation'
import { fetchProviderData } from '@/lib/server/provider-data'
import type { MilestoneHistoryRound, SupportMilestone, SupportRequest } from '@/types/support'
import { MilestoneWorkspace } from './_components/MilestoneWorkspace'

interface PageProps {
	params: Promise<{ 'request-id': string; milestoneId: string }>
}

export default async function MilestoneDetailPage({ params }: PageProps) {
	const { 'request-id': requestId, milestoneId } = await params

	const [request, milestone, history] = await Promise.all([
		fetchProviderData<SupportRequest>(
			`/api/support/provider/requests/${requestId}`,
			{ revalidate: 5 },
		),
		fetchProviderData<SupportMilestone>(
			`/api/support/provider/requests/${requestId}/milestones/${milestoneId}`,
			{ revalidate: 5 },
		),
		fetchProviderData<MilestoneHistoryRound[]>(
			`/api/support/provider/requests/${requestId}/milestones/${milestoneId}/history`,
			{ revalidate: 5 },
		),
	])

	if (!request || !milestone) notFound()

	const backHref = `/provider/inbox/${requestId}`

	return (
		<MilestoneWorkspace
			request={request}
			milestone={milestone}
			initialHistory={history ?? []}
			backHref={backHref}
		/>
	)
}
