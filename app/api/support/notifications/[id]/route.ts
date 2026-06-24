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

// PUT /api/support/notifications/[id] - Mark as read
export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		const headers = await getAuthHeaders()
		const { id } = await params
		const url = `${BACKEND_URL}/api/support/notifications/${id}`

		const response = await fetchBackend(url, { method: 'PUT', headers })
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:notifications:id:PUT')
	}
}

// DELETE /api/support/notifications/[id] - Delete notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const headers = await getAuthHeaders()
		const { id } = await params
		const url = `${BACKEND_URL}/api/support/notifications/${id}`

		const response = await fetchBackend(url, { method: 'DELETE', headers })
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:notifications:id:DELETE')
	}
}
