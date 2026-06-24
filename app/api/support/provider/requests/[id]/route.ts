import { NextRequest, NextResponse } from 'next/server'
import {
	fetchBackend,
	getAuthHeaders,
	handleBackendResponse,
} from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const headers = await getAuthHeaders()

	if (!headers['Authorization']) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { id } = await params

	try {
		const response = await fetchBackend(
			`${BACKEND_URL}/api/support/provider/requests/${id}`,
			{
				headers,
			},
		)

		return handleBackendResponse(response)
	} catch (error) {
		console.error('Failed to fetch request:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch request' },
			{ status: 500 },
		)
	}
}
