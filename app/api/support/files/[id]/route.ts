import { NextRequest, NextResponse } from 'next/server'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'
import {
	fetchWithCookieAuthRetry,
	jsonWithAuthCookies,
} from '@/app/api/_lib/cookie-auth'
import { handleApiError } from '@/lib/api/support-helpers'

interface RouteParams {
	params: Promise<{ id: string }>
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const formData = await request.formData()
		const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
			request,
			`${BACKEND_URL}/api/support/files/${id}`,
			{
				method: 'PATCH',
				body: formData,
			},
		)

		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const data = await response!.json()
		return jsonWithAuthCookies(data, response!.status, refreshed)
	} catch (error) {
		return handleApiError(error, 'support:files:item:PATCH')
	}
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
	try {
		const { id } = await params
		const { response, hasAuth, refreshed } = await fetchWithCookieAuthRetry(
			request,
			`${BACKEND_URL}/api/support/files/${id}`,
			{ method: 'DELETE' },
		)

		if (!hasAuth) {
			return NextResponse.json(
				{ success: false, error: 'Authentication required' },
				{ status: 401 },
			)
		}

		const data = await response!.json()
		return jsonWithAuthCookies(data, response!.status, refreshed)
	} catch (error) {
		return handleApiError(error, 'support:files:item:DELETE')
	}
}
