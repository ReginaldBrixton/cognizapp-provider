import { NextRequest, NextResponse } from 'next/server'
import {
	fetchBackend,
	getAuthHeaders,
	handleBackendResponse,
} from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

export async function GET() {
	const headers = await getAuthHeaders()
	if (!headers.Authorization) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const response = await fetchBackend(`${BACKEND_URL}/api/provider/settings`, {
			headers,
		})
		return handleBackendResponse(response)
	} catch (error) {
		console.error('Failed to fetch provider settings:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch provider settings' },
			{ status: 500 },
		)
	}
}

export async function PATCH(request: NextRequest) {
	const headers = await getAuthHeaders()
	if (!headers.Authorization) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	try {
		const body = await request.text()
		const response = await fetchBackend(`${BACKEND_URL}/api/provider/settings`, {
			method: 'PATCH',
			headers,
			body,
		})
		return handleBackendResponse(response)
	} catch (error) {
		console.error('Failed to update provider settings:', error)
		return NextResponse.json(
			{ error: 'Failed to update provider settings' },
			{ status: 500 },
		)
	}
}
