import { NextRequest, NextResponse } from 'next/server'
import { getAuthHeaders } from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

export async function GET(request: NextRequest) {
	const headers = await getAuthHeaders()

	if (!headers['Authorization']) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const response = await fetch(
			`${BACKEND_URL}/api/support/provider/dashboard/stats`,
			{
				headers,
			},
		)

		const data = await response.json()
		return NextResponse.json(data, { status: response.status })
	} catch (error) {
		console.error('Failed to fetch dashboard stats:', error)
		return NextResponse.json(
			{ success: false, error: 'Support backend unavailable' },
			{ status: 503 },
		)
	}
}
