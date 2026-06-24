import { NextResponse } from 'next/server'

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

// GET /api/support/payment-settings - Return active payment methods
export async function GET() {
	try {
		const { headers, hasAuth } = await requireCookieAuth()
		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		const response = await fetch(`${BACKEND_URL}/api/support/payment-settings`, {
			method: 'GET',
			headers,
			cache: 'no-store',
		})

		const data = await readProxyBody(response)
		return NextResponse.json(data ?? { success: response.ok }, {
			status: response.status,
		})
	} catch (error) {
		console.error('[Support Payment Settings API] GET error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch payment settings' },
			{ status: 500 },
		)
	}
}
