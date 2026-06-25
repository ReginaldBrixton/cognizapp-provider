import { NextResponse } from 'next/server'

import { BACKEND_URL } from '@/lib/server/backend-url'
import { requireCookieAuth } from '@/lib/server/cookie-auth'

export async function GET() {
	try {
		const { headers, hasAuth } = await requireCookieAuth()
		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const response = await fetch(`${BACKEND_URL}/api/support/messages/references`, {
			method: 'GET',
			headers,
			next: { revalidate: 120 },
		})
		const data = await response.json()
		return NextResponse.json(data, { status: response.status })
	} catch (error) {
		console.error('[Support Message References API] GET error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch message references' },
			{ status: 500 },
		)
	}
}
