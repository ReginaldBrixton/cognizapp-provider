/**
 * Session Provider - Re-export from real implementation
 */
export { SessionProvider, useSession } from '@/components/providers/session'
export type { Session, SessionUser, SessionStatus, SessionContextValue } from '@/components/providers/session/types'
export { LOGIN_SESSION_KEY, WELCOME_SHOWN_KEY, clearLoginSessionData } from '@/components/providers/session/storage'
