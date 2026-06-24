import { NextRequest } from 'next/server'
import {
	getAuthHeaders,
	fetchBackend,
	handleBackendResponse,
	handleApiError,
} from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

// GET /api/support/notifications/count - Get unread count
export async function GET(request: NextRequest) {
	try {
		const headers = await getAuthHeaders()
		const url = `${BACKEND_URL}/api/support/notifications/count`

		const response = await fetchBackend(url, { method: 'GET', headers })
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:notifications:count:GET')
	}
}
