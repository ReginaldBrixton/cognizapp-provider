'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useUserRole } from '@/hooks/useUserRole'

/**
 * /dashboard — Role-based redirect hub (provider-only)
 * Providers → /provider/dashboard
 * Fallback → /login
 */
export default function DashboardRedirectPage() {
	const { role, loading } = useUserRole()
	const router = useRouter()

	useEffect(() => {
		if (loading) return

		if (role === 'provider' || role === 'support_provider') {
			router.replace('/provider/dashboard')
		} else {
			router.replace('/login')
		}
	}, [role, loading, router])

	return (
		<div className='flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950'>
			<Loader2 className='h-8 w-8 animate-spin text-indigo-600' />
		</div>
	)
}
