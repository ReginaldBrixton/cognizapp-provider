import { NextRequest } from 'next/server'

import { BACKEND_URL } from '@/lib/server/backend-url'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'

interface RouteParams {
	params: Promise<{ id: string; messageId: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const { id, messageId } = await params
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/messages/threads/${id}/messages/${messageId}`,
			{
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: await request.text(),
			},
		)
	} catch (error) {
		return handleApiError(error, 'support:messages:PATCH')
	}
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const { id, messageId } = await params
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/messages/threads/${id}/messages/${messageId}`,
			{ method: 'DELETE' },
		)
	} catch (error) {
		return handleApiError(error, 'support:messages:DELETE')
	}
}
