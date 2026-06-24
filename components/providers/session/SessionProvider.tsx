'use client'

import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react'
import type { ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'

import {
	getSessionManager,
	type SessionManager,
} from '@/app/(auth)/_lib/security/session-manager'
import { useAuthStore } from '@/lib/store/auth'
import type { Session, SessionContextValue } from './types'
import { clearLoginSessionData, getStoredLoginSessionId } from './storage'

const SessionContext = createContext<SessionContextValue | undefined>(undefined)

/**
 * CognizApp email OTP session provider backed by users-service JWT cookies.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
	const router = useRouter()
	const pathname = usePathname()
	const sessionManagerRef = useRef<SessionManager | null>(null)
	const [showTimeoutWarning, setShowTimeoutWarning] = useState(false)
	const [loginSessionId, setLoginSessionId] = useState<string | null>(null)

	const authUser = useAuthStore((state) => state.user)
	const status = useAuthStore((state) => state.status)
	const justLoggedIn = useAuthStore((state) => state.justLoggedIn)
	const initialize = useAuthStore((state) => state.initialize)
	const signOutFromStore = useAuthStore((state) => state.signOut)
	const clearJustLoggedInFromStore = useAuthStore(
		(state) => state.clearJustLoggedIn,
	)
	const setStatus = useAuthStore((state) => state.setStatus)

	const debugAuth =
		process.env.NEXT_PUBLIC_DEBUG_AUTH === 'true' ||
		process.env.DEBUG_AUTH === 'true'

	// Initialize auth ONCE on mount — never on pathname changes.
	// Re-running initialize() on every navigation sets status→'loading'
	// which unmounts the entire AppShell and causes full-page reloads.
	useEffect(() => {
		const storedId = getStoredLoginSessionId()
		if (storedId) {
			setLoginSessionId(storedId)
		}
		void initialize()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []) // intentionally empty — run once only

	// Separately: mark auth pages as unauthenticated so redirects work correctly
	useEffect(() => {
		const isAuthPage =
			pathname === '/' ||
			pathname === '/login' ||
			pathname === '/register'
		if (isAuthPage) {
			setStatus('unauthenticated')
		}
	}, [pathname, setStatus])

	useEffect(() => {
		if (typeof window === 'undefined') return

		const manager = getSessionManager()
		sessionManagerRef.current = manager

		manager.onWarning(() => setShowTimeoutWarning(true))
		manager.onTimeout(() => {
			setShowTimeoutWarning(false)
			void signOutFromStore().finally(() => {
				clearLoginSessionData()
				router.push('/login')
			})
		})

		return () => manager.stop()
	}, [router, signOutFromStore])

	useEffect(() => {
		const manager = sessionManagerRef.current
		if (!manager) return

		if (status === 'authenticated') {
			manager.resetTimer()
			manager.start()
			if (debugAuth) {
				console.log('[SessionProvider] Session timeout tracking started')
			}
		} else if (status === 'unauthenticated') {
			manager.stop()
			if (debugAuth) {
				console.log('[SessionProvider] Session timeout tracking stopped')
			}
		}
	}, [status, debugAuth])

	const session = useMemo<Session | null>(() => {
		if (!authUser) return null

		return {
			user: {
				id: authUser.id,
				email: authUser.email,
				name: authUser.displayName || authUser.fullName || authUser.email,
				full_name: authUser.fullName || authUser.displayName,
				image: authUser.avatarUrl,
				created_at: null,
			},
		}
	}, [authUser])

	const signOut = useCallback(async () => {
		try {
			sessionManagerRef.current?.broadcastLogout()
			sessionManagerRef.current?.stop()
			await signOutFromStore()
		} finally {
			setShowTimeoutWarning(false)
			setLoginSessionId(null)
			clearLoginSessionData()
			router.push('/login')
		}
	}, [router, signOutFromStore])

	const clearJustLoggedIn = useCallback(() => {
		clearJustLoggedInFromStore()
	}, [clearJustLoggedInFromStore])

	const extendSession = useCallback(() => {
		sessionManagerRef.current?.resetTimer()
		setShowTimeoutWarning(false)
	}, [])

	const value = useMemo<SessionContextValue>(
		() => ({
			data: session,
			status,
			signOut,
			justLoggedIn: justLoggedIn || Boolean(loginSessionId),
			clearJustLoggedIn,
			showTimeoutWarning,
			extendSession,
			sessionManager: sessionManagerRef.current,
		}),
		[
			session,
			status,
			signOut,
			justLoggedIn,
			loginSessionId,
			clearJustLoggedIn,
			showTimeoutWarning,
			extendSession,
		],
	)

	return (
		<SessionContext.Provider value={value}>{children}</SessionContext.Provider>
	)
}

export function useSession(): SessionContextValue {
	const ctx = useContext(SessionContext)
	if (!ctx) {
		throw new Error('useSession must be used within a SessionProvider')
	}
	return ctx
}
