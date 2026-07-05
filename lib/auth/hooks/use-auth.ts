'use client'

import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { requestOtp, resendOtp, verifyOtp, loginWithPin } from '@/lib/auth/api'
import { getOrCreateDeviceId } from '@/lib/auth/device-id'
import { useAuthStore } from '@/lib/store/auth'
import { ROLE_DASHBOARDS, normalizeUserRole } from '@/types/roles'

export interface LoginPayload {
	email: string
}

export interface RegisterPayload {
	email: string
	name?: string
}

export interface UseAuthReturn {
	loading: boolean
	error: string | null
	success: string | null
	handleLogin: (payload: LoginPayload) => Promise<void>
	handleRegister: (payload: RegisterPayload) => Promise<void>
	handleRequestOtp: (email: string) => Promise<number | null>
	handleResendOtp: (email: string) => Promise<number | null>
	handleVerifyOtp: (email: string, code: string) => Promise<boolean>
	handlePinLogin: (username: string, pin: string) => Promise<boolean>
	handleLogout: () => Promise<void>
	clearError: () => void
	clearSuccess: () => void
}

function getRedirectTarget(role?: string | null) {
	const urlParams = new URLSearchParams(window.location.search)
	const explicitTarget = urlParams.get('redirectTo')
	if (explicitTarget) return explicitTarget
	const normalizedRole = normalizeUserRole(role)
	return ROLE_DASHBOARDS[normalizedRole] || '/login'
}

function responseMessage(error: string | undefined, fallback: string) {
	return error || fallback
}

export function useAuth(): UseAuthReturn {
	const [loading, setLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [success, setSuccess] = useState<string | null>(null)
	const router = useRouter()

	const handleRequestOtp = useCallback(async (email: string): Promise<number | null> => {
		setError(null)
		setSuccess(null)
		setLoading(true)

		try {
			const response = await requestOtp(email)
			if (!response.success) {
				throw new Error(responseMessage(response.error, 'Could not send login code'))
			}
			const message = response.message || 'Check your email for your login code.'
			setSuccess(message)
			toast.success(message)
			return response.resendCooldownSeconds || 60
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Could not send login code'
			setError(message)
			toast.error(message)
			return null
		} finally {
			setLoading(false)
		}
	}, [])

	const handleResendOtp = useCallback(async (email: string): Promise<number | null> => {
		setError(null)
		setSuccess(null)
		setLoading(true)

		try {
			const response = await resendOtp(email)
			if (!response.success) {
				throw new Error(responseMessage(response.error, 'Could not resend login code'))
			}
			const message = response.message || 'A new login code has been sent.'
			setSuccess(message)
			toast.success(message)
			return response.resendCooldownSeconds || 60
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Could not resend login code'
			setError(message)
			toast.error(message)
			return null
		} finally {
			setLoading(false)
		}
	}, [])

	const handleVerifyOtp = useCallback(async (email: string, code: string): Promise<boolean> => {
		setError(null)
		setSuccess(null)
		setLoading(true)

		try {
			const response = await verifyOtp(email, code)
			if (!response.success) {
				setError('That code didn\'t work. Please check and try again, or request a new one.')
				toast.error('That code didn\'t work. Please check and try again, or request a new one.')
				setLoading(false)
				return false
			}

			useAuthStore.getState().setAuth({
				user: response.user?.email
					? {
						id: response.user.id || '',
						email: response.user.email,
						displayName: response.user.displayName,
						avatarUrl: response.user.avatarUrl,
						role: response.user.role,
					}
					: null,
				accessToken: response.accessToken || null,
				refreshToken: response.refreshToken || null,
				expiresAt: response.expiresAt || null,
				status: 'authenticated',
				authAction: response.authAction || null,
			})

			toast.success(
				response.authAction === 'register'
					? 'Account created. Redirecting...'
					: 'Welcome back. Redirecting...',
			)
			window.location.href = getRedirectTarget(response.user?.role)
			return true
		} catch (err) {
			const message = err instanceof Error ? err.message : 'That code didn\'t work. Please check and try again, or request a new one.'
			setError(message)
			toast.error(message)
			setLoading(false)
			return false
		}
	}, [])

	const handleLogin = useCallback(
		async (payload: LoginPayload) => {
			await handleRequestOtp(payload.email)
		},
		[handleRequestOtp],
	)

	const handlePinLogin = useCallback(async (username: string, pin: string): Promise<boolean> => {
		setError(null)
		setSuccess(null)
		setLoading(true)

		try {
			const deviceId = getOrCreateDeviceId()
			const response = await loginWithPin(username, pin, deviceId)
			if (!response.success) {
				const message =
					response.errorCode === 'account_locked'
						? 'Too many failed attempts. Your account is temporarily locked. Try again later.'
						: response.errorCode === 'pin_rate_limited'
							? 'Too many failed attempts from this device or network. Please try again later.'
							: 'Invalid username or PIN.'
				setError(message)
				toast.error(message)
				setLoading(false)
				return false
			}

			useAuthStore.getState().setAuth({
				user: response.user?.email
					? {
						id: response.user.id || '',
						email: response.user.email,
						displayName: response.user.displayName,
						avatarUrl: response.user.avatarUrl,
						role: response.user.role,
					}
					: null,
				accessToken: response.accessToken || null,
				refreshToken: response.refreshToken || null,
				expiresAt: response.expiresAt || null,
				status: 'authenticated',
				authAction: response.authAction || 'login',
			})

			toast.success('Welcome back. Redirecting...')
			window.location.href = getRedirectTarget(response.user?.role)
			return true
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Sign in failed. Please try again.'
			setError(message)
			toast.error(message)
			setLoading(false)
			return false
		}
	}, [])

	const handleRegister = useCallback(
		async (payload: RegisterPayload) => {
			await handleRequestOtp(payload.email)
		},
		[handleRequestOtp],
	)

	const handleLogout = useCallback(async () => {
		setLoading(true)
		setError(null)

		try {
			await useAuthStore.getState().signOut()
			toast.success('Logged out successfully')
			router.refresh()
			router.push('/login')
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Logout failed'
			console.error('[Auth] Logout error:', message)
			router.push('/login')
		} finally {
			setLoading(false)
		}
	}, [router])

	const clearError = useCallback(() => setError(null), [])
	const clearSuccess = useCallback(() => setSuccess(null), [])

	return {
		loading,
		error,
		success,
		handleLogin,
		handleRegister,
		handleRequestOtp,
		handleResendOtp,
		handleVerifyOtp,
		handlePinLogin,
		handleLogout,
		clearError,
		clearSuccess,
	}
}
