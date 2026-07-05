import { NextRequest, NextResponse } from 'next/server'

import { setAuthCookies } from '@/lib/server/auth-session'
import { BACKEND_URL } from '@/lib/server/backend-url'
import { normalizeExchangeResponse } from '@/lib/auth/contract'

export const DEVICE_ID_COOKIE = 'cognizap_provider_device_id'

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
	if (typeof options.maxAge === 'number') parts.push(`Max-Age=${Math.floor(options.maxAge)}`)
	if (options.path) parts.push(`Path=${options.path}`)
	if (options.httpOnly) parts.push('HttpOnly')
	if (options.secure) parts.push('Secure')
	if (options.sameSite) parts.push(`SameSite=${options.sameSite}`)
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

function isValidDeviceId(value: unknown): value is string {
	return typeof value === 'string' && /^[0-9a-f-]{16,128}$/i.test(value)
}

export async function POST(request: NextRequest) {
	const body = await request.json().catch(() => ({}))

	// Resolve a stable device id: prefer the body, then the existing httpOnly
	// cookie, then generate a fresh one. The resolved id is written back as an
	// httpOnly cookie so future requests (and other endpoints) carry it too.
	const existingDeviceId = request.cookies.get(DEVICE_ID_COOKIE)?.value
	const deviceId =
		(isValidDeviceId(body?.deviceId) ? body.deviceId : null) ||
		(isValidDeviceId(existingDeviceId) ? existingDeviceId : null) ||
		crypto.randomUUID()

	let backendResponse: Response
	try {
		backendResponse = await fetch(`${BACKEND_URL}/api/auth/pin/login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': request.headers.get('user-agent') || '',
				'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
				'Accept-Language': request.headers.get('accept-language') || '',
				'X-Device-Id': deviceId,
			},
			body: JSON.stringify({
				username: body?.username,
				pin: body?.pin,
				deviceId,
			}),
		})
	} catch {
		return NextResponse.json(
			{ success: false, error: 'Auth backend unavailable' },
			{ status: 503 },
		)
	}

	const raw = await backendResponse.text()
	let payload: unknown = raw
	try {
		payload = raw ? JSON.parse(raw) : {}
	} catch {
		payload = { success: false, error: raw }
	}

	const normalized = normalizeExchangeResponse(payload)
	if (!backendResponse.ok) {
		// Still set the device-id cookie on failure so failed attempts from this
		// device are correlated in the activity log.
		const response = NextResponse.json(
			{
				...normalized,
				success: false,
				error:
					normalized.error ||
					`Request failed: ${backendResponse.status} ${backendResponse.statusText}`,
			},
			{ status: backendResponse.status },
		)
		appendSetCookie(
			response,
			serializeCookie(DEVICE_ID_COOKIE, deviceId, {
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax',
				maxAge: 365 * 24 * 60 * 60,
				path: '/',
			}),
		)
		return response
	}

	const response = setAuthCookies(NextResponse.json(normalized), {
		accessToken: normalized.accessToken,
		refreshToken: normalized.refreshToken,
		expiresIn: normalized.expiresIn,
	})
	appendSetCookie(
		response,
		serializeCookie(DEVICE_ID_COOKIE, deviceId, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 365 * 24 * 60 * 60,
			path: '/',
		}),
	)
	return response
}
