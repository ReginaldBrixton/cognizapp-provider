import { NextRequest } from 'next/server'

import { handleApiError, proxyBackendWithCookieAuth } from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

// Sets (or replaces) the username + PIN credentials for the authenticated
// provider. The PIN is sent over TLS to the backend, which hashes it with
// argon2id before storage — the PIN is never persisted in plaintext anywhere.
export async function POST(request: NextRequest) {
	try {
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/auth/pin/set`,
			{
				method: 'POST',
				body: await request.text(),
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		return handleApiError(error, 'auth:pin:set')
	}
}
