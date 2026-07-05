import { NextRequest } from 'next/server'

import { handleApiError, proxyBackendWithCookieAuth } from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

// Changes the PIN (and optionally the username) after verifying the current PIN.
export async function POST(request: NextRequest) {
	try {
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/auth/pin/change`,
			{
				method: 'POST',
				body: await request.text(),
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		return handleApiError(error, 'auth:pin:change')
	}
}
