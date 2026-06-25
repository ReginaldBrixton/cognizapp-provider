'use client'

import { FileQuestion, Home, ArrowLeft, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function NotFoundPage() {
	const router = useRouter()
	const pathname = usePathname()

	return (
		<div className='flex min-h-screen w-full items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950 sm:px-6 lg:px-8'>
			<div className='w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-10'>
				<div className='mb-8 flex justify-center'>
					<div className='flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-1 ring-emerald-100 dark:bg-emerald-950/50 dark:ring-emerald-900/50'>
						<FileQuestion className='h-8 w-8 text-emerald-600 dark:text-emerald-400' />
					</div>
				</div>

				<div className='text-center'>
					<h1 className='text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 sm:text-3xl'>
						Page Not Found
					</h1>
					<p className='mt-3 text-sm text-slate-600 dark:text-slate-400'>
						We couldn&apos;t find the page you were looking for. It might have
						been moved, deleted, or never existed.
					</p>
					{pathname && (
						<div className='mt-4 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:ring-slate-700/50'>
							Path: {pathname}
						</div>
					)}
				</div>

				<div className='mt-8 space-y-3'>
					<button
						onClick={() => router.back()}
						className='flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
					>
						<ArrowLeft className='h-4 w-4' />
						<span>Go Back</span>
					</button>

					<div className='grid grid-cols-2 gap-3'>
						<Link
							href='/'
							className='flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white'
						>
							<Home className='h-4 w-4' />
							<span>Home</span>
						</Link>
						<Link
							href='/provider/dashboard'
							className='flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-medium text-white transition-colors hover:bg-emerald-700'
						>
							<LayoutDashboard className='h-4 w-4' />
							<span>Dashboard</span>
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
