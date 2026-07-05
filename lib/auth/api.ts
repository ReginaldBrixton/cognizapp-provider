/**
 * Auth API Client
 *
 * Handles communication with the backend auth endpoints.
 * Based on backend auth system:
 * - POST /api/auth/otp/request - Request email OTP code
 * - POST /api/auth/otp/verify - Verify email OTP code for CognizApp tokens
 * - POST /api/auth/refresh - Refresh access token
 * - GET /api/auth/me - Get current user info
 * - POST /api/auth/logout - Logout
 */

import {
	normalizeExchangeResponse,
	normalizeRefreshResponse,
	normalizeUserResponse,
} from '@/lib/auth/contract'
import type {
	ExchangeResponse,
	OtpRequestResponse,
	RefreshResponse,
	UserResponse,
} from '@/lib/auth/contract'

export type { AuthAction, TokenPair } from '@/lib/auth/contract'

async function readJsonResponse(response: Response) {
	const rawBody = await response.text()
	if (!rawBody) {
		return {}
	}
	try {
		return JSON.parse(rawBody)
	} catch {
		return {
			success: false,
			error: rawBody,
		}
	}
}

export async function requestOtp(email: string): Promise<OtpRequestResponse> {
	// The provider portal only serves provider accounts. The backend
	// resolves the exact role from the privileged-access allow-list, so we just
	// require *some* privileged grant — no manual portal choice needed.
	const response = await fetch('/api/auth/otp/request', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
		body: JSON.stringify({ email, requirePrivilegedAccess: true }),
	})

	const payload = await readJsonResponse(response)
	return {
		success: Boolean(payload?.success),
		message: payload?.message,
		email: payload?.email,
		expiresInMinutes: payload?.expiresInMinutes,
		resendCooldownSeconds: payload?.resendCooldownSeconds,
		error: payload?.error,
		errorCode: payload?.errorCode ?? payload?.error_code,
		details: payload?.details,
	}
}

export async function resendOtp(email: string): Promise<OtpRequestResponse> {
	const response = await fetch('/api/auth/otp/resend', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
		body: JSON.stringify({ email, requirePrivilegedAccess: true }),
	})

	const payload = await readJsonResponse(response)
	return {
		success: Boolean(payload?.success),
		message: payload?.message,
		email: payload?.email,
		expiresInMinutes: payload?.expiresInMinutes,
		resendCooldownSeconds: payload?.resendCooldownSeconds,
		error: payload?.error,
		errorCode: payload?.errorCode ?? payload?.error_code,
		details: payload?.details,
	}
}

export async function verifyOtp(email: string, code: string): Promise<ExchangeResponse> {
	const response = await fetch('/api/auth/otp/verify', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
		body: JSON.stringify({ email, code }),
	})

	const payload = await readJsonResponse(response)
	const normalized = normalizeExchangeResponse(payload)

	if (!response.ok && !normalized.error) {
		return {
			...normalized,
			success: false,
			error: `Request failed: ${response.status} ${response.statusText}`,
		}
	}

	return normalized
}

/**
 * PIN login (provider portal). Sends the username + PIN plus a stable device id
 * so the backend can bind the session to this device and surface it in the
 * activity log.
 */
export async function loginWithPin(
	username: string,
	pin: string,
	deviceId: string,
): Promise<ExchangeResponse> {
	const response = await fetch('/api/auth/pin/login', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		credentials: 'include',
		body: JSON.stringify({ username, pin, deviceId }),
	})

	const payload = await readJsonResponse(response)
	const normalized = normalizeExchangeResponse(payload)

	if (!response.ok && !normalized.error) {
		return {
			...normalized,
			success: false,
			error: `Request failed: ${response.status} ${response.statusText}`,
		}
	}

	return normalized
}

export async function setPin(
	username: string,
	pin: string,
	accessToken: string,
): Promise<{ success: boolean; message?: string; error?: string; errorCode?: string }> {
	const response = await fetch('/api/auth/pin/set', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${accessToken}`,
		},
		credentials: 'include',
		body: JSON.stringify({ username, pin }),
	})

	const payload = await readJsonResponse(response)
	return {
		success: Boolean(payload?.success),
		message: payload?.message,
		error: payload?.error,
		errorCode: payload?.errorCode ?? payload?.error_code,
	}
}

export async function changePin(
	currentPin: string,
	newPin: string,
	newUsername: string | undefined,
	accessToken: string,
): Promise<{ success: boolean; message?: string; error?: string; errorCode?: string }> {
	const response = await fetch('/api/auth/pin/change', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${accessToken}`,
		},
		credentials: 'include',
		body: JSON.stringify({ currentPin, newPin, newUsername }),
	})

	const payload = await readJsonResponse(response)
	return {
		success: Boolean(payload?.success),
		message: payload?.message,
		error: payload?.error,
		errorCode: payload?.errorCode ?? payload?.error_code,
	}
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(
	refreshToken?: string,
): Promise<RefreshResponse> {
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
	}

	const body: Record<string, string> = {}
	if (refreshToken) {
		body.refreshToken = refreshToken
		body.refresh_token = refreshToken
	}

	const response = await fetch('/api/auth/refresh', {
		method: 'POST',
		headers,
		credentials: 'include',
		body: JSON.stringify(body),
	})

	return normalizeRefreshResponse(await response.json())
}

/**
 * Get current user info
 */
export async function getCurrentUser(
	accessToken: string,
): Promise<UserResponse | null> {
	const response = await fetch('/api/auth/me', {
		headers: {
			Authorization: `Bearer ${accessToken}`,
		},
		credentials: 'include',
	})

	if (!response.ok) {
		return null
	}

	const data = await response.json()
	return normalizeUserResponse(data?.user ?? data)
}

/**
 * Logout
 */
export async function logout(accessToken?: string | null): Promise<void> {
	const headers: Record<string, string> = {}
	if (accessToken) {
		headers.Authorization = `Bearer ${accessToken}`
	}

	await fetch('/api/auth/logout', {
		method: 'POST',
		headers,
		credentials: 'include',
	})
}

export async function resetAuthSession(): Promise<void> {
	await fetch('/api/auth/reset-session', {
		method: 'POST',
		credentials: 'include',
	})
}
