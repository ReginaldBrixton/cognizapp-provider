import { NextRequest, NextResponse } from 'next/server'

import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import {
	fetchWithCookieAuthRetry,
	jsonWithAuthCookies,
} from '@/app/api/_lib/cookie-auth'

interface RouteParams {
	params: Promise<{ id: string }>
}

async function readJson(response: Response) {
	return response.json().catch(() => ({ success: response.ok }))
}

export async function GET(request: NextRequest, { params }: RouteParams) {
	const { id } = await params
	const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
		request,
		`${BACKEND_URL}/api/support/client/requests/${id}/draft`,
		{
			method: 'GET',
			cache: 'no-store',
		},
	)

	if (!hasAuth) {
		return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
	}

	return jsonWithAuthCookies(await readJson(response!), response!.status, refreshed)
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	const { id } = await params
	const body = await request.text()
	const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
		request,
		`${BACKEND_URL}/api/support/client/requests/${id}/draft`,
		{
			method: 'POST',
			body,
			cache: 'no-store',
		},
	)

	if (!hasAuth) {
		return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
	}

	return jsonWithAuthCookies(await readJson(response!), response!.status, refreshed)
}
