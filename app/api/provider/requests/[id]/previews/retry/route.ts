import { NextRequest } from 'next/server'

import { BACKEND_URL } from '@/lib/server/backend-url'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'

interface RouteParams {
	params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/provider/requests/${id}/previews/retry`,
			{ method: 'POST' },
		)
	} catch (error) {
		return handleApiError(error, 'support:provider:requests:previews:retry:POST')
	}
}
