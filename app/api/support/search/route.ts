import { NextRequest, NextResponse } from 'next/server'
import { getAuthHeaders } from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

export async function GET(request: NextRequest) {
	const headers = await getAuthHeaders()

	if (!headers['Authorization']) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const searchParams = request.nextUrl.searchParams
	const query = searchParams.get('q') || ''
	const limit = searchParams.get('limit') || '10'

	if (!query) {
		return NextResponse.json({ error: 'Query required' }, { status: 400 })
	}

	try {
		const response = await fetch(
			`${BACKEND_URL}/api/support/search?q=${encodeURIComponent(query)}&limit=${limit}`,
			{
				headers,
			},
		)

		const data = await response.json()
		return NextResponse.json(data)
	} catch (error) {
		console.error('Search failed:', error)
		return NextResponse.json({ error: 'Search failed' }, { status: 500 })
	}
}
