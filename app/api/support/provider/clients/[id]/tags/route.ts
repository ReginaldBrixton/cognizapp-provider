import { NextRequest, NextResponse } from 'next/server'
import { getAuthHeaders } from '@/lib/api/support-helpers'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const headers = await getAuthHeaders()

	if (!headers['Authorization']) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { id } = await params

	try {
		const response = await fetch(
			`${BACKEND_URL}/api/support/provider/clients/${id}/tags`,
			{
				headers,
			},
		)

		const data = await response.json()
		return NextResponse.json({ success: true, data })
	} catch (error) {
		console.error('Failed to fetch tags:', error)
		return NextResponse.json(
			{ error: 'Failed to fetch tags' },
			{ status: 500 },
		)
	}
}

export async function POST(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const headers = await getAuthHeaders()

	if (!headers['Authorization']) {
		return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
	}

	const { id } = await params
	const body = await request.json()

	try {
		const response = await fetch(
			`${BACKEND_URL}/api/support/provider/clients/${id}/tags`,
			{
				method: 'POST',
				headers,
				body: JSON.stringify(body),
			},
		)

		const data = await response.json()
		return NextResponse.json(
			{ success: true, data },
			{ status: response.status },
		)
	} catch (error) {
		console.error('Failed to add tag:', error)
		return NextResponse.json(
			{ error: 'Failed to add tag' },
			{ status: 500 },
		)
	}
}

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	const headers = await getAuthHeaders()

	if (!headers['Authorization']) {
		return NextResponse.json(
			{ success: false, error: 'Unauthorized' },
			{ status: 401 },
		)
	}

	const { id } = await params
	const { searchParams } = new URL(request.url)
	const tag = searchParams.get('tag')

	try {
		const response = await fetch(
			`${BACKEND_URL}/api/support/provider/clients/${id}/tags?tag=${tag}`,
			{
				method: 'DELETE',
				headers,
			},
		)

		return NextResponse.json({ success: true, message: 'Tag removed' })
	} catch (error) {
		console.error('Failed to remove tag:', error)
		return NextResponse.json(
			{ success: false, error: 'Failed to remove tag' },
			{ status: 500 },
		)
	}
}
