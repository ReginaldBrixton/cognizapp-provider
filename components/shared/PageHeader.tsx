'use client'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
	title: string
	subtitle?: string
	className?: string
	actions?: React.ReactNode
}

/**
 * Standardized page header for consistent title/subtitle layout across all CogniZap apps.
 */
export function PageHeader({ title, subtitle, className, actions }: PageHeaderProps) {
	return (
		<header className={cn('flex items-start justify-between gap-2', className)}>
			<div>
				<h1 className='text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl sm:font-semibold'>
					{title}
				</h1>
				{subtitle && (
					<p className='mt-0.5 text-[11px] text-muted-foreground sm:mt-1 sm:text-sm'>
						{subtitle}
					</p>
				)}
			</div>
			{actions && (
				<div className='flex items-center gap-1 pt-0.5 sm:gap-1.5'>
					{actions}
				</div>
			)}
		</header>
	)
}
