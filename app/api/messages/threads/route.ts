import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/server/backend-url'
import { proxyBackendWithCookieAuth } from '@/lib/server/api-proxy'

// GET /api/messages/threads - List user's threads
export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const queryString = searchParams.toString()
		const url = `${BACKEND_URL}/api/support/messages/threads${queryString ? `?${queryString}` : ''}`

		return proxyBackendWithCookieAuth(request, url, {
			method: 'GET',
		})
	} catch (error) {
		console.error('[Messages Threads API] GET error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch threads' },
			{ status: 500 },
		)
	}
}

// POST /api/messages/threads - Create a support or AI thread
export async function POST(request: NextRequest) {
	try {
		const body = await request.text()
		return proxyBackendWithCookieAuth(request, `${BACKEND_URL}/api/support/messages/threads`, {
			method: 'POST',
			body,
		})
	} catch (error) {
		console.error('[Messages Threads API] POST error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to create thread' },
			{ status: 500 },
		)
	}
}
