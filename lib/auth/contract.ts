/**
 * Auth Contract Types and Normalizers
 *
 * Shared types and normalization functions for auth API responses.
 */

export type AuthAction = 'login' | 'register' | null

export interface TokenPair {
	accessToken: string
	refreshToken: string
	expiresIn: number
}

export interface ExchangeResponse {
	success: boolean
	accessToken?: string
	refreshToken?: string
	expiresIn?: number
	expiresAt?: number
	authAction?: AuthAction
	error?: string
	errorCode?: string
	details?: unknown
	user?: {
		id?: string
		email?: string
		displayName?: string
		avatarUrl?: string
		role?: string
	}
}

export interface OtpRequestResponse {
	success: boolean
	message?: string
	email?: string
	expiresInMinutes?: number
	resendCooldownSeconds?: number
	error?: string
	errorCode?: string
	details?: unknown
}

export interface RefreshResponse {
	success: boolean
	accessToken?: string
	refreshToken?: string
	expiresIn?: number
	error?: string
	errorCode?: string
	details?: unknown
}

export interface UserResponse {
	id: string
	email: string
	displayName?: string
	fullName?: string
	avatarUrl?: string
	role?: string
}

export function normalizeExchangeResponse(
	payload: unknown,
): ExchangeResponse {
	const data = payload as Record<string, unknown>
	const user = data?.user as Record<string, unknown> | undefined
	const userId = (user?.id || data?.userId || data?.user_id) as string | undefined
	const email = (user?.email || data?.email) as string | undefined
	return {
		success: Boolean(data?.success),
		accessToken: data?.access_token as string || data?.accessToken as string,
		refreshToken: data?.refresh_token as string || data?.refreshToken as string,
		expiresIn: data?.expires_in as number || data?.expiresIn as number,
		expiresAt: data?.expires_at as number || data?.expiresAt as number,
		authAction: (data?.auth_action as AuthAction) || (data?.authAction as AuthAction) || null,
		error: data?.error as string,
		errorCode: data?.error_code as string || data?.errorCode as string,
		details: data?.details,
		user: userId && email
			? {
					id: userId,
					email,
					displayName: (user?.display_name || user?.displayName || data?.displayName || data?.display_name) as string,
					avatarUrl: (user?.avatar_url || user?.avatarUrl || data?.avatarUrl || data?.avatar_url) as string,
					role: (user?.role || data?.role) as string,
				}
			: undefined,
	}
}

export function normalizeRefreshResponse(
	payload: unknown,
): RefreshResponse {
	const data = payload as Record<string, unknown>
	return {
		success: Boolean(data?.success),
		accessToken: data?.access_token as string || data?.accessToken as string,
		refreshToken: data?.refresh_token as string || data?.refreshToken as string,
		expiresIn: data?.expires_in as number || data?.expiresIn as number,
		error: data?.error as string,
		errorCode: data?.error_code as string || data?.errorCode as string,
		details: data?.details,
	}
}

export function normalizeUserResponse(
	payload: unknown,
): UserResponse | null {
	if (!payload) return null
	const data = payload as Record<string, unknown>
	return {
		id: data?.id as string,
		email: data?.email as string,
		displayName: data?.display_name as string || data?.displayName as string,
		fullName: data?.full_name as string || data?.fullName as string,
		avatarUrl: data?.avatar_url as string || data?.avatarUrl as string,
		role: data?.role as string,
	}
}
