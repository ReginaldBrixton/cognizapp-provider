import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/server/backend-url'
import {
	clearAuthCookies,
	getBestAccessToken,
	refreshBackendSession,
} from '@/lib/server/auth-session'

export async function POST(request: NextRequest) {
	const accessToken = await getBestAccessToken(request)

	try {
		if (accessToken) {
			const response = await fetch(`${BACKEND_URL}/api/auth/logout`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${accessToken}`,
				},
			})

			if (response.status !== 401) {
				return clearAuthCookies(NextResponse.json({ success: true }))
			}
		}

		const refreshed = await refreshBackendSession(request)
		if (refreshed?.accessToken) {
			await fetch(`${BACKEND_URL}/api/auth/logout`, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${refreshed.accessToken}`,
				},
			})
		}

		return clearAuthCookies(NextResponse.json({ success: true }))
	} catch (error) {
		return clearAuthCookies(NextResponse.json({ success: true }))
	}
}
