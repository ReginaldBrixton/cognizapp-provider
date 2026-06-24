'use client'

import { useEffect, useState } from 'react'
import {
	type UserRole,
	ROLE_DASHBOARDS,
	isValidRole,
	isAdmin,
	isDeveloper,
	isSupport,
	isPremium,
	isMaster,
	getRoleLevel,
	normalizeUserRole,
} from '@/lib/services/roles'

interface RoleInfo {
	role: UserRole
	level: number
	dashboard: string
	isAdmin: boolean
	isDeveloper: boolean
	isSupport: boolean
	isPremium: boolean
	isMaster: boolean
}

interface UseUserRoleReturn extends RoleInfo {
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
}

/**
 * Hook to get the current user's role and permissions
 *
 * Role hierarchy (higher = more access):
 * Product roles: user < provider < admin. User tiers: free, pro, max.
 * Legacy aliases remain supported only for older sessions.
 */
export function useUserRole(): UseUserRoleReturn {
	const [roleInfo, setRoleInfo] = useState<RoleInfo>({
		role: 'user',
		level: 1,
		dashboard: '/login',
		isAdmin: false,
		isDeveloper: false,
		isSupport: false,
		isPremium: false,
		isMaster: false,
	})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchRole = async () => {
		setLoading(true)
		setError(null)

		try {
			// Fetch user info from backend API
			const response = await fetch('/api/auth/me', {
				method: 'GET',
				credentials: 'include',
			})

			if (!response.ok) {
				if (response.status === 401) {
					// Not authenticated - use default user role
					setRoleInfo({
						role: 'user',
						level: 1,
						dashboard: '/login',
						isAdmin: false,
						isDeveloper: false,
						isSupport: false,
						isPremium: false,
						isMaster: false,
					})
					return
				}
				throw new Error(`Failed to fetch user role: ${response.statusText}`)
			}

			const data = await response.json()
			const rawRole = (data?.user?.role ?? data?.role) as string | undefined
			const role = isValidRole(rawRole || '')
				? (rawRole as UserRole)
				: normalizeUserRole(rawRole)

			const info: RoleInfo = {
				role,
				level: getRoleLevel(role),
				dashboard: ROLE_DASHBOARDS[role] || '/login',
				isAdmin: isAdmin(role),
				isDeveloper: isDeveloper(role),
				isSupport: isSupport(role),
				isPremium: isPremium(role),
				isMaster: isMaster(role),
			}
			setRoleInfo(info)
		} catch (e) {
			console.warn('[useUserRole] Error:', e)
			setError(e instanceof Error ? e.message : 'Failed to fetch role')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		let mounted = true

		const doFetch = async () => {
			if (!mounted) return
			await fetchRole()
		}

		doFetch()

		return () => {
			mounted = false
		}
	}, [])

	return {
		...roleInfo,
		loading,
		error,
		refetch: fetchRole,
	}
}
