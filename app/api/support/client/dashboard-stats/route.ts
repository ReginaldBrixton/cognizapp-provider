import { NextResponse } from 'next/server'

import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { requireCookieAuth } from '@/app/api/_lib/cookie-auth'

export async function GET() {
	try {
		const { headers, hasAuth } = await requireCookieAuth()
		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const response = await fetch(
			`${BACKEND_URL}/api/support/client/dashboard-stats`,
			{
				method: 'GET',
				headers,
				next: { revalidate: 60 },
			},
		)
		const data = await response.json()

		return NextResponse.json(data, {
			status: response.status,
			headers: {
				'Cache-Control': 'private, max-age=60, stale-while-revalidate=240',
			},
		})
	} catch (error) {
		console.error('[Support Dashboard API] GET error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch support dashboard' },
			{ status: 500 },
		)
	}
}
