import { NextRequest } from 'next/server'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

interface RouteParams {
	params: Promise<{ id: string; milestoneId: string }>
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
	try {
		const { id, milestoneId } = await params
		return proxyBackendWithCookieAuth(
			_request,
			`${BACKEND_URL}/api/support/provider/requests/${id}/milestones/${milestoneId}/history`,
			{ method: 'GET' },
		)
	} catch (error) {
		return handleApiError(error, 'support:provider:request:milestone:history:GET')
	}
}
