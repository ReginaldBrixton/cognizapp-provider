/**
 * User roles for the provider portal.
 *
 * The provider portal only serves support provider accounts.
 * The backend resolves the exact role from the privileged-access
 * allow-list, so the UI only needs to distinguish provider sessions
 * from unauthenticated visitors.
 */

export type UserRole = 'provider' | 'support_provider' | 'unauthorized'

/** Canonical backend roles from the users service */
export type CanonicalUserRole = 'SUPPORT_PROVIDER_USER' | 'DEV_USER'

/** Maps canonical backend roles to UI-friendly role names */
export const CANONICAL_ROLE_TO_UI_ROLE: Record<CanonicalUserRole, UserRole> = {
	SUPPORT_PROVIDER_USER: 'support_provider',
	DEV_USER: 'support_provider',
}

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
	provider: '/provider/dashboard',
	support_provider: '/provider/dashboard',
	unauthorized: '/login',
}

export function isValidRole(role: string): role is UserRole {
	return role === 'provider' || role === 'support_provider' || role === 'unauthorized'
}

export function isCanonicalUserRole(role: string): role is CanonicalUserRole {
	return role in CANONICAL_ROLE_TO_UI_ROLE
}

export function normalizeUserRole(role: string | null | undefined): UserRole {
	const value = String(role ?? '').trim()

	if (isValidRole(value)) {
		return value
	}

	if (isCanonicalUserRole(value)) {
		return CANONICAL_ROLE_TO_UI_ROLE[value]
	}

	return 'unauthorized'
}

export function isProvider(role: UserRole): boolean {
	return role === 'provider' || role === 'support_provider'
}

export const ROLE_LABELS: Record<UserRole, string> = {
	provider: 'Support Provider',
	support_provider: 'Support Provider',
	unauthorized: 'Unauthorized',
}

