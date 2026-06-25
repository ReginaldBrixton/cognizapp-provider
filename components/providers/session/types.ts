// Session types and interfaces

export interface SessionUser {
	id: string
	email?: string | null
	name?: string | null
	full_name?: string | null
	image?: string | null
	avatar_url?: string | null
	created_at?: string | null
}

export interface Session {
	user: SessionUser
}

export type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export interface SessionContextValue {
	data: Session | null
	status: SessionStatus
	signOut: () => Promise<void>
	/** True when the user just completed a login/register action (not page refresh) */
	justLoggedIn: boolean
	/** Call this after showing welcome notification to reset the flag */
	clearJustLoggedIn: () => void
	/** True when session timeout warning should be shown */
	showTimeoutWarning: boolean
	/** Extend the session (reset timeout timer) */
	extendSession: () => void
	/** Get the session manager instance */
	sessionManager:
		| import('@/lib/auth/session-manager').SessionManager
		| null
}
