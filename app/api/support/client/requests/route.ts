import { NextRequest, NextResponse } from 'next/server'

import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import {
	fetchWithCookieAuthRetry,
	jsonWithAuthCookies,
} from '@/app/api/_lib/cookie-auth'

async function readProxyBody(response: Response) {
	const contentType = response.headers.get('content-type') || ''

	if (contentType.includes('application/json')) {
		return response.json().catch(() => null)
	}

	const text = await response.text().catch(() => '')
	return text ? { success: false, error: text } : null
}

// GET /api/support/client/requests - List client's requests
export async function GET(request: NextRequest) {
	try {
		const queryString = request.nextUrl.searchParams.toString()
		const url = `${BACKEND_URL}/api/support/client/requests${queryString ? `?${queryString}` : ''}`

		const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(request, url, {
			method: 'GET',
			cache: 'no-store',
		})
		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		const data = await readProxyBody(response!)
		return jsonWithAuthCookies(data ?? { success: response!.ok }, response!.status, refreshed)
	} catch (error) {
		console.error('[Support Client Requests API] GET error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch requests' },
			{ status: 500 },
		)
	}
}

// POST /api/support/client/requests - Create new request
export async function POST(request: NextRequest) {
	try {
		const body = await request.text()
		const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
			request,
			`${BACKEND_URL}/api/support/client/requests`,
			{
				method: 'POST',
				body,
			},
		)
		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		const data = await readProxyBody(response!)
		return jsonWithAuthCookies(data ?? { success: response!.ok }, response!.status, refreshed)
	} catch (error) {
		console.error('[Support Client Requests API] POST error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to create request' },
			{ status: 500 },
		)
	}
}
