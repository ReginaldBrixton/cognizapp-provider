import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import {
	fetchWithCookieAuthRetry,
	jsonWithAuthCookies,
} from '@/app/api/_lib/cookie-auth'

interface RouteParams {
	params: Promise<{ id: string }>
}

async function readProxyBody(response: Response) {
	const contentType = response.headers.get('content-type') || ''

	if (contentType.includes('application/json')) {
		return response.json().catch(() => null)
	}

	const text = await response.text().catch(() => '')
	return text ? { success: false, error: text } : null
}

// GET /api/support/client/requests/[id] - Get request by ID
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
			request,
			`${BACKEND_URL}/api/support/client/requests/${id}`,
			{
				method: 'GET',
				credentials: 'include',
			},
		)

		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const data = await readProxyBody(response!)
		return jsonWithAuthCookies(data ?? { success: response!.ok }, response!.status, refreshed)
	} catch (error) {
		console.error('[Support Client Requests API] GET error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch request' },
			{ status: 500 },
		)
	}
}

// PUT /api/support/client/requests/[id] - Update request
export async function PUT(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const body = await request.json()
		const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
			request,
			`${BACKEND_URL}/api/support/client/requests/${id}`,
			{
				method: 'PUT',
				credentials: 'include',
				body: JSON.stringify(body),
			},
		)

		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const data = await readProxyBody(response!)
		return jsonWithAuthCookies(data, response!.status, refreshed)
	} catch (error) {
		console.error('[Support Client Requests API] PUT error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to update request' },
			{ status: 500 },
		)
	}
}

// DELETE /api/support/client/requests/[id] - Delete draft request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
			request,
			`${BACKEND_URL}/api/support/client/requests/${id}`,
			{
				method: 'DELETE',
				credentials: 'include',
			},
		)

		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const data = await readProxyBody(response!)
		return jsonWithAuthCookies(data, response!.status, refreshed)
	} catch (error) {
		console.error('[Support Client Requests API] DELETE error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to delete request' },
			{ status: 500 },
		)
	}
}
