/**
 * Error Handler for API Routes
 * Properly handles backend responses and errors
 */

import { NextResponse } from 'next/server'

export async function fetchBackend(
	url: string,
	options?: RequestInit,
	timeout: number = 30000,
): Promise<Response> {
	const controller = new AbortController()
	const timeoutId = setTimeout(() => controller.abort(), timeout)

	try {
		const response = await fetch(url, {
			...options,
			signal: controller.signal,
		})
		clearTimeout(timeoutId)
		return response
	} catch (error) {
		clearTimeout(timeoutId)
		if (error instanceof Error && error.name === 'AbortError') {
			return new Response(
				JSON.stringify({ error: 'Request timeout', code: 'timeout' }),
				{ status: 504, headers: { 'Content-Type': 'application/json' } }
			)
		}
		throw error
	}
}

export function handleApiError(error: unknown, context?: string): NextResponse {
	console.error(`[API Error${context ? ` - ${context}` : ''}]`, error)

	if (error instanceof Error) {
		if (error.message?.includes('fetch failed') || error.message?.includes('ECONNREFUSED')) {
			return NextResponse.json(
				{ error: 'Backend service unavailable', code: 'service_unavailable' },
				{ status: 503 }
			)
		}
	}

	return NextResponse.json(
		{ error: 'Internal server error', code: 'internal_error' },
		{ status: 500 }
	)
}

export function handleBackendResponse(response: Response): NextResponse {
	if (response.ok) {
		// Clone the response so we can read it
		return new NextResponse(response.body, {
			status: response.status,
			statusText: response.statusText,
			headers: response.headers,
		})
	}

	// Handle specific error status codes
	switch (response.status) {
		case 401:
			return NextResponse.json(
				{ error: 'Unauthorized', code: 'unauthorized' },
				{ status: 401 }
			)
		case 403:
			return NextResponse.json(
				{ error: 'Forbidden', code: 'forbidden' },
				{ status: 403 }
			)
		case 404:
			return NextResponse.json(
				{ error: 'Not found', code: 'not_found' },
				{ status: 404 }
			)
		case 503:
			return NextResponse.json(
				{ error: 'Service unavailable', code: 'service_unavailable' },
				{ status: 503 }
			)
		default:
			return NextResponse.json(
				{ error: 'Backend error', code: 'backend_error' },
				{ status: response.status }
			)
	}
}
