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

// GET /api/support/provider/requests/[id]/timeline
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const headers = await getAuthHeaders()
		const { id } = await params
		const url = `${BACKEND_URL}/api/support/provider/requests/${id}/timeline`

		const response = await fetchBackend(url, { method: 'GET', headers })
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:provider:requests:timeline:GET')
	}
}

// POST /api/support/provider/requests/[id]/timeline
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const headers = await getAuthHeaders()
		const { id } = await params
		const body = await request.json()
		const url = `${BACKEND_URL}/api/support/provider/requests/${id}/timeline`

		const response = await fetchBackend(url, {
			method: 'POST',
			headers: { ...headers, 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:provider:requests:timeline:POST')
	}
}
