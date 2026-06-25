import { type ReactNode } from 'react'

interface ClientMetricProps {
	icon: ReactNode
	label: string
	value: string | number
}

export function ClientMetric({ icon, label, value }: ClientMetricProps) {
	return (
		<div className='rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted p-2.5 sm:p-3'>
			<div className='mb-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-card text-slate-500 dark:text-muted-foreground shadow-sm sm:mb-2 sm:h-9 sm:w-9'>
				{icon}
			</div>
			<p className='text-base font-semibold text-slate-900 dark:text-foreground sm:text-lg'>
				{value}
			</p>
			<p className='text-[11px] text-slate-500 dark:text-muted-foreground sm:text-xs'>
				{label}
			</p>
		</div>
	)
}
