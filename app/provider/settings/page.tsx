import { ProviderSettingsForm } from './settings-form'

export const dynamic = 'force-dynamic'

export default function ProviderSettingsPage() {
	return (
		<div className='h-full min-h-0 w-full overflow-y-auto'>
			<div className='mx-auto flex min-h-full w-full max-w-screen-2xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:gap-6 lg:px-8 lg:py-6'>
				<div>
					<h1 className='text-lg font-semibold tracking-tight text-slate-900 lg:text-2xl'>Settings</h1>
					<p className='text-[12px] text-slate-500 lg:text-sm'>Manage availability, workload, and notification preferences</p>
				</div>
				<ProviderSettingsForm />
			</div>
		</div>
	)
}
