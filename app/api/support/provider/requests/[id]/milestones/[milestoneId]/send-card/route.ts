import { NextRequest } from 'next/server'
import {
	fetchBackend,
	getAuthHeaders,
	handleApiError,
	handleBackendResponse,
} from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

interface RouteParams {
	params: Promise<{ id: string; milestoneId: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const headers = await getAuthHeaders()
		const { id, milestoneId } = await params
		const body = await request.json()
		const response = await fetchBackend(
			`${BACKEND_URL}/api/support/provider/requests/${id}/milestones/${milestoneId}/send-card`,
			{
				method: 'POST',
				headers: { ...headers, 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			},
		)
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:provider:request:milestone:send-card')
	}
}
