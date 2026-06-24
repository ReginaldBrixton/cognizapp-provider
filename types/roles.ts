/**
 * User roles for the admin/provider interface.
 *
 * NOTE: This system maps UI-friendly role names to canonical backend roles.
 * The backend uses canonical roles (REGULAR_USER, PRO_USER, etc.) while the UI
 * uses shorter, user-friendly names.
 *
 * Role hierarchy (low → high):
 * user < pro < support_provider < developer < admin < master
 *
 * TODO: Simplify by removing redundant aliases:
 * - Keep 'support_provider', remove 'provider' alias
 * - Consolidate 'pro', 'max', 'premium' into single 'pro' with tier field
 */
export type UserRole =
	| 'user'
	| 'pro'
	| 'max'
	| 'premium'
	| 'provider' // @deprecated - use support_provider instead
	| 'support_provider'
	| 'developer'
	| 'admin'
	| 'master'

/** Canonical backend roles from the users service */
export type CanonicalUserRole =
	| 'REGULAR_USER'
	| 'PRO_USER'
	| 'SUPPORT_PROVIDER_USER'
	| 'DEV_USER'
	| 'ADMIN_USER'
	| 'SYSTEM_USER'

export type Permission = 'read' | 'write' | 'delete' | 'admin'

/** Maps canonical backend roles to UI-friendly role names */
export const CANONICAL_ROLE_TO_UI_ROLE: Record<CanonicalUserRole, UserRole> = {
	REGULAR_USER: 'user',
	PRO_USER: 'pro',
	SUPPORT_PROVIDER_USER: 'support_provider', // Changed from 'provider' to avoid alias confusion
	DEV_USER: 'developer',
	ADMIN_USER: 'admin',
	SYSTEM_USER: 'master',
}

/** Maps UI role names to canonical backend roles */
export const UI_ROLE_TO_CANONICAL_ROLE: Record<UserRole, CanonicalUserRole> = {
	user: 'REGULAR_USER',
	pro: 'PRO_USER',
	max: 'PRO_USER', // @deprecated - consolidate with pro
	provider: 'SUPPORT_PROVIDER_USER', // @deprecated - use support_provider instead
	premium: 'PRO_USER', // @deprecated - consolidate with pro
	support_provider: 'SUPPORT_PROVIDER_USER',
	developer: 'DEV_USER',
	admin: 'ADMIN_USER',
	master: 'SYSTEM_USER',
}

export const ROLE_DASHBOARDS: Record<UserRole, string> = {
	user: '/login',
	pro: '/login',
	max: '/login',
	premium: '/login',
	provider: '/provider/dashboard',
	support_provider: '/provider/dashboard',
	developer: '/provider/dashboard',
	admin: '/login',
	master: '/login',
}

export function isValidRole(role: string): role is UserRole {
	return (
		role === 'user' ||
		role === 'pro' ||
		role === 'max' ||
		role === 'provider' ||
		role === 'premium' ||
		role === 'support_provider' ||
		role === 'developer' ||
		role === 'admin' ||
		role === 'master'
	)
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

	return 'user'
}

export function toCanonicalUserRole(
	role: UserRole | CanonicalUserRole | string | null | undefined,
): CanonicalUserRole {
	const value = String(role ?? '').trim()

	if (isCanonicalUserRole(value)) {
		return value
	}

	if (isValidRole(value)) {
		return UI_ROLE_TO_CANONICAL_ROLE[value]
	}

	return 'REGULAR_USER'
}

export function isAdmin(role: UserRole): boolean {
	return role === 'admin' || role === 'master'
}

export function isDeveloper(role: UserRole): boolean {
	return role === 'developer' || role === 'admin' || role === 'master'
}

export function isSupport(role: UserRole): boolean {
	return (
		role === 'provider' ||
		role === 'support_provider' ||
		role === 'admin' ||
		role === 'master'
	)
}

export function isPremium(role: UserRole): boolean {
	return (
		role === 'premium' ||
		role === 'pro' ||
		role === 'max' ||
		role === 'provider' ||
		role === 'support_provider' ||
		role === 'developer' ||
		role === 'admin' ||
		role === 'master'
	)
}

export function isMaster(role: UserRole): boolean {
	return role === 'master'
}

export function getRoleLevel(role: UserRole): number {
	const levels: Record<UserRole, number> = {
		user: 1,
		pro: 2,
		max: 2,
		premium: 2,
		provider: 3,
		support_provider: 3,
		developer: 4,
		admin: 5,
		master: 6,
	}
	return levels[role]
}

export const ROLE_LEVELS: Record<UserRole, number> = {
	user: 1,
	pro: 2,
	max: 2,
	premium: 2,
	provider: 3,
	support_provider: 3,
	developer: 4,
	admin: 5,
	master: 6,
}

export const ROLE_LABELS: Record<UserRole, string> = {
	user: 'User',
	pro: 'Pro User',
	max: 'Pro User (Max)', // @deprecated
	premium: 'Pro User (Premium)', // @deprecated
	provider: 'Support Provider', // @deprecated - use support_provider
	support_provider: 'Support Provider',
	developer: 'Developer',
	admin: 'Admin',
	master: 'System Master',
}

export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
	user: 'Standard user with basic access',
	pro: 'Pro user with additional features',
	max: 'Pro user with the highest user tier features', // @deprecated
	premium: 'Pro user with additional features', // @deprecated
	provider: 'Support provider with request and client communication access', // @deprecated
	support_provider: 'Support provider with request and client communication access',
	developer: 'Developer with API access',
	admin: 'Administrator with full control',
	master: 'System master with platform-wide access',
}

export const VALID_ROLES: UserRole[] = [
	'user',
	'pro',
	'max',
	'provider',
	'premium',
	'support_provider',
	'developer',
	'admin',
	'master',
]

export function getDashboard(role: UserRole): string {
	return ROLE_DASHBOARDS[role]
}

export function getRoleLabel(role: UserRole): string {
	return ROLE_LABELS[role]
}

export function hasAccess(userRole: UserRole, requiredRole: UserRole): boolean {
	return getRoleLevel(userRole) >= getRoleLevel(requiredRole)
}
