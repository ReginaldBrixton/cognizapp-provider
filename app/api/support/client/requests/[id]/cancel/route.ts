import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { requireCookieAuth } from '@/app/api/_lib/cookie-auth'

interface RouteParams {
	params: Promise<{ id: string }>
}

// POST /api/support/client/requests/[id]/cancel - Cancel a submitted request
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const { headers, hasAuth } = await requireCookieAuth()

		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const body = await request.json().catch(() => ({}))
		const response = await fetch(
			`${BACKEND_URL}/api/support/client/requests/${id}/cancel`,
			{
				method: 'POST',
				headers,
				credentials: 'include',
				body: JSON.stringify(body),
			},
		)

		const data = await response.json()
		return NextResponse.json(data, { status: response.status })
	} catch (error) {
		console.error('[Support Client Requests API] POST cancel error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to cancel request' },
			{ status: 500 },
		)
	}
}
