import { NextRequest, NextResponse } from 'next/server'
import {
	fetchBackend,
	getAuthHeaders,
	handleBackendResponse,
} from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

export async function GET(request: NextRequest) {
	const headers = await getAuthHeaders()

	if (!headers['Authorization']) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const queryString = request.nextUrl.searchParams.toString()

	try {
		const response = await fetchBackend(
			`${BACKEND_URL}/api/support/provider/clients${queryString ? `?${queryString}` : ''}`,
			{
				headers,
			},
		)

		return handleBackendResponse(response)
	} catch (error) {
		console.error('Failed to fetch clients:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch clients' },
			{ status: 500 },
		)
	}
}
