import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { normalizeRefreshResponse } from '@/lib/auth-contract'
import { BACKEND_URL } from './backend-url'

export const ACCESS_TOKEN_COOKIE = 'cognizap_admin_access_token'
export const REFRESH_TOKEN_COOKIE = 'cognizap_admin_refresh_token'

function getBearerToken(value?: string | null) {
	if (!value) {
		return null
	}

	const match = value.match(/^Bearer\s+(.+)$/i)
	return match?.[1]?.trim() || null
}

export function getRequestAccessToken(request?: NextRequest) {
	return getBearerToken(request?.headers.get('authorization'))
}

export function forwardedAuthHeaders(request?: NextRequest) {
	return {
		'User-Agent': request?.headers.get('user-agent') || '',
		'X-Forwarded-For': request?.headers.get('x-forwarded-for') || '',
		'Accept-Language': request?.headers.get('accept-language') || '',
	}
}

export async function getCookieAccessToken() {
	const cookieStore = await cookies()
	return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || null
}

export async function getCookieRefreshToken() {
	const cookieStore = await cookies()
	return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value || null
}

export async function refreshBackendSession(request?: NextRequest) {
	const refreshToken = await getCookieRefreshToken()
	if (!refreshToken) {
		return null
	}

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
		return null
	}

	return normalizeRefreshResponse(await response.json())
}

export async function getBestAccessToken(request?: NextRequest) {
	return (await getCookieAccessToken()) || getRequestAccessToken(request)
}

export function setAuthCookies(
	response: NextResponse,
	options: {
		accessToken?: string | null
		refreshToken?: string | null
		expiresIn?: number | null
	},
) {
	if (options.accessToken) {
		appendSetCookie(
			response,
			serializeCookie(ACCESS_TOKEN_COOKIE, options.accessToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: options.expiresIn || 900,
				path: '/',
			}),
		)
	}

	if (options.refreshToken) {
		appendSetCookie(
			response,
			serializeCookie(REFRESH_TOKEN_COOKIE, options.refreshToken, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 30 * 24 * 60 * 60,
				path: '/',
			}),
		)
	}

	return response
}

export function clearAuthCookies(response: NextResponse) {
	appendSetCookie(
		response,
		serializeCookie(ACCESS_TOKEN_COOKIE, '', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 0,
			path: '/',
		}),
	)
	appendSetCookie(
		response,
		serializeCookie(REFRESH_TOKEN_COOKIE, '', {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 0,
			path: '/',
		}),
	)
	return response
}

function serializeCookie(
	name: string,
	value: string,
	options: {
		httpOnly?: boolean
		secure?: boolean
		sameSite?: 'lax' | 'strict' | 'none'
		maxAge?: number
		path?: string
	},
) {
	const parts = [`${name}=${encodeURIComponent(value)}`]

	if (typeof options.maxAge === 'number') {
		parts.push(`Max-Age=${Math.floor(options.maxAge)}`)
	}
	if (options.path) {
		parts.push(`Path=${options.path}`)
	}
	if (options.httpOnly) {
		parts.push('HttpOnly')
	}
	if (options.secure) {
		parts.push('Secure')
	}
	if (options.sameSite) {
		parts.push(`SameSite=${options.sameSite}`)
	}

	return parts.join('; ')
}

function appendSetCookie(response: NextResponse, value: string) {
	const headers = response.headers as Headers & {
		append?: (name: string, value: string) => void
		get?: (name: string) => string | null
		set?: (name: string, value: string) => void
	}

	if (typeof headers.append === 'function') {
		headers.append('set-cookie', value)
		return
	}

	if (typeof headers.get === 'function' && typeof headers.set === 'function') {
		const existing = headers.get('set-cookie')
		headers.set('set-cookie', existing ? `${existing}, ${value}` : value)
	}
}
