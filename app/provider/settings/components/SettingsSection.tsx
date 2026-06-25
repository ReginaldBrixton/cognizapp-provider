import { type ElementType, type ReactNode } from 'react'

export function SettingsSection({
	icon: Icon,
	title,
	children,
}: {
	icon: ElementType
	title: string
	children: ReactNode
}) {
	return (
		<div className='rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-3 shadow-sm'>
			<div className='mb-2.5 flex items-center gap-1.5'>
				<Icon className='h-4 w-4 text-slate-500 dark:text-muted-foreground' />
				<p className='text-[13px] font-semibold text-slate-800 dark:text-foreground'>
					{title}
				</p>
			</div>
			{children}
		</div>
	)
}
