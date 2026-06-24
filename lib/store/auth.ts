/**
 * Auth Store
 *
 * Zustand store for authentication state management.
 */

import { create } from 'zustand'
import type { UserResponse } from '@/lib/auth-contract'

export interface AuthUser {
	id: string
	email: string
	displayName?: string
	fullName?: string
	avatarUrl?: string
	role?: string
}

export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthState {
	user: AuthUser | null
	status: AuthStatus
	justLoggedIn: boolean
	initialize: () => Promise<void>
	setAuth: (auth: {
		user: AuthUser | null
		accessToken: string | null
		refreshToken: string | null
		expiresAt: number | null
		status: AuthStatus
		authAction: 'login' | 'register' | null
	}) => void
	signOut: () => Promise<void>
	setStatus: (status: AuthStatus) => void
	clearJustLoggedIn: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
	user: null,
	status: 'loading',
	justLoggedIn: false,

	initialize: async () => {
		try {
			const response = await fetch('/api/auth/me', {
				credentials: 'include',
			})
			if (response.ok) {
				const data = await response.json()
				const user = data?.user ?? data
				set({
					user: user as AuthUser | null,
					status: user ? 'authenticated' : 'unauthenticated',
				})
			} else {
				set({ user: null, status: 'unauthenticated' })
			}
		} catch {
			set({ user: null, status: 'unauthenticated' })
		}
	},

	setAuth: (auth) => {
		set({
			user: auth.user,
			status: auth.status,
		})
	},

	signOut: async () => {
		try {
			await fetch('/api/auth/logout', {
				method: 'POST',
				credentials: 'include',
			})
		} catch {
			// Ignore logout errors
		} finally {
			set({ user: null, status: 'unauthenticated', justLoggedIn: false })
		}
	},

	setStatus: (status) => {
		set({ status })
	},

	clearJustLoggedIn: () => {
		set({ justLoggedIn: false })
	},
}))
