import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/server/backend-url'
import {
	fetchWithCookieAuthRetry,
	jsonWithAuthCookies,
} from '@/lib/server/cookie-auth'
import { handleApiError } from '@/lib/server/api-proxy'

// POST /api/files/upload - Upload file
export async function POST(request: NextRequest) {
	try {
		const formData = await request.formData()
		const url = `${BACKEND_URL}/api/support/files/upload`

		const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(request, url, {
			method: 'POST',
			body: formData,
		})

		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const data = await response!.json()
		return jsonWithAuthCookies(data, response!.status, refreshed)
	} catch (error) {
		return handleApiError(error, 'support:files:upload:POST')
	}
}
