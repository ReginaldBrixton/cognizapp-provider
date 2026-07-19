import { NextRequest } from 'next/server'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

export async function GET(request: NextRequest) {
	try {
		const queryString = request.nextUrl.searchParams.toString()
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/provider/quotes${queryString ? `?${queryString}` : ''}`,
		)
	} catch (error) {
		return handleApiError(error, 'provider:quotes:GET')
	}
}

export async function POST(request: NextRequest) {
	try {
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/provider/quotes`,
			{
				method: 'POST',
				body: await request.text(),
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		return handleApiError(error, 'provider:quotes:POST')
	}
}
