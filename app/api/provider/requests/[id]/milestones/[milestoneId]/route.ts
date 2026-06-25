import { NextRequest } from 'next/server'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

interface RouteParams {
	params: Promise<{ id: string; milestoneId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const { id, milestoneId } = await params
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/provider/requests/${id}/milestones/${milestoneId}`,
			{
				method: 'PATCH',
				body: await request.text(),
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		return handleApiError(error, 'support:provider:request:milestone:PATCH')
	}
}
