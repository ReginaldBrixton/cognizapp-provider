import { Switch } from '@/components/ui/switch'

export function SwitchRow({ label, checked, onCheckedChange }: {
	label: string
	checked: boolean
	onCheckedChange: (v: boolean) => void
}) {
	return (
		<div className='flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2'>
			<span className='text-[12px] font-medium text-slate-700'>{label}</span>
			<Switch checked={checked} onCheckedChange={onCheckedChange} />
		</div>
	)
}
