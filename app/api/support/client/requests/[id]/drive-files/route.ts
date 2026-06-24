import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { requireCookieAuth } from '@/app/api/_lib/cookie-auth'

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

export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const { headers, hasAuth } = await requireCookieAuth()
		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Unauthorized' },
				{ status: 401 },
			)
		}

		const query = request.nextUrl.searchParams.toString()
		const response = await fetch(
			`${BACKEND_URL}/api/support/client/requests/${id}/drive-files${query ? `?${query}` : ''}`,
			{
				method: 'GET',
				headers,
				cache: 'no-store',
			},
		)
		const data = await readProxyBody(response)
		return NextResponse.json(data ?? { success: response.ok }, {
			status: response.status,
		})
	} catch (error) {
		console.error('[Support Request Drive Files API] GET error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch Drive files' },
			{ status: 500 },
		)
	}
}
