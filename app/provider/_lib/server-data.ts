import { cookies } from 'next/headers'
import { ACCESS_TOKEN_COOKIE } from '@/app/api/_lib/auth-session'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

export type ProviderDashboardStats = {
	totalRequests?: number
	openRequests?: number
	convertedRequests?: number
	messageThreads?: number
	referrals?: number
}

export type ProviderDeadline = {
	id: string
	title: string
	type: string
	deadline: string
	status: string
}

export type ProviderRequest = {
	id: string
	title: string
	status: string
	serviceTags: string[]
	academicLevel: string
	deadline?: string
	deadlineAt?: string
	createdAt: string
	clientUid: string
	email?: string
	fullName?: string
	paymentStatus?: string
	subscriptionPlanId?: string
	subscriptionPlanName?: string
	subscriptionPriorityLevel?: number
}

export type ProviderActivity = {
	id: string
	type: string
	message: string
	time: string
	title?: string
	requestId?: string
}

async function getAccessToken() {
	const cookieStore = await cookies()
	return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || null
}

export async function fetchProviderData<T>(
	path: string,
	options: { revalidate?: number } = {},
): Promise<T | null> {
	const accessToken = await getAccessToken()
	if (!accessToken) {
		console.warn('[fetchProviderData] No access token available')
		return null
	}

	try {
		const url = `${BACKEND_URL}${path}`
		console.log('[fetchProviderData] Fetching:', url)

		const response = await fetch(url, {
			headers: {
				Authorization: `Bearer ${accessToken}`,
				'Content-Type': 'application/json',
			},
			next: { revalidate: options.revalidate ?? 30 },
		})

		if (!response.ok) {
			console.error(
				`[fetchProviderData] HTTP ${response.status} ${response.statusText} for ${path}`,
			)
			return null
		}

		const payload = await response.json().catch(() => null)
		return (payload?.data ?? null) as T | null
	} catch (error) {
		// Enhanced error logging to capture fetch failures
		const errorDetails = {
			path,
			backendUrl: BACKEND_URL,
			errorType: error?.constructor?.name || typeof error,
			errorMessage: error instanceof Error ? error.message : String(error),
			errorCause: error instanceof Error ? error.cause : undefined,
			errorStack: error instanceof Error ? error.stack?.split('\n').slice(0, 3).join('\n') : undefined,
		}
		
		console.error('[fetchProviderData] Fetch failed:', errorDetails)
		console.error('[fetchProviderData] Is the backend server running at', BACKEND_URL, '?')
		
		return null
	}
}
