import { NextRequest, NextResponse } from 'next/server'
import {
	fetchWithCookieAuthRetry,
	jsonWithAuthCookies,
} from '@/app/api/_lib/cookie-auth'
import { getAuthHeaders as getServerAuthHeaders } from './server-auth'

export async function getAuthHeaders(): Promise<Record<string, string>> {
	return getServerAuthHeaders()
}

export async function fetchBackend(
	input: string,
	init: RequestInit = {},
): Promise<Response> {
	return fetch(input, {
		cache: 'no-store',
		...init,
	})
}

export async function handleBackendResponse(response: Response) {
	const contentType = response.headers.get('content-type') || ''

	if (contentType.includes('application/json')) {
		const data = await response.json()
		return NextResponse.json(data, { status: response.status })
	}

	const text = await response.text()
	return new NextResponse(text, {
		status: response.status,
		headers: contentType ? { 'content-type': contentType } : undefined,
	})
}

export async function proxyBackendWithCookieAuth(
	request: NextRequest,
	input: string,
	init: RequestInit = {},
) {
	const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
		request,
		input,
		init,
	)

	if (!hasAuth || !response) {
		return NextResponse.json(
			{ success: false, error: 'Authentication required' },
			{ status: 401 },
		)
	}

	const contentType = response.headers.get('content-type') || ''
	if (contentType.includes('application/json')) {
		const data = await response.json()
		return jsonWithAuthCookies(data, response.status, refreshed)
	}

	const text = await response.text()
	return new NextResponse(text, {
		status: response.status,
		headers: contentType ? { 'content-type': contentType } : undefined,
	})
}

export function handleApiError(error: unknown, context: string) {
	console.error(`[${context}]`, error)

	if (error instanceof Response) {
		return new NextResponse(null, { status: error.status })
	}

	return NextResponse.json(
		{
			success: false,
			error: error instanceof Error ? error.message : 'Internal server error',
			context,
		},
		{ status: 500 },
	)
}
