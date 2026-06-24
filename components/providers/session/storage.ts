// Session storage utilities for tracking login sessions

export const LOGIN_SESSION_KEY = 'cognizap_login_session_id'
export const WELCOME_SHOWN_KEY = 'cognizap_welcome_shown'

/**
 * Generate a unique login session ID
 */
export function generateLoginSessionId(): string {
	return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
}

/**
 * Check if sessionStorage is available (handles SSR and private browsing)
 */
export function isSessionStorageAvailable(): boolean {
	try {
		const testKey = '__test__'
		sessionStorage.setItem(testKey, testKey)
		sessionStorage.removeItem(testKey)
		return true
	} catch {
		return false
	}
}

/**
 * Get the stored login session ID from sessionStorage
 */
export function getStoredLoginSessionId(): string | null {
	if (!isSessionStorageAvailable()) return null
	return sessionStorage.getItem(LOGIN_SESSION_KEY)
}

/**
 * Store a new login session ID in sessionStorage
 */
export function setStoredLoginSessionId(id: string): void {
	if (!isSessionStorageAvailable()) return
	sessionStorage.setItem(LOGIN_SESSION_KEY, id)
}

/**
 * Clear login session data from sessionStorage (on logout)
 */
export function clearLoginSessionData(): void {
	if (!isSessionStorageAvailable()) return
	sessionStorage.removeItem(LOGIN_SESSION_KEY)
	sessionStorage.removeItem(WELCOME_SHOWN_KEY)
}
