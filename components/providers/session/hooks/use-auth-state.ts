'use client'

import { useEffect, useRef } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Session, SessionStatus } from '../types'
import {
	getStoredLoginSessionId,
	setStoredLoginSessionId,
	generateLoginSessionId,
	clearLoginSessionData,
} from '../storage'

interface UseAuthStateOptions {
	supabase: SupabaseClient
	debugAuth: boolean
	onSessionChange: (session: Session | null) => void
	onStatusChange: (status: SessionStatus) => void
	onJustLoggedIn: (sessionId: string) => void
	onSignedOut: () => void
	router: { refresh: () => void }
}

/**
 * Hook to handle Supabase auth state changes
 */
export function useAuthState({
	supabase,
	debugAuth,
	onSessionChange,
	onStatusChange,
	onJustLoggedIn,
	onSignedOut,
	router,
}: UseAuthStateOptions) {
	const initialLoadComplete = useRef(false)
	const loginSuccessProcessed = useRef(false)
	const hadSessionOnLoad = useRef(false)

	// Check URL for OAuth login_success param
	useEffect(() => {
		if (loginSuccessProcessed.current) return

		const urlParams = new URLSearchParams(window.location.search)
		const loginSuccess = urlParams.get('login_success')
		if (loginSuccess === 'true') {
			loginSuccessProcessed.current = true
			const newSessionId = generateLoginSessionId()
			setStoredLoginSessionId(newSessionId)
			onJustLoggedIn(newSessionId)
			// Clean up the URL param
			urlParams.delete('login_success')
			const newUrl = urlParams.toString()
				? `${window.location.pathname}?${urlParams.toString()}`
				: window.location.pathname
			window.history.replaceState({}, '', newUrl)
		}
	}, [onJustLoggedIn])

	// Initialize session and subscribe to auth changes
	useEffect(() => {
		const initializeSession = async () => {
			const startTime = Date.now()
			if (debugAuth) {
				console.log('[SessionProvider] 🔍 Initializing session...')
			}

			const {
				data: { session: supabaseSession },
				error,
			} = await supabase.auth.getSession()

			const duration = Date.now() - startTime
			const errorMessage = (error?.message ?? '').toLowerCase()
			const isMissingSession =
				errorMessage.includes('auth session missing') ||
				errorMessage.includes('session missing')

			if (error) {
				if (debugAuth && !isMissingSession) {
					console.warn(
						`[SessionProvider] ⚠️ Error getting session: ${error.message} | Duration: ${duration}ms`,
					)
				}
				onSessionChange(null)
				onStatusChange('unauthenticated')
				hadSessionOnLoad.current = false
				initialLoadComplete.current = true
				return
			}

			if (supabaseSession?.user) {
				const user = supabaseSession.user
				hadSessionOnLoad.current = true
				if (debugAuth) {
					console.log(
						`[SessionProvider] ✅ Session found on load: ${user.email} | Duration: ${duration}ms`,
					)
				}
				onSessionChange({
					user: {
						id: user.id,
						email: user.email,
						name: user.user_metadata?.full_name || user.email,
						full_name: user.user_metadata?.full_name,
						image: user.user_metadata?.avatar_url,
						created_at: user.created_at,
					},
				})
				onStatusChange('authenticated')
			} else {
				if (debugAuth) {
					console.log(
						`[SessionProvider] ⚠️ No session found | Duration: ${duration}ms`,
					)
				}
				hadSessionOnLoad.current = false
				onSessionChange(null)
				onStatusChange('unauthenticated')
			}

			initialLoadComplete.current = true
		}

		initializeSession()

		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((event, supabaseSession) => {
			if (debugAuth) {
				const timestamp = new Date().toLocaleTimeString()
				console.log(
					`[SessionProvider] [${timestamp}] 🔄 Auth state: ${event} | User: ${supabaseSession?.user?.email || 'none'}`,
				)
			}

			if (event === 'SIGNED_IN' && supabaseSession?.user) {
				const user = supabaseSession.user
				onSessionChange({
					user: {
						id: user.id,
						email: user.email,
						name: user.user_metadata?.full_name || user.email,
						full_name: user.user_metadata?.full_name,
						image: user.user_metadata?.avatar_url,
						created_at: user.created_at,
					},
				})
				onStatusChange('authenticated')

				// Fresh login detection
				if (initialLoadComplete.current && !hadSessionOnLoad.current) {
					const storedId = getStoredLoginSessionId()
					if (!storedId) {
						const newSessionId = generateLoginSessionId()
						setStoredLoginSessionId(newSessionId)
						onJustLoggedIn(newSessionId)
						if (debugAuth) {
							console.log(`[SessionProvider] 🎉 Fresh login: ${newSessionId}`)
						}
					}
				}
			} else if (event === 'TOKEN_REFRESHED' && supabaseSession?.user) {
				const user = supabaseSession.user
				onSessionChange({
					user: {
						id: user.id,
						email: user.email,
						name: user.user_metadata?.full_name || user.email,
						full_name: user.user_metadata?.full_name,
						image: user.user_metadata?.avatar_url,
						created_at: user.created_at,
					},
				})
				onStatusChange('authenticated')
			} else if (event === 'SIGNED_OUT') {
				if (debugAuth) {
					console.log('[SessionProvider] 👋 User signed out')
				}
				onSessionChange(null)
				onStatusChange('unauthenticated')
				onSignedOut()
				clearLoginSessionData()
				router.refresh()
			} else if (event === 'USER_UPDATED' && supabaseSession?.user) {
				const user = supabaseSession.user
				onSessionChange({
					user: {
						id: user.id,
						email: user.email,
						name: user.user_metadata?.full_name || user.email,
						full_name: user.user_metadata?.full_name,
						image: user.user_metadata?.avatar_url,
						created_at: user.created_at,
					},
				})
			}
		})

		return () => {
			subscription.unsubscribe()
		}
	}, [
		debugAuth,
		supabase,
		onSessionChange,
		onStatusChange,
		onJustLoggedIn,
		onSignedOut,
		router,
	])
}
