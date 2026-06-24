import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { requireCookieAuth } from '@/app/api/_lib/cookie-auth'

function toWebSocketBaseUrl() {
	const configured = process.env.NEXT_PUBLIC_SUPPORT_WS_URL?.trim()
	if (configured) return configured.replace(/\/$/, '')
	return BACKEND_URL.replace(/^https:/, 'wss:').replace(/^http:/, 'ws:').replace(/\/$/, '')
}

function toHttpBaseUrl() {
	return BACKEND_URL.replace(/\/$/, '')
}

function shouldUseWebSocketUrl() {
	if (process.env.NEXT_PUBLIC_SUPPORT_WS_URL?.trim()) return true
	try {
		return !new URL(BACKEND_URL).hostname.endsWith('.vercel.app')
	} catch {
		return true
	}
}

function getBearerToken(authorization?: string) {
	const match = authorization?.match(/^Bearer\s+(.+)$/i)
	return match?.[1]?.trim() || ''
}

export async function GET(request: NextRequest) {
	const threadId = request.nextUrl.searchParams.get('threadId')?.trim()
	const after = request.nextUrl.searchParams.get('after')?.trim()
	if (!threadId) {
		return NextResponse.json(
			{ error: 'threadId is required' },
			{ status: 400 },
		)
	}

	const { headers, hasAuth } = await requireCookieAuth()
	const token = getBearerToken(headers.Authorization)
	if (!hasAuth || !token) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const wsUrl = shouldUseWebSocketUrl()
		? new URL('/api/support/messages/ws', toWebSocketBaseUrl())
		: null
	if (wsUrl) {
		wsUrl.searchParams.set('threadId', threadId)
		wsUrl.searchParams.set('token', token)
	}
	const streamUrl = new URL('/api/support/messages/stream', toHttpBaseUrl())
	streamUrl.searchParams.set('threadId', threadId)
	streamUrl.searchParams.set('token', token)
	if (after) streamUrl.searchParams.set('after', after)
	return NextResponse.json({
		data: {
			url: wsUrl?.toString() ?? null,
			streamUrl: streamUrl.toString(),
		},
	})
}
