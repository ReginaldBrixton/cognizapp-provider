'use client'

import { useEffect, useRef } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
	getSessionManager,
	type SessionManager,
} from '@/lib/auth/session-manager'
import { clearLoginSessionData } from '../storage'
import type { SessionStatus } from '../types'

interface UseSessionManagerOptions {
	supabase: SupabaseClient
	status: SessionStatus
	debugAuth: boolean
	onTimeout: () => void
	onWarningChange: (show: boolean) => void
	router: { push: (url: string) => void }
}

/**
 * Hook to manage cross-tab session events.
 */
export function useSessionManager({
	supabase,
	status,
	debugAuth,
	onTimeout,
	onWarningChange,
	router,
}: UseSessionManagerOptions) {
	const sessionManagerRef = useRef<SessionManager | null>(null)

	// Initialize session manager
	useEffect(() => {
		if (typeof window === 'undefined') return

		const manager = getSessionManager()
		sessionManagerRef.current = manager

		// Set up warning handler
		manager.onWarning(() => {
			if (debugAuth) {
				console.log('[SessionProvider] ⚠️ Session timeout warning triggered')
			}
			onWarningChange(true)
		})

		// Set up timeout handler for auto-logout
		manager.onTimeout(() => {
			if (debugAuth) {
				console.log('[SessionProvider] ⏰ Session timed out, logging out')
			}
			onWarningChange(false)
			supabase.auth.signOut().then(() => {
				onTimeout()
				clearLoginSessionData()
				router.push('/login')
			})
		})

		return () => {
			manager.stop()
		}
	}, [debugAuth, router, supabase, onTimeout, onWarningChange])

	// Start/stop session manager based on authentication status
	useEffect(() => {
		if (status === 'authenticated' && sessionManagerRef.current) {
			sessionManagerRef.current.resetTimer()
			sessionManagerRef.current.start()
			if (debugAuth) {
				console.log('[SessionProvider] ▶️ Session timeout tracking started')
			}
		} else if (status === 'unauthenticated' && sessionManagerRef.current) {
			sessionManagerRef.current.stop()
			if (debugAuth) {
				console.log('[SessionProvider] ⏹️ Session timeout tracking stopped')
			}
		}
	}, [status, debugAuth])

	return sessionManagerRef
}
