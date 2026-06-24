import { NextRequest } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import { proxyBackendWithCookieAuth } from '@/lib/api/support-helpers'

type RouteParams = {
	params: Promise<{ id: string }>
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
	const { id } = await params
	const body = await request.text()
	return proxyBackendWithCookieAuth(request, `${BACKEND_URL}/api/support/provider/discount-codes/${id}`, {
		method: 'PUT',
		body,
	})
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	const { id } = await params
	return proxyBackendWithCookieAuth(request, `${BACKEND_URL}/api/support/provider/discount-codes/${id}`, {
		method: 'DELETE',
	})
}
