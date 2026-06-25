import { cookies } from 'next/headers'
import { ACCESS_TOKEN_COOKIE } from '@/app/api/_lib/auth-session'
import { BACKEND_URL } from '@/app/api/_lib/backend-url'

// ── Provider dashboard types ────────────────────────────────────────────────

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

export type ProviderActivity = {
	id: string
	type: string
	message: string
	time: string
	title?: string
	requestId?: string
}

// ── Shared request type (used by inbox, dashboard, diagnostics) ─────────────

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
	fileCount?: number
	messageCount?: number
	messageThreadId?: string
	taskId?: string
	currency?: string
	paymentAmount?: number
	quotedAmount?: number
	originalAmount?: number
}

// ── Server-side data fetching ───────────────────────────────────────────────

async function getAccessToken(): Promise<string | null> {
	const cookieStore = await cookies()
	return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null
}

/**
 * Fetch data from the backend API on the server side.
 *
 * Uses the provider's access token from cookies and caches the result
 * for `revalidate` seconds (default 30).
 *
 * Returns `null` on any error — callers should handle gracefully.
 */
export async function fetchProviderData<T>(
	path: string,
	options: { revalidate?: number } = {},
): Promise<T | null> {
	const accessToken = await getAccessToken()
	if (!accessToken) {
		console.warn('[fetchProviderData] No access token available')
		return null
	}

	const url = `${BACKEND_URL}${path}`

	try {
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
		console.error('[fetchProviderData] Fetch failed for', path, {
			backendUrl: BACKEND_URL,
			error: error instanceof Error ? error.message : String(error),
		})
		return null
	}
}
