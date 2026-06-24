import { NextRequest } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { proxyBackendWithCookieAuth } from '@/lib/api/support-helpers'

export async function GET(request: NextRequest) {
	return proxyBackendWithCookieAuth(
		request,
		`${BACKEND_URL}/api/support/provider/discount-codes`,
	)
}

export async function POST(request: NextRequest) {
	const body = await request.text()
	return proxyBackendWithCookieAuth(request, `${BACKEND_URL}/api/support/provider/discount-codes`, {
		method: 'POST',
		body,
	})
}
