'use client'

import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingStateProps {
	message?: string
	className?: string
	size?: 'sm' | 'md' | 'lg'
}

/**
 * Standardized loading state component for consistent loading UI across the admin/provider portals.
 *
 * @example
 * ```tsx
 * <LoadingState message="Loading users..." />
 * <LoadingState size="lg" />
 * ```
 */
export function LoadingState({ message, className, size = 'md' }: LoadingStateProps) {
	const sizeClasses = {
		sm: 'h-4 w-4',
		md: 'h-8 w-8',
		lg: 'h-12 w-12',
	}

	return (
		<div className={cn('flex flex-col items-center justify-center gap-3', className)}>
			<Loader2 className={cn('animate-spin text-muted-foreground', sizeClasses[size])} />
			{message && <p className='text-sm text-muted-foreground'>{message}</p>}
		</div>
	)
}

/**
 * Full-page loading state for when entire pages are loading.
 */
export function FullPageLoading({ message = 'Loading...' }: { message?: string }) {
	return (
		<div className='flex min-h-screen items-center justify-center bg-background'>
			<LoadingState message={message} size='lg' />
		</div>
	)
}

/**
 * Inline loading state for smaller content areas.
 */
export function InlineLoading({ message, className }: { message?: string; className?: string }) {
	return (
		<div className={cn('flex items-center justify-center py-8', className)}>
			<LoadingState message={message} size='sm' />
		</div>
	)
}
