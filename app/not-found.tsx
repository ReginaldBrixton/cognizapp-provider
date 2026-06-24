'use client'

import { motion } from 'framer-motion'
import { FileQuestion, Home, ArrowLeft, LayoutDashboard } from 'lucide-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'

export default function NotFoundPage() {
	const router = useRouter()
	const pathname = usePathname()

	return (
		<div className='relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-zinc-50 dark:bg-slate-950 px-4 py-12 sm:px-6 lg:px-8'>
			{/* Rich Gradient Background */}
			<div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-100 via-zinc-50 to-white dark:from-slate-900 dark:via-slate-950 dark:to-black' />

			{/* Animated Background Blobs */}
			<div
				className='pointer-events-none absolute inset-0 overflow-hidden'
				aria-hidden='true'
			>
				<div className='absolute -left-[10%] -top-[10%] h-[500px] w-[500px] animate-pulse rounded-full bg-indigo-400/10 dark:bg-indigo-500/10 blur-[100px] duration-700' />
				<div className='absolute -right-[10%] bottom-[10%] h-[500px] w-[500px] animate-pulse rounded-full bg-purple-400/10 dark:bg-purple-500/10 blur-[100px] duration-1000' />
			</div>

			{/* Grid Pattern Overlay */}
			<div className='absolute inset-0 bg-[url("/grid.svg")] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))] opacity-10 dark:opacity-20' />

			<motion.div
				initial={{ opacity: 0, scale: 0.95, y: 20 }}
				animate={{ opacity: 1, scale: 1, y: 0 }}
				transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
				className='relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-slate-200/50 dark:border-white/10 bg-white/80 dark:bg-slate-900/60 p-8 shadow-2xl backdrop-blur-xl sm:p-10'
			>
				<div className='mb-8 flex justify-center'>
					<div className='relative'>
						<div className='absolute inset-0 animate-ping rounded-full bg-indigo-500/20 duration-1000' />
						<div className='relative flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800/50 ring-1 ring-slate-200 dark:ring-white/10'>
							<FileQuestion className='h-10 w-10 text-indigo-500 dark:text-indigo-400' />
						</div>
					</div>
				</div>

				<div className='text-center'>
					<h1 className='bg-gradient-to-br from-slate-900 via-slate-700 to-slate-500 dark:from-white dark:via-slate-100 dark:to-slate-400 bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl'>
						Page Not Found
					</h1>
					<p className='mt-3 text-sm text-slate-600 dark:text-slate-400'>
						We couldn&apos;t find the page you were looking for. It might have
						been moved, deleted, or never existed.
					</p>
					{pathname && (
						<div className='mt-4 inline-flex items-center rounded-full bg-slate-100 dark:bg-slate-800/50 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-400 ring-1 ring-slate-200 dark:ring-white/5'>
							Path: {pathname}
						</div>
					)}
				</div>

				<div className='mt-8 space-y-3'>
					<button
						onClick={() => router.back()}
						className='group flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-slate-100/50 dark:bg-white/5 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-200/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white'
					>
						<ArrowLeft className='h-4 w-4 transition-transform group-hover:-translate-x-1' />
						<span>Go Back</span>
					</button>

					<div className='grid grid-cols-2 gap-3'>
						<Link
							href='/'
							className='flex items-center justify-center gap-2 rounded-xl border border-slate-300 dark:border-slate-700/50 bg-slate-100 dark:bg-slate-800/50 py-3 text-sm font-medium text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
						>
							<Home className='h-4 w-4' />
							<span>Home</span>
						</Link>
						<Link
							href='/dashboard'
							className='flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] hover:shadow-indigo-500/30'
						>
							<LayoutDashboard className='h-4 w-4' />
							<span>Dashboard</span>
						</Link>
					</div>
				</div>
			</motion.div>
		</div>
	)
}
