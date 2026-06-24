import { NextRequest, NextResponse } from 'next/server'

import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { getCookieAuthHeaders } from '@/app/api/_lib/cookie-auth'

interface RouteParams {
	params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, { params }: RouteParams) {
	const { id } = await params
	const authHeaders = await getCookieAuthHeaders()

	if (!authHeaders.Authorization) {
		return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
	}

	const formData = await request.formData()
	const response = await fetch(`${BACKEND_URL}/api/support/client/requests/${id}/payment-proof`, {
		method: 'POST',
		headers: { Authorization: authHeaders.Authorization },
		body: formData,
		cache: 'no-store',
	})

	const data = await response.json().catch(() => ({ success: response.ok }))
	return NextResponse.json(data, { status: response.status })
}
