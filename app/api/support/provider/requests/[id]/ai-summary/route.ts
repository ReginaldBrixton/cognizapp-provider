import { NextRequest } from 'next/server'
import {
	getAuthHeaders,
	fetchBackend,
	handleBackendResponse,
	handleApiError,
} from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

interface RouteParams {
	params: Promise<{ id: string }>
}

// GET /api/support/provider/requests/[id]/ai-summary
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const headers = await getAuthHeaders()
		const { id } = await params
		const url = `${BACKEND_URL}/api/support/provider/requests/${id}/ai-summary`

		const response = await fetchBackend(url, { method: 'GET', headers })
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:provider:requests:ai-summary:GET')
	}
}
