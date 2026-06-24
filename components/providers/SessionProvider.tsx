// Re-export from modular session provider
// This file is kept for backwards compatibility
export {
	SessionProvider,
	useSession,
	LOGIN_SESSION_KEY,
	WELCOME_SHOWN_KEY,
	clearLoginSessionData,
} from './session'

export type {
	Session,
	SessionUser,
	SessionStatus,
	SessionContextValue,
} from './session'
