'use client'

import * as React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	BadgePercent,
	ChevronLeft,
	ChevronRight,
	Gift,
	Inbox,
	LayoutDashboard,
	Loader2,
	LogOut,
	MessagesSquare,
	MoreHorizontal,
	Settings,
	Users,
	X,
	type LucideIcon,
} from 'lucide-react'

import { useSession } from '@/components/providers/session'
import { cn } from '@/lib/utils'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

type NavItem = {
	href: string
	label: string
	shortLabel?: string
	icon: LucideIcon
}

const primaryItems: NavItem[] = [
	{ href: '/provider/dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
	{ href: '/provider/inbox', label: 'Inbox', icon: Inbox },
	{ href: '/provider/clients', label: 'Clients', icon: Users },
	{ href: '/provider/referrals', label: 'Referrals', icon: Gift },
]

const secondaryItems: NavItem[] = [
	{ href: '/provider/discount-codes', label: 'Discount codes', shortLabel: 'Discounts', icon: BadgePercent },
	{ href: '/provider/settings', label: 'Settings', icon: Settings },
]

const allItems = [...primaryItems, ...secondaryItems]

function isActiveRoute(pathname: string | null, href: string) {
	if (!pathname) return false
	if (href === '/provider/dashboard') return pathname === href
	return pathname === href || pathname.startsWith(`${href}/`)
}

export function ProviderSupportSidebar() {
	const pathname = usePathname()
	const { signOut } = useSession()
	const [isCollapsed, setIsCollapsed] = React.useState(false)
	const [moreOpen, setMoreOpen] = React.useState(false)
	const [pendingHref, setPendingHref] = React.useState<string | null>(null)
	const [isSigningOut, setIsSigningOut] = React.useState(false)
	const [signOutOpen, setSignOutOpen] = React.useState(false)

	React.useEffect(() => {
		setPendingHref(null)
		setMoreOpen(false)
	}, [pathname])

	const handleNavigate = React.useCallback((href: string) => {
		if (href !== pathname) setPendingHref(href)
	}, [pathname])

	const handleSignOut = React.useCallback(async () => {
		setIsSigningOut(true)
		setSignOutOpen(false)
		setMoreOpen(false)
		try {
			await signOut()
		} finally {
			setIsSigningOut(false)
		}
	}, [signOut])

	const DesktopLink = ({ item }: { item: NavItem }) => {
		const Icon = item.icon
		const active = isActiveRoute(pathname, item.href)
		const pending = pendingHref === item.href && !active
		return (
			<Link
				href={item.href}
				title={isCollapsed ? item.label : undefined}
				aria-label={isCollapsed ? item.label : undefined}
				onClick={() => handleNavigate(item.href)}
				className={cn(
					'group relative flex min-h-11 items-center rounded-xl text-sm font-medium transition',
					isCollapsed ? 'justify-center px-2' : 'gap-3 px-3',
					active
						? 'bg-emerald-600 text-white shadow-sm'
						: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
				)}
			>
				<Icon className='h-4.5 w-4.5 shrink-0' />
				{!isCollapsed && <span className='min-w-0 flex-1 truncate'>{item.label}</span>}
				{!isCollapsed && pending && <Loader2 className='h-3.5 w-3.5 animate-spin' />}
			</Link>
		)
	}

	return (
		<>
			<aside className='hidden h-dvh w-[76px] shrink-0 flex-col border-r border-slate-200 bg-white md:flex lg:hidden'>
				<div className='flex h-16 items-center justify-center border-b border-slate-200'>
					<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white'>
						<MessagesSquare className='h-5 w-5' />
					</div>
				</div>
				<nav className='flex flex-1 flex-col items-center gap-2 px-2 py-4' aria-label='Provider navigation'>
					{allItems.map((item) => {
						const Icon = item.icon
						const active = isActiveRoute(pathname, item.href)
						return (
							<Link
								key={item.href}
								href={item.href}
								title={item.label}
								aria-label={item.label}
								onClick={() => handleNavigate(item.href)}
								className={cn(
									'flex h-12 w-12 items-center justify-center rounded-xl transition',
									active
										? 'bg-emerald-600 text-white shadow-sm'
										: 'text-slate-500 hover:bg-slate-100 hover:text-slate-950',
								)}
							>
								<Icon className='h-5 w-5' />
							</Link>
						)
					})}
				</nav>
				<AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
					<AlertDialogTrigger asChild>
						<button
							type='button'
							disabled={isSigningOut}
							aria-label='Sign out'
							className='m-3 flex h-12 items-center justify-center rounded-xl text-red-600 hover:bg-red-50 disabled:opacity-50'
						>
							{isSigningOut ? <Loader2 className='h-5 w-5 animate-spin' /> : <LogOut className='h-5 w-5' />}
						</button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Sign out</AlertDialogTitle>
							<AlertDialogDescription>
								Are you sure you want to sign out? You'll need to enter your email and code again to access the provider portal.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel disabled={isSigningOut}>Cancel</AlertDialogCancel>
							<AlertDialogAction onClick={handleSignOut} disabled={isSigningOut}>
								{isSigningOut ? 'Signing out...' : 'Sign out'}
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</aside>

			<aside
				className={cn(
					'hidden h-dvh shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 lg:flex',
					isCollapsed ? 'w-[68px]' : 'w-[232px]',
				)}
			>
				<div className={cn('flex h-20 items-center border-b border-slate-200 px-3', isCollapsed ? 'justify-center' : 'gap-3')}>
					<div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white'>
						<MessagesSquare className='h-5 w-5' />
					</div>
					{!isCollapsed && (
						<div className='min-w-0'>
							<p className='truncate text-sm font-semibold'>Provider Portal</p>
							<p className='truncate text-xs text-slate-500'>Support & client management</p>
						</div>
					)}
				</div>
				<nav className='flex-1 space-y-1 p-3' aria-label='Provider navigation'>
					{primaryItems.map((item) => <DesktopLink key={item.href} item={item} />)}
					<div className='my-3 border-t border-slate-200' />
					{secondaryItems.map((item) => <DesktopLink key={item.href} item={item} />)}
				</nav>
				<div className='space-y-1 border-t border-slate-200 p-3'>
					<AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
						<AlertDialogTrigger asChild>
							<button
								type='button'
								disabled={isSigningOut}
								title={isCollapsed ? 'Sign out' : undefined}
								className={cn(
									'flex min-h-11 w-full items-center rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50',
									isCollapsed ? 'justify-center' : 'gap-3 px-3',
								)}
							>
								{isSigningOut ? <Loader2 className='h-4 w-4 animate-spin' /> : <LogOut className='h-4 w-4' />}
								{!isCollapsed && 'Sign out'}
							</button>
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Sign out</AlertDialogTitle>
								<AlertDialogDescription>
									Are you sure you want to sign out? You'll need to enter your email and code again to access the provider portal.
								</AlertDialogDescription>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel disabled={isSigningOut}>Cancel</AlertDialogCancel>
								<AlertDialogAction onClick={handleSignOut} disabled={isSigningOut}>
									{isSigningOut ? 'Signing out...' : 'Sign out'}
								</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
					<button
						type='button'
						onClick={() => setIsCollapsed((value) => !value)}
						aria-label={isCollapsed ? 'Expand navigation' : 'Collapse navigation'}
						className={cn(
							'flex min-h-11 w-full items-center rounded-xl text-sm text-slate-500 hover:bg-slate-100',
							isCollapsed ? 'justify-center' : 'justify-between px-3',
						)}
					>
						{!isCollapsed && <span>Collapse</span>}
						{isCollapsed ? <ChevronRight className='h-4 w-4' /> : <ChevronLeft className='h-4 w-4' />}
					</button>
				</div>
			</aside>

			<nav
				className='fixed inset-x-3 bottom-2 z-40 grid grid-cols-5 rounded-2xl border border-slate-200 bg-white/95 p-1 shadow-xl backdrop-blur md:hidden'
				aria-label='Provider mobile navigation'
			>
				{primaryItems.map((item) => {
					const Icon = item.icon
					const active = isActiveRoute(pathname, item.href)
					const pending = pendingHref === item.href && !active
					return (
						<Link
							key={item.href}
							href={item.href}
							aria-label={item.label}
							onClick={() => handleNavigate(item.href)}
							className={cn(
								'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition',
								active ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-100',
							)}
						>
							{pending ? <Loader2 className='h-4 w-4 animate-spin' /> : <Icon className='h-4 w-4' />}
							<span>{item.shortLabel ?? item.label}</span>
						</Link>
					)
				})}
				<button
					type='button'
					onClick={() => setMoreOpen(true)}
					aria-label='More provider tools'
					aria-expanded={moreOpen}
					className={cn(
						'flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-[10px] font-medium transition',
						secondaryItems.some((item) => isActiveRoute(pathname, item.href))
							? 'bg-emerald-600 text-white'
							: 'text-slate-500 hover:bg-slate-100',
					)}
				>
					<MoreHorizontal className='h-4 w-4' />
					More
				</button>
			</nav>

			{moreOpen && (
				<div className='fixed inset-0 z-50 md:hidden'>
					<button
						type='button'
						aria-label='Close more tools'
						onClick={() => setMoreOpen(false)}
						className='absolute inset-0 bg-slate-950/35'
					/>
					<section
						role='dialog'
						aria-modal='true'
						aria-label='More provider tools'
						className='absolute inset-x-0 bottom-0 rounded-t-3xl bg-white px-4 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] pt-3 shadow-2xl'
					>
						<div className='mx-auto mb-3 h-1 w-12 rounded-full bg-slate-200' />
						<div className='mb-3 flex items-center justify-between'>
							<div>
								<h2 className='text-base font-semibold'>More tools</h2>
								<p className='text-xs text-slate-500'>Provider settings and promotions</p>
							</div>
							<button
								type='button'
								onClick={() => setMoreOpen(false)}
								aria-label='Close more tools'
								className='flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100'
							>
								<X className='h-5 w-5' />
							</button>
						</div>
						<div className='space-y-2'>
							{secondaryItems.map((item) => {
								const Icon = item.icon
								return (
									<Link
										key={item.href}
										href={item.href}
										onClick={() => handleNavigate(item.href)}
										className='flex min-h-14 items-center gap-3 rounded-2xl border border-slate-200 px-4 text-sm font-medium text-slate-700'
									>
										<Icon className='h-5 w-5 text-emerald-700' />
										{item.label}
									</Link>
								)
							})}
							<AlertDialog open={signOutOpen} onOpenChange={setSignOutOpen}>
								<AlertDialogTrigger asChild>
									<button
										type='button'
										disabled={isSigningOut}
										className='flex min-h-14 w-full items-center gap-3 rounded-2xl border border-red-100 px-4 text-sm font-medium text-red-600 disabled:opacity-50'
									>
										{isSigningOut ? <Loader2 className='h-5 w-5 animate-spin' /> : <LogOut className='h-5 w-5' />}
										Sign out
									</button>
								</AlertDialogTrigger>
								<AlertDialogContent>
									<AlertDialogHeader>
										<AlertDialogTitle>Sign out</AlertDialogTitle>
										<AlertDialogDescription>
											Are you sure you want to sign out? You'll need to enter your email and code again to access the provider portal.
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter>
										<AlertDialogCancel disabled={isSigningOut}>Cancel</AlertDialogCancel>
										<AlertDialogAction onClick={handleSignOut} disabled={isSigningOut}>
											{isSigningOut ? 'Signing out...' : 'Sign out'}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</section>
				</div>
			)}
		</>
	)
}
