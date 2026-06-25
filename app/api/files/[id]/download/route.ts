import { NextRequest, NextResponse } from 'next/server'
import {
	handleApiError,
} from '@/lib/server/api-proxy'
import {
	fetchWithCookieAuthRetry,
} from '@/lib/server/cookie-auth'
import { BACKEND_URL } from '@/lib/server/backend-url'

interface RouteParams {
	params: Promise<{ id: string }>
}

// GET /api/files/[id]/download - Download file
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const url = `${BACKEND_URL}/api/support/files/${id}/download`

		const { response, hasAuth } = await fetchWithCookieAuthRetry(request, url, {
			method: 'GET',
		})

		if (!hasAuth || !response) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		if (!response.ok) {
			const data = await response.json()
			return NextResponse.json(data, { status: response.status })
		}

		// Stream the file response
		const blob = await response.blob()
		const contentType =
			response.headers.get('content-type') || 'application/octet-stream'
		const contentDisposition = response.headers.get('content-disposition') || ''

		return new NextResponse(blob, {
			status: 200,
			headers: {
				'Content-Type': contentType,
				'Content-Disposition': contentDisposition,
			},
		})
	} catch (error) {
		return handleApiError(error, 'support:files:download:GET')
	}
}
