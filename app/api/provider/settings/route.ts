import { NextRequest } from 'next/server'
import {
	handleApiError,
	proxyBackendWithCookieAuth,
} from '@/lib/server/api-proxy'
import { BACKEND_URL } from '@/lib/server/backend-url'

// Note: The backend exposes provider settings at /api/provider/settings
// (via providerSettingsRoutes) separately from the /api/support/provider/*
// routes. This is intentional — not a path mismatch.
export async function GET(request: NextRequest) {
	try {
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/provider/settings`,
		)
	} catch (error) {
		return handleApiError(error, 'provider:settings:GET')
	}
}

export async function PATCH(request: NextRequest) {
	try {
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/provider/settings`,
			{
				method: 'PATCH',
				body: await request.text(),
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		return handleApiError(error, 'provider:settings:PATCH')
	}
}
