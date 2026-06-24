import { NextRequest, NextResponse } from 'next/server'

import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { requireCookieAuth } from '@/app/api/_lib/cookie-auth'

export async function POST(request: NextRequest) {
	try {
		const { headers, hasAuth } = await requireCookieAuth()
		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const body = await request.text()
		const response = await fetch(`${BACKEND_URL}/api/support/ai/chat`, {
			method: 'POST',
			headers,
			body,
		})
		const data = await response.json()
		return NextResponse.json(data, { status: response.status })
	} catch (error) {
		console.error('[Support AI Chat API] POST error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to send AI support message' },
			{ status: 500 },
		)
	}
}
