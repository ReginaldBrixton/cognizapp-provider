import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/lib/server/backend-url'
import {
	forwardedAuthHeaders,
	getBestAccessToken,
	refreshBackendSession,
	setAuthCookies,
} from '@/lib/server/auth-session'

export async function GET(request: NextRequest) {
	const accessToken = await getBestAccessToken(request)

	if (!accessToken) {
		const refreshed = await refreshBackendSession(request)
		if (!refreshed?.accessToken) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		return fetchSessions(request, refreshed.accessToken, refreshed)
	}

	return fetchSessions(request, accessToken)
}

async function fetchSessions(
	request: NextRequest,
	accessToken: string,
	refreshed?: Awaited<ReturnType<typeof refreshBackendSession>>,
) {
	try {
		const response = await fetch(`${BACKEND_URL}/api/auth/sessions`, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				...forwardedAuthHeaders(request),
			},
		})

		if (!response.ok) {
			if (response.status === 401 && !refreshed) {
				const nextSession = await refreshBackendSession(request)
				if (nextSession?.accessToken) {
					return fetchSessions(request, nextSession.accessToken, nextSession)
				}
			}
			return NextResponse.json(
				{ error: 'Failed to fetch sessions' },
				{ status: response.status },
			)
		}

		const data = await response.json()
		const nextResponse = NextResponse.json(data)
		if (refreshed?.accessToken) {
			setAuthCookies(nextResponse, {
				accessToken: refreshed.accessToken,
				refreshToken: refreshed.refreshToken,
				expiresIn: refreshed.expiresIn,
			})
		}
		return nextResponse
	} catch (error) {
		return NextResponse.json({ error: 'Network error' }, { status: 500 })
	}
}
