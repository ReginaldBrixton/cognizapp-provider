'use client'

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorStateProps {
	message: string
	onRetry?: () => void
	className?: string
	variant?: 'default' | 'destructive'
}

/**
 * Standardized error state component for consistent error UI across all CogniZap apps.
 *
 * @example
 * ```tsx
 * <ErrorState message="Failed to load users" onRetry={() => loadUsers()} />
 * <ErrorState message="Critical error" variant="destructive" />
 * ```
 */
export function ErrorState({ message, onRetry, className, variant = 'default' }: ErrorStateProps) {
	const variantClasses = {
		default:
			'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300',
		destructive: 'border-destructive/20 bg-destructive/10 text-destructive',
	}

	return (
		<div
			className={cn(
				'flex items-center gap-3 rounded-xl border px-4 py-3',
				variantClasses[variant],
				className,
			)}
		>
			<AlertCircle className='h-5 w-5 shrink-0' />
			<p className='flex-1 text-sm font-medium'>{message}</p>
			{onRetry && (
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={onRetry}
					className='h-7 shrink-0 px-2 text-xs hover:bg-current/10'
				>
					Retry
				</Button>
			)}
		</div>
	)
}

/**
 * Full-page error state for critical errors that prevent page rendering.
 */
export function FullPageError({ message, onRetry }: { message: string; onRetry?: () => void }) {
	return (
		<div className='flex min-h-screen items-center justify-center bg-background px-4'>
			<div className='max-w-md text-center'>
				<div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10'>
					<AlertCircle className='h-8 w-8 text-destructive' />
				</div>
				<h2 className='mb-2 text-xl font-semibold text-foreground'>Something went wrong</h2>
				<p className='mb-6 text-sm text-muted-foreground'>{message}</p>
				{onRetry && (
					<Button
						type='button'
						onClick={onRetry}
						className='inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold'
					>
						Try again
					</Button>
				)}
			</div>
		</div>
	)
}

/**
 * Inline error banner for non-critical errors within content areas.
 */
export function ErrorBanner({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
	return (
		<div className='flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive'>
			<AlertCircle className='mt-0.5 h-5 w-5 shrink-0' />
			<p className='flex-1 text-sm'>{message}</p>
			{onDismiss && (
				<Button
					type='button'
					variant='ghost'
					size='sm'
					onClick={onDismiss}
					className='shrink-0 rounded-lg p-1 text-destructive hover:bg-destructive/10'
					aria-label='Dismiss error'
				>
					✕
				</Button>
			)}
		</div>
	)
}
