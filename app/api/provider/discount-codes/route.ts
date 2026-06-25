import { NextRequest } from 'next/server'
import { BACKEND_URL } from '@/lib/server/backend-url'
import { proxyBackendWithCookieAuth, handleApiError } from '@/lib/server/api-proxy'

export async function GET(request: NextRequest) {
	return proxyBackendWithCookieAuth(
		request,
		`${BACKEND_URL}/api/support/provider/discount-codes`,
	)
}

export async function POST(request: NextRequest) {
	try {
		const body = await request.text()
		return proxyBackendWithCookieAuth(request, `${BACKEND_URL}/api/support/provider/discount-codes`, {
			method: 'POST',
			body,
		})
	} catch (error) {
		return handleApiError(error, 'provider:discount-codes:POST')
	}
}
