import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { proxyBackendWithCookieAuth } from '@/lib/api/support-helpers'

interface RouteParams {
	params: Promise<{ id: string }>
}

// GET /api/support/messages/threads/[id]/messages - Get messages in thread
export async function GET(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/messages/threads/${id}/messages`,
			{
				method: 'GET',
			},
		)
	} catch (error) {
		console.error('[Messages Thread API] GET messages error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to fetch messages' },
			{ status: 500 },
		)
	}
}

// POST /api/support/messages/threads/[id]/messages - Send message to thread
export async function POST(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const body = await request.json()
		return proxyBackendWithCookieAuth(
			request,
			`${BACKEND_URL}/api/support/messages/threads/${id}/messages`,
			{
				method: 'POST',
				body: JSON.stringify(body),
			},
		)
	} catch (error) {
		console.error('[Messages Thread API] POST messages error:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to send message' },
			{ status: 500 },
		)
	}
}
