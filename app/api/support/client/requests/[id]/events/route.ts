import { NextRequest, NextResponse } from 'next/server'

import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { requireCookieAuth } from '@/app/api/_lib/cookie-auth'

async function readProxyBody(response: Response) {
	const contentType = response.headers.get('content-type') || ''

	if (contentType.includes('application/json')) {
		return response.json().catch(() => null)
	}

	const text = await response.text().catch(() => '')
	return text ? { success: false, error: text } : null
}

interface RouteParams {
	params: Promise<{ id: string }>
}

// GET /api/support/client/requests/[id]/events - List timeline events for a request
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { headers, hasAuth } = await requireCookieAuth()
		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		const { id } = await params
		const response = await fetch(`${BACKEND_URL}/api/support/client/requests/${id}/events`, {
			method: 'GET',
			headers,
			cache: 'no-store',
		})

		const data = await readProxyBody(response)
		return NextResponse.json(data ?? { success: response.ok }, {
			status: response.status,
		})
	} catch (error) {
		console.error('[Support Client Events API] GET error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch events' },
			{ status: 500 },
		)
	}
}
