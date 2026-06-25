import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/server/backend-url'
import {
	forwardedAuthHeaders,
	getBestAccessToken,
	refreshBackendSession,
} from '@/lib/server/auth-session'

export async function POST(request: NextRequest) {
	let accessToken = await getBestAccessToken(request)

	if (!accessToken) {
		const refreshed = await refreshBackendSession(request)
		accessToken = refreshed?.accessToken || null
		if (!accessToken) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
	}

	try {
		const body = await request.json()
		const { session_id } = body

		if (!session_id) {
			return NextResponse.json(
				{ error: 'session_id is required' },
				{ status: 400 },
			)
		}

		const response = await fetch(`${BACKEND_URL}/api/auth/sessions/${session_id}`, {
			method: 'DELETE',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				...forwardedAuthHeaders(request),
			},
		})

		if (!response.ok) {
			const error = await response.json()
			return NextResponse.json(error, { status: response.status })
		}

		const data = await response.json()
		return NextResponse.json(data)
	} catch (error) {
		if (error instanceof SyntaxError) {
			return NextResponse.json(
				{ error: 'Invalid JSON in request body' },
				{ status: 400 },
			)
		}
		return NextResponse.json({ error: 'Network error' }, { status: 500 })
	}
}
