import { NextRequest, NextResponse } from 'next/server'

import { BACKEND_URL } from '@/lib/server/backend-url'

export async function POST(request: NextRequest) {
	const body = await request.json().catch(() => ({}))

	try {
		const backendResponse = await fetch(`${BACKEND_URL}/api/auth/otp/request`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'User-Agent': request.headers.get('user-agent') || '',
				'X-Forwarded-For': request.headers.get('x-forwarded-for') || '',
				'Accept-Language': request.headers.get('accept-language') || '',
			},
			body: JSON.stringify({
				email: body?.email,
				requirePrivilegedAccess: body?.requirePrivilegedAccess ?? true,
				selectedRole: body?.selectedRole,
			}),
		})

		const payload = await backendResponse.json().catch(() => ({
			success: false,
			error: 'Invalid backend response',
		}))

		return NextResponse.json(payload, { status: backendResponse.status })
	} catch {
		return NextResponse.json(
			{ success: false, error: 'Auth backend unavailable' },
			{ status: 503 },
		)
	}
}
