'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useUserRole } from '@/hooks/useUserRole'
import type { UserRole } from '@/types/roles'

interface ProtectedRoleLayoutProps {
	children: ReactNode
	allow: (role: UserRole) => boolean
	redirectTo?: string | ((role: UserRole) => string)
}

export function ProtectedRoleLayout({
	children,
	allow,
	redirectTo = '/login',
}: ProtectedRoleLayoutProps) {
	const { role, loading } = useUserRole()
	const router = useRouter()
	const [authorized, setAuthorized] = useState(false)

	useEffect(() => {
		if (loading) {
			return
		}

		if (!allow(role)) {
			setAuthorized(false)
			const redirectTarget = typeof redirectTo === 'function' ? redirectTo(role) : redirectTo

			// Prevent redirect loops: don't redirect to current path
			const currentPath = window.location.pathname
			if (redirectTarget !== currentPath) {
				router.replace(redirectTarget)
			}
			return
		}

		setAuthorized(true)
	}, [allow, loading, redirectTo, role, router])

	if (loading || !authorized) {
		return (
			<div className='flex min-h-screen items-center justify-center bg-slate-50'>
				<Loader2 className='h-8 w-8 animate-spin text-indigo-600' />
			</div>
		)
	}

	return <>{children}</>
}
