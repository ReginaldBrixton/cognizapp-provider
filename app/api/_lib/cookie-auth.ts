import { cookies, headers as getRequestHeaders } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import {
	ACCESS_TOKEN_COOKIE,
	getBestAccessToken,
	refreshBackendSession,
	setAuthCookies,
} from './auth-session'

function getBearerToken(value?: string | null) {
	if (!value) {
		return null
	}

	const match = value.match(/^Bearer\s+(.+)$/i)
	return match?.[1]?.trim() || null
}

export async function getCookieAuthHeaders(
	extraHeaders?: Record<string, string>,
): Promise<Record<string, string>> {
	const cookieStore = await cookies()
	const requestHeaders = await getRequestHeaders()
	const accessToken =
		cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ||
		getBearerToken(requestHeaders.get('authorization'))

	const outgoingHeaders: Record<string, string> = {
		'Content-Type': 'application/json',
		...extraHeaders,
	}

	if (accessToken) {
		outgoingHeaders.Authorization = `Bearer ${accessToken}`
	}

	return outgoingHeaders
}

export async function requireCookieAuth(
	extraHeaders?: Record<string, string>,
): Promise<{ headers: Record<string, string>; hasAuth: boolean }> {
	const authHeaders = await getCookieAuthHeaders(extraHeaders)
	const hasAuth = !!authHeaders.Authorization
	return { headers: authHeaders, hasAuth }
}

type RefreshedSession = Awaited<ReturnType<typeof refreshBackendSession>>

function normalizeHeaders(headers?: HeadersInit) {
	const normalized: Record<string, string> = {}
	if (!headers) {
		return normalized
	}
	if (headers instanceof Headers) {
		headers.forEach((value, key) => {
			normalized[key] = value
		})
		return normalized
	}
	if (Array.isArray(headers)) {
		for (const [key, value] of headers) {
			normalized[key] = value
		}
		return normalized
	}
	return { ...(headers as Record<string, string>) }
}

async function getRequestCookieAuthHeaders(
	request: NextRequest,
	extraHeaders?: HeadersInit,
) {
	const accessToken = await getBestAccessToken(request)
	const outgoingHeaders: Record<string, string> = {
		'Content-Type': 'application/json',
		...normalizeHeaders(extraHeaders),
	}

	if (accessToken) {
		outgoingHeaders.Authorization = `Bearer ${accessToken}`
	}

	return outgoingHeaders
}

export async function fetchWithCookieAuthRetry(
	request: NextRequest,
	input: string,
	init: RequestInit = {},
): Promise<{
	response: Response | null
	hasAuth: boolean
	refreshed: RefreshedSession
}> {
	const headers = await getRequestCookieAuthHeaders(request, init.headers)
	if (typeof FormData !== 'undefined' && init.body instanceof FormData) {
		delete headers['Content-Type']
		delete headers['content-type']
	}
	if (!headers.Authorization) {
		return { response: null, hasAuth: false, refreshed: null }
	}

	let response = await fetch(input, {
		...init,
		headers,
	})
	let refreshed: RefreshedSession = null

	if (response.status === 401) {
		refreshed = await refreshBackendSession(request)
		if (refreshed?.accessToken) {
			response = await fetch(input, {
				...init,
				headers: {
					...headers,
					Authorization: `Bearer ${refreshed.accessToken}`,
				},
			})
		}
	}

	return { response, hasAuth: true, refreshed }
}

export function jsonWithAuthCookies(
	data: unknown,
	status: number,
	refreshed: RefreshedSession,
) {
	const response = NextResponse.json(data, { status })
	if (refreshed?.accessToken || refreshed?.refreshToken) {
		setAuthCookies(response, {
			accessToken: refreshed.accessToken,
			refreshToken: refreshed.refreshToken,
			expiresIn: refreshed.expiresIn,
		})
	}
	return response
}
