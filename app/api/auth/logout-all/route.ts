/**
 * POST /api/auth/logout-all
 *
 * Logout from all devices by revoking all active sessions.
 * This endpoint proxies to the backend and clears authentication cookies.
 */
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import {
	ACCESS_TOKEN_COOKIE,
	clearAuthCookies,
} from '@/app/api/_lib/auth-session'

export async function POST(request: NextRequest) {
	const cookieStore = await cookies()
	const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value

	if (!accessToken) {
		return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
	}

	try {
		const response = await fetch(`${BACKEND_URL}/api/auth/logout-all`, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'User-Agent': request.headers.get('user-agent') || '',
				'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
				'Accept-Language': request.headers.get('accept-language') || '',
			},
		})

		if (!response.ok) {
			const error = await response.json()
			return clearAuthCookies(NextResponse.json(error, { status: response.status }))
		}

		const data = await response.json()
		return clearAuthCookies(NextResponse.json(data))
	} catch (error) {
		return clearAuthCookies(
			NextResponse.json(
				{ error: 'Failed to logout from all devices' },
				{ status: 500 },
			),
		)
	}
}
