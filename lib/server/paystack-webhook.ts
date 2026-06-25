import { NextRequest, NextResponse } from 'next/server'

import { BACKEND_URL } from './backend-url'

export async function forwardPaystackWebhook(
	request: NextRequest,
	backendPath: string,
) {
	const rawBody = await request.text()
	const response = await fetch(`${BACKEND_URL}${backendPath}`, {
		method: 'POST',
		headers: {
			'Content-Type': request.headers.get('content-type') || 'application/json',
			'x-paystack-signature': request.headers.get('x-paystack-signature') || '',
		},
		body: rawBody,
		cache: 'no-store',
	})

	const contentType = response.headers.get('content-type') || ''
	if (contentType.includes('application/json')) {
		const data = await response.json().catch(() => ({ success: response.ok }))
		return NextResponse.json(data, { status: response.status })
	}

	const text = await response.text().catch(() => '')
	return new NextResponse(text, {
		status: response.status,
		headers: contentType ? { 'content-type': contentType } : undefined,
	})
}
