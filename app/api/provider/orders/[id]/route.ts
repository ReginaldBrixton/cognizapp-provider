import { NextRequest } from 'next/server'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

interface RouteParams {
	params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/provider/orders/${id}`,
		)
	} catch (error) {
		return handleApiError(error, 'provider:orders:id:GET')
	}
}
