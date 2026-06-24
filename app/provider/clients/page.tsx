import { ClientList } from './components/ClientList'

export default function ClientsPage() {
	return (
		<div className='h-full min-h-0 w-full overflow-hidden'>
			<div className='mx-auto flex h-full min-h-0 w-full max-w-screen-2xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:gap-6 lg:px-8 lg:py-6'>
				<div>
					<h1 className='text-lg font-semibold tracking-tight text-slate-900 lg:text-2xl'>Clients</h1>
					<p className='text-[12px] text-slate-500 lg:text-sm'>View and manage client relationships</p>
				</div>
				<div className='min-h-0 flex-1 overflow-y-auto'>
					<ClientList />
				</div>
			</div>
		</div>
	)
}
