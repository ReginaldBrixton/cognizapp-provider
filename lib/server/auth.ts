import { cookies } from 'next/headers'
import { ACCESS_TOKEN_COOKIE } from '@/lib/server/auth-session'

/**
 * Get the CognizApp access token from cookies
 * This is used by API routes to authenticate with the backend
 */
export async function getAccessToken(): Promise<string | null> {
	const cookieStore = await cookies()
	return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value || null
}

/**
 * Create authentication headers for backend API calls
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
	const token = await getAccessToken()
	return token
		? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
		: { 'Content-Type': 'application/json' }
}
