import { NextRequest } from 'next/server'
import {
	getAuthHeaders,
	fetchBackend,
	handleBackendResponse,
	handleApiError,
} from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

// GET /api/support/notifications - List notifications
export async function GET(request: NextRequest) {
	try {
		const headers = await getAuthHeaders()
		const { searchParams } = new URL(request.url)
		const queryString = searchParams.toString()
		const url = `${BACKEND_URL}/api/support/notifications${queryString ? `?${queryString}` : ''}`

		const response = await fetchBackend(url, { method: 'GET', headers })
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:notifications:GET')
	}
}
