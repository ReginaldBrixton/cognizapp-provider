import { NextRequest, NextResponse } from 'next/server'

import { setAuthCookies } from '@/app/api/_lib/auth-session'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { normalizeExchangeResponse } from '@/lib/auth-contract'

export async function POST(request: NextRequest) {
	const body = await request.json().catch(() => ({}))

	let backendResponse: Response
	try {
		backendResponse = await fetch(`${BACKEND_URL}/api/auth/otp/verify`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': request.headers.get('user-agent') || '',
				'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
				'Accept-Language': request.headers.get('accept-language') || '',
			},
			body: JSON.stringify({
				email: body?.email,
				code: body?.code,
				selectedRole: body?.selectedRole,
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
		return NextResponse.json(
			{
				...normalized,
				success: false,
				error:
					normalized.error ||
					`Request failed: ${backendResponse.status} ${backendResponse.statusText}`,
			},
			{ status: backendResponse.status },
		)
	}

	return setAuthCookies(NextResponse.json(normalized), {
		accessToken: normalized.accessToken,
		refreshToken: normalized.refreshToken,
		expiresIn: normalized.expiresIn,
	})
}
