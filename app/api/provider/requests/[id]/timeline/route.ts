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
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/provider/requests/${id}/timeline`,
			{
				method: 'POST',
				body: await request.text(),
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		return handleApiError(error, 'provider:requests:id:timeline:POST')
	}
}
