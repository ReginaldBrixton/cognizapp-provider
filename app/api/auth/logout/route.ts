import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import {
	clearAuthCookies,
	getBestAccessToken,
	refreshBackendSession,
} from '@/app/api/_lib/auth-session'

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
