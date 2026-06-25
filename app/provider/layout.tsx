'use client'

import React, { Suspense } from 'react'
import { ProviderSupportSidebar } from './_components/ProviderSupportSidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { ProtectedRoleLayout } from '@/components/layout'

function ContentFallback() {
	return (
		<div className='space-y-4 p-6'>
			<Skeleton className='h-8 w-48' />
			<div className='space-y-3'>
				{[...Array(5)].map((_, i) => (
					<Skeleton key={i} className='h-16 w-full rounded-xl' />
				))}
			</div>
		</div>
	)
}

export default function ProviderLayout({
	children,
}: {
	children: React.ReactNode
}) {
	return (
		<ProtectedRoleLayout>
			<div className='flex h-dvh w-full overflow-hidden bg-background text-foreground'>
				{/* Sidebar stays mounted across all provider routes. */}
				<ProviderSupportSidebar />

				{/* Only this slot re-renders on navigation */}
				<main className='h-dvh min-w-0 flex-1 overflow-hidden'>
					<div className='h-full min-h-0 pb-mobile-nav-safe md:pb-0'>
						<Suspense fallback={<ContentFallback />}>{children}</Suspense>
					</div>
				</main>
			</div>
		</ProtectedRoleLayout>
	)
}
