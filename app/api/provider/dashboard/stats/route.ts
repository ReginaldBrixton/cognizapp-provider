import { NextRequest } from 'next/server'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

export async function GET(request: NextRequest) {
	try {
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/provider/dashboard/stats`,
		)
	} catch (error) {
		return handleApiError(error, 'provider:dashboard:stats:GET')
	}
}
