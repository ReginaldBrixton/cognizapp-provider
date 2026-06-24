import {
	type UserRole,
	normalizeUserRole,
	toCanonicalUserRole,
} from '@/types/roles'
import { API_BASE_URL } from '@/app/constants'

// Re-export role utilities from types/roles
export {
	ROLE_DASHBOARDS,
	isValidRole,
	normalizeUserRole,
	toCanonicalUserRole,
	CANONICAL_ROLE_TO_UI_ROLE,
	UI_ROLE_TO_CANONICAL_ROLE,
	isAdmin,
	isDeveloper,
	isSupport,
	isPremium,
	isMaster,
	getRoleLevel,
	getRoleLabel,
} from '@/types/roles'

// Re-export UserRole type
export type { UserRole } from '@/types/roles'

const API_URL = API_BASE_URL

// Fetch user role from backend (MongoDB)
export async function fetchUserRole(userId: string): Promise<UserRole> {
	try {
		const res = await fetch(`${API_URL}/api/user/role/${userId}`)
		if (!res.ok) return 'user'
		const data = await res.json()
		return normalizeUserRole(data.role)
	} catch {
		return 'user'
	}
}

// Update user role (admin only)
export async function updateUserRole(
	userId: string,
	role: UserRole,
	token: string,
): Promise<boolean> {
	if (role === 'master') {
		return false
	}

	try {
		const res = await fetch(`${API_URL}/api/admin/users/${userId}/role`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify({ role: toCanonicalUserRole(role) }),
		})
		return res.ok
	} catch {
		return false
	}
}

// List all users with roles (admin only)
export async function listUsersWithRoles(token: string) {
	const res = await fetch(`${API_URL}/api/admin/users`, {
		headers: { Authorization: `Bearer ${token}` },
	})
	if (!res.ok) throw new Error('Failed to fetch users')
	return res.json()
}
