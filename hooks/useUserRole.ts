'use client'

import { useEffect, useState } from 'react'
import {
	type UserRole,
	ROLE_DASHBOARDS,
	isValidRole,
	isProvider,
	normalizeUserRole,
} from '@/types/roles'

interface RoleInfo {
	role: UserRole
	dashboard: string
	isProvider: boolean
}

interface UseUserRoleReturn extends RoleInfo {
	loading: boolean
	error: string | null
	refetch: () => Promise<void>
}

/**
 * Hook to get the current user's role and permissions.
 *
 * The provider portal only serves support provider accounts.
 */
export function useUserRole(): UseUserRoleReturn {
	const [roleInfo, setRoleInfo] = useState<RoleInfo>({
		role: 'unauthorized',
		dashboard: '/login',
		isProvider: false,
	})
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)

	const fetchRole = async () => {
		setLoading(true)
		setError(null)

		try {
			const response = await fetch('/api/auth/me', {
				method: 'GET',
				credentials: 'include',
			})

			if (!response.ok) {
				if (response.status === 401) {
					setRoleInfo({
						role: 'unauthorized',
						dashboard: '/login',
						isProvider: false,
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
				dashboard: ROLE_DASHBOARDS[role] || '/login',
				isProvider: isProvider(role),
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
