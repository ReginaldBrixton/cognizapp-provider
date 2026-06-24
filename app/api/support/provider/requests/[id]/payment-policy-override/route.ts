import { NextRequest } from 'next/server'

import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/api/support-helpers'

interface RouteParams {
	params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/admin/requests/${id}/payment-policy-override`,
			{
				method: 'POST',
				body: await request.text(),
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		return handleApiError(error, 'support:provider:payment-policy-override:POST')
	}
}
