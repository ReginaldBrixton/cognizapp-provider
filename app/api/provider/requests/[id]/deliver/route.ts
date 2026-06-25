import { NextRequest } from 'next/server'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

interface RouteParams {
	params: Promise<{ id: string }>
}

// POST /api/provider/requests/[id]/deliver
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const formData = await request.formData()
		const url = `${BACKEND_URL}/api/support/provider/requests/${id}/deliver`

		return proxyBackendWithCookieAuth(request, url, {
			method: 'POST',
			body: formData,
		})
	} catch (error) {
		return handleApiError(error, 'support:provider:requests:deliver:POST')
	}
}
