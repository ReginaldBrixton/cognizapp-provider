import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { PageHeader } from '@/components/shared/PageHeader'

interface PageContainerProps {
	/** Page title shown in the header */
	title: string
	/** Optional subtitle/description */
	subtitle?: string
	/** Optional actions rendered on the right side of the header */
	actions?: ReactNode
	/** Page content */
	children: ReactNode
	/** Extra classes for the outer scroll container */
	className?: string
	/** Extra classes for the inner content wrapper */
	contentClassName?: string
	/** When true, the inner container fills available height (for lists that scroll internally) */
	fillHeight?: boolean
}

/**
 * Standard page layout wrapper used by every provider portal page.
 *
 * Provides:
 * - Consistent horizontal/vertical padding and max width
 * - PageHeader with title + subtitle + optional actions
 * - Scroll behaviour (page scrolls by default; `fillHeight` for internal scroll)
 *
 * @example
 * ```tsx
 * <PageContainer title="Inbox" subtitle="Manage incoming requests">
 *   <RequestInbox />
 * </PageContainer>
 * ```
 */
export function PageContainer({
	title,
	subtitle,
	actions,
	children,
	className,
	contentClassName,
	fillHeight = false,
}: PageContainerProps) {
	return (
		<div
			className={cn(
				'h-full min-h-0 w-full overflow-x-hidden',
				fillHeight ? 'overflow-hidden' : 'overflow-y-auto',
				className,
			)}
		>
			<div
				className={cn(
					'mx-auto flex w-full max-w-screen-2xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:gap-6 lg:px-8 lg:py-6',
					fillHeight && 'h-full min-h-0',
					contentClassName,
				)}
			>
				<PageHeader title={title} subtitle={subtitle} actions={actions} />
				{children}
			</div>
		</div>
	)
}
