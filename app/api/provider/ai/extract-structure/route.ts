import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/server/backend-url'
import {
	fetchWithCookieAuthRetry,
	jsonWithAuthCookies,
} from '@/lib/server/cookie-auth'
import { handleApiError } from '@/lib/server/api-proxy'

export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const url = `${BACKEND_URL}/api/support/ai/extract-structure`

		const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(request, url, {
			method: 'POST',
			body: formData,
		})

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
		return new NextResponse(text, { status: response.status })
	} catch (error) {
		return handleApiError(error, 'provider:ai:extract-structure:POST')
	}
}
