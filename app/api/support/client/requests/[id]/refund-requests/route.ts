import { NextRequest, NextResponse } from 'next/server'

import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { requireCookieAuth } from '@/app/api/_lib/cookie-auth'

interface RouteParams {
	params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	const { id } = await params
	const { headers, hasAuth } = await requireCookieAuth()

	if (!hasAuth) {
		return NextResponse.json(
			{ success: false, error: 'Authentication required' },
			{ status: 401 },
		)
	}

	const body = await request.text()
	const response = await fetch(
		`${BACKEND_URL}/api/support/client/requests/${id}/refund-requests`,
		{
			method: 'POST',
			headers,
			body,
			cache: 'no-store',
		},
	)

	const data = await response.json().catch(() => ({ success: response.ok }))
	return NextResponse.json(data, { status: response.status })
}
