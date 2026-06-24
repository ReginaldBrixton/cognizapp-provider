import { NextRequest, NextResponse } from 'next/server'
import { fetchBackend, getAuthHeaders, handleBackendResponse, handleApiError } from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

export async function GET(request: NextRequest) {
	try {
		const headers = await getAuthHeaders()
		if (!headers.Authorization) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const queryString = request.nextUrl.searchParams.toString()
		const response = await fetchBackend(
			`${BACKEND_URL}/api/support/provider/referrals${queryString ? `?${queryString}` : ''}`,
			{ headers },
		)
		return handleBackendResponse(response)
	} catch (error) {
		return handleApiError(error, 'support:provider:referrals:GET')
	}
}
