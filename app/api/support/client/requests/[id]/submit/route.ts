import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import {
	fetchWithCookieAuthRetry,
	jsonWithAuthCookies,
} from '@/app/api/_lib/cookie-auth'

interface RouteParams {
	params: Promise<{ id: string }>
}

// POST /api/support/client/requests/[id]/submit - Submit a draft request
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
			request,
			`${BACKEND_URL}/api/support/client/requests/${id}/submit`,
			{
				method: 'POST',
				credentials: 'include',
			},
		)

		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const data = await response!.json()
		return jsonWithAuthCookies(data, response!.status, refreshed)
	} catch (error) {
		console.error('[Support Client Requests Submit API] POST error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to submit request' },
			{ status: 500 },
		)
	}
}
