import { NextRequest, NextResponse } from 'next/server'

import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import {
	fetchWithCookieAuthRetry,
	jsonWithAuthCookies,
} from '@/app/api/_lib/cookie-auth'

interface RouteParams {
	params: Promise<{ id: string; action: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	const { id, action } = await params
	const body = await request.text()
	const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
		request,
		`${BACKEND_URL}/api/support/client/requests/${id}/paystack/${action}`,
		{
			method: 'POST',
			body,
			cache: 'no-store',
		},
	)

	if (!hasAuth) {
		return NextResponse.json(
			{ success: false, error: 'Authentication required' },
			{ status: 401 },
		)
	}

	const data = await response!.json().catch(() => ({ success: response!.ok }))
	return jsonWithAuthCookies(data, response!.status, refreshed)
}
