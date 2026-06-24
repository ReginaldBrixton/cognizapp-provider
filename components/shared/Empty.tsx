'use client'

import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyProps {
	icon: LucideIcon
	title: string
	description?: string
	children?: React.ReactNode
	className?: string
}

/**
 * Standardized empty state for consistent empty-list UI across all CogniZap apps.
 */
export function Empty({ icon: Icon, title, description, children, className }: EmptyProps) {
	return (
		<div className={cn('flex flex-col items-center justify-center gap-3 px-6 py-12 text-center', className)}>
			<span className='flex h-14 w-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground'>
				<Icon className='h-6 w-6' />
			</span>
			<div>
				<p className='text-sm font-semibold text-foreground'>{title}</p>
				{description && (
					<p className='mt-1 text-xs text-muted-foreground'>{description}</p>
				)}
			</div>
			{children}
		</div>
	)
}
