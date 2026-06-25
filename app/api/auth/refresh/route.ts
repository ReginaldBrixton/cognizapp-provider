import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { normalizeRefreshResponse } from '@/lib/auth/contract'
import { BACKEND_URL } from '@/lib/server/backend-url'
import {
	clearAuthCookies,
	forwardedAuthHeaders,
	REFRESH_TOKEN_COOKIE,
	setAuthCookies,
} from '@/lib/server/auth-session'

export async function POST(request: NextRequest) {
	const cookieStore = await cookies()
	const body = await request.json().catch(() => ({}))
	const refreshToken =
		cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ||
		body?.refreshToken ||
		body?.refresh_token

	if (!refreshToken) {
		return clearAuthCookies(
			NextResponse.json(
				{ success: false, error: 'No refresh token' },
				{ status: 401 },
			),
		)
	}

	try {
		const response = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				...forwardedAuthHeaders(request),
			},
			body: JSON.stringify({
				refreshToken,
				refresh_token: refreshToken,
			}),
		})

		if (!response.ok) {
			const errorText = await response.text().catch(() => '')
			const errorResponse = NextResponse.json(
				{
					success: false,
					error: errorText || 'Failed to refresh token',
				},
				{ status: response.status },
			)
			return response.status === 401 || response.status === 403
				? clearAuthCookies(errorResponse)
				: errorResponse
		}

		const data = normalizeRefreshResponse(await response.json())

		// Update cookies with new tokens
		return setAuthCookies(NextResponse.json(data), {
			accessToken: data.accessToken,
			refreshToken: data.refreshToken,
			expiresIn: data.expiresIn,
		})
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: 'Network error' },
			{ status: 503 },
		)
	}
}
