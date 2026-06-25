import { NextRequest } from 'next/server'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const { id } = await params
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/provider/requests/${id}`,
		)
	} catch (error) {
		return handleApiError(error, 'support:provider:requests:id:GET')
	}
}
