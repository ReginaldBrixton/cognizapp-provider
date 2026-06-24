import { NextResponse } from 'next/server'

import { BACKEND_URL } from '@/app/api/_lib/backend-url'

export async function GET() {
	const startedAt = Date.now()
	try {
		const response = await fetch(`${BACKEND_URL}/api/auth/health`, {
			method: 'GET',
			cache: 'no-store',
		})
		const durationMs = Date.now() - startedAt

		const contentType = response.headers.get('content-type') || ''
		const body = contentType.includes('application/json')
			? await response.json()
			: await response.text()

		if (!response.ok) {
			console.warn('[Health Check] Users backend answered but is not healthy', {
				whatHappened: 'The frontend proxy reached the users backend, but the backend returned an unhealthy status.',
				plainEnglishMeaning: 'The backend process is reachable, but one of its startup checks or dependencies may not be ready.',
				whatToTry: 'Wait for migrations/startup to finish, then refresh. If it repeats, check the users terminal logs above this request.',
				backendUrl: BACKEND_URL,
				httpStatus: response.status,
				timeSpentMs: durationMs,
			})
		}

		return typeof body === 'string'
			? new NextResponse(body, {
					status: response.status,
					headers: { 'Content-Type': contentType || 'text/plain' },
					})
			: NextResponse.json(body, { status: response.status })
	} catch (error) {
		const durationMs = Date.now() - startedAt
		const message = error instanceof Error ? error.message : String(error)
		console.warn('[Health Check] Frontend could not reach users backend', {
			whatHappened: 'The frontend tried to call the users backend health endpoint, but the request failed.',
			plainEnglishMeaning: 'The browser can reach Next.js, but Next.js could not reach the users API service.',
			whatToTry: 'Confirm the users backend is still running on the configured backend URL, then refresh the page.',
			backendUrl: BACKEND_URL,
			httpStatus: 503,
			timeSpentMs: durationMs,
			technicalMessage: message,
		})
		return NextResponse.json(
			{
				success: false,
				error: 'Users backend is not reachable right now.',
				details: {
					whatHappened: 'Next.js could not reach the users backend health endpoint.',
					plainEnglishMeaning: 'The app shell is running, but the API service that loads account and workspace data is not responding.',
					whatToTry: 'Wait for the backend to finish starting, confirm it is running, then refresh.',
					backendUrl: BACKEND_URL,
					timeSpentMs: durationMs,
				},
			},
			{ status: 503 },
		)
	}
}
