import { Switch } from '@/components/ui/switch'

export function SwitchRow({
	label,
	checked,
	onCheckedChange,
}: {
	label: string
	checked: boolean
	onCheckedChange: (v: boolean) => void
}) {
	return (
		<div className='flex items-center justify-between rounded-lg border border-slate-100 dark:border-border bg-slate-50 dark:bg-muted px-3 py-2'>
			<span className='text-[12px] font-medium text-slate-700 dark:text-foreground'>
				{label}
			</span>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	)
}
