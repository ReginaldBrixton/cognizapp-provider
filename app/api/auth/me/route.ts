import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import {
	forwardedAuthHeaders,
	getBestAccessToken,
	refreshBackendSession,
	setAuthCookies,
} from '@/app/api/_lib/auth-session'
import { normalizeUserResponse } from '@/lib/auth-contract'

export async function GET(request: NextRequest) {
	const accessToken = await getBestAccessToken(request)

	if (!accessToken) {
		const refreshed = await refreshBackendSession(request)
		if (!refreshed?.accessToken) {
			return NextResponse.json(
				{ success: false, error: 'Unauthorized' },
				{ status: 401 },
			)
		}
		return fetchMe(request, refreshed.accessToken, refreshed)
	}

	return fetchMe(request, accessToken)
}

async function fetchMe(
	request: NextRequest,
	accessToken: string,
	refreshed?: Awaited<ReturnType<typeof refreshBackendSession>>,
) {
	try {
		const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				...forwardedAuthHeaders(request),
			},
		})

		if (!response.ok) {
			if (response.status === 401 && !refreshed) {
				const nextSession = await refreshBackendSession(request)
				if (nextSession?.accessToken) {
					return fetchMe(request, nextSession.accessToken, nextSession)
				}
			}
			const errorText = await response.text().catch(() => '')
			return NextResponse.json(
				{
					success: false,
					error: errorText || 'Failed to fetch user',
				},
				{ status: response.status },
			)
		}

		const data = await response.json()
		const normalizedUser = normalizeUserResponse(data?.user ?? data)
		if (!normalizedUser) {
			return NextResponse.json(
				{ success: false, error: 'Invalid user payload' },
				{ status: 502 },
			)
		}

		const nextResponse = NextResponse.json({
			success: true,
			user: normalizedUser,
		})
		if (refreshed?.accessToken) {
			setAuthCookies(nextResponse, {
				accessToken: refreshed.accessToken,
				refreshToken: refreshed.refreshToken,
				expiresIn: refreshed.expiresIn,
			})
		}
		return nextResponse
	} catch (error) {
		return NextResponse.json(
			{ success: false, error: 'Network error' },
			{ status: 500 },
		)
	}
}
