import { NextRequest } from 'next/server'
import {
	fetchBackend,
	getAuthHeaders,
	handleApiError,
	handleBackendResponse,
} from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

interface RouteParams {
	params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const headers = await getAuthHeaders()
		const { id } = await params
		const response = await fetchBackend(
			`${BACKEND_URL}/api/support/provider/requests/${id}/milestones`,
			{ headers },
		)
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:provider:request:milestones:GET')
	}
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const headers = await getAuthHeaders()
		const { id } = await params
		const body = await request.json()
		const response = await fetchBackend(
			`${BACKEND_URL}/api/support/provider/requests/${id}/milestones`,
			{
				method: 'POST',
				headers: { ...headers, 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			},
		)
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:provider:request:milestones:POST')
	}
}
