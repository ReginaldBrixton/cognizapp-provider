import { NextRequest } from 'next/server'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

interface RouteParams {
	params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const body = await request.json()
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/provider/requests/${id}/discount-decision`,
			{
				method: 'POST',
				body: JSON.stringify(body),
			},
		)
	} catch (error) {
		return handleApiError(error, 'support:provider:request:discount-decision')
	}
}
