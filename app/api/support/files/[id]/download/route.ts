import { NextRequest, NextResponse } from 'next/server'
import {
	getAuthHeaders,
	fetchBackend,
	handleApiError,
} from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

interface RouteParams {
	params: Promise<{ id: string }>
}

// GET /api/support/files/[id]/download - Download file
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const headers = await getAuthHeaders()
		const { id } = await params
		const url = `${BACKEND_URL}/api/support/files/${id}/download`

		const response = await fetchBackend(url, {
			method: 'GET',
			headers,
		})

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
