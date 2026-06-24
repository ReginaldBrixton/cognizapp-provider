import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { UserRole, Permission } from '@/types/roles'

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs))
}

// Password validation utilities (stub implementations)
export function validatePassword(password: string): PasswordValidationResult {
	let strength: PasswordStrength = 'weak'
	if (password.length >= 12) strength = 'strong'
	else if (password.length >= 8) strength = 'medium'

	return {
		isValid: password.length >= 8,
		strength,
		feedback: password.length >= 8 ? ['Good password'] : ['Too short'],
		score: password.length >= 12 ? 3 : password.length >= 8 ? 2 : 1,
	}
}

export function getPasswordStrengthColor(strength: PasswordStrength): string {
	if (strength === 'strong') return 'text-green-600'
	if (strength === 'medium') return 'text-yellow-600'
	return 'text-red-600'
}

export function getPasswordStrengthPercentage(strength: number): number {
	return (strength / 3) * 100
}

export type PasswordStrength = 'weak' | 'medium' | 'strong'

export type PasswordValidationResult = {
	isValid: boolean
	strength: PasswordStrength
	feedback: string[]
	score: number
}

// RBAC utilities (stub implementations)
export function hasAccess(userRole: UserRole, requiredRole: UserRole): boolean {
	const roleLevels: Record<UserRole, number> = {
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
	return roleLevels[userRole] >= roleLevels[requiredRole]
}

export function hasPermission(
	userRole: UserRole,
	permission: Permission,
): boolean {
	if (userRole === 'master' || userRole === 'admin') return true
	if (userRole === 'developer') return permission !== 'admin'
	if (userRole === 'provider' || userRole === 'support_provider')
		return permission === 'read' || permission === 'write'
	return permission === 'read'
}

export function canAccessFeature(userRole: UserRole, feature: string): boolean {
	// Stub implementation - always return true for now
	return true
}

export const FEATURE_PERMISSIONS = {
	// Stub implementation
} as const

// String formatting utilities
export function formatLabel(str: string): string {
	return str
		.split('_')
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}
