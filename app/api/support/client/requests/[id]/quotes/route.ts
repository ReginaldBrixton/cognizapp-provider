import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { getAuthHeaders } from '@/lib/api/support-helpers'

interface RouteParams {
	params: Promise<{ id: string }>
}

// GET /api/support/client/requests/[id]/quotes - Get quotes for request
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const headers = await getAuthHeaders()

		if (!headers['Authorization']) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const response = await fetch(
			`${BACKEND_URL}/api/support/client/requests/${id}/quotes`,
			{
				method: 'GET',
				headers,
				credentials: 'include',
			},
		)

		const data = await response.json()
		return NextResponse.json(data, { status: response.status })
	} catch (error) {
		console.error('[Support Client Requests API] GET quotes error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch quotes' },
			{ status: 500 },
		)
	}
}
