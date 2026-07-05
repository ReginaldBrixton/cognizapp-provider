'use client'

import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, KeyRound, ShieldCheck, Sparkles, User } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useAuth } from '@/lib/auth/hooks/use-auth'
import { useSession } from '@/components/providers/session'
import { useAuthStore } from '@/lib/store/auth'
import { ROLE_DASHBOARDS, normalizeUserRole } from '@/types/roles'

function Brand({ compact = false }: { compact?: boolean }) {
	return (
		<div className={compact ? 'flex items-center justify-center gap-3' : 'flex items-center gap-3'}>
			<div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm'>
				<Sparkles className='h-5 w-5' />
			</div>
			<div className='min-w-0'>
				<h1 className='truncate text-lg font-semibold text-slate-950'>CognizApp</h1>
				<p className='truncate text-xs text-slate-500'>Research Integrity Platform</p>
			</div>
		</div>
	)
}

function LoginCard() {
	const { loading, error, handlePinLogin } = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const { data: session, status } = useSession()
	const authUser = useAuthStore((state) => state.user)
	const [username, setUsername] = useState('')
	const [pin, setPin] = useState('')
	const [showPin, setShowPin] = useState(false)
	const [hasMounted, setHasMounted] = useState(false)
	const [shake, setShake] = useState(false)
	const usernameInputRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		setHasMounted(true)
	}, [])

	useEffect(() => {
		if (status === 'authenticated' && session) {
			const redirectTo =
				searchParams.get('redirectTo') ||
				ROLE_DASHBOARDS[normalizeUserRole(authUser?.role)] ||
				'/login'

			const currentPath = window.location.pathname
			if (redirectTo === '/login' || redirectTo === currentPath) {
				const roleDashboard = ROLE_DASHBOARDS[normalizeUserRole(authUser?.role)]
				if (roleDashboard && roleDashboard !== '/login') {
					router.replace(roleDashboard)
				} else {
					router.replace('/')
				}
			} else {
				router.replace(redirectTo)
			}
		}
	}, [status, session, router, searchParams, authUser?.role])

	const isLoading = loading || (hasMounted && status === 'authenticated')

	async function submitPin(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const ok = await handlePinLogin(username, pin)
		if (!ok) {
			setPin('')
			setShake(true)
			setTimeout(() => setShake(false), 500)
			usernameInputRef.current?.focus()
		}
	}

	if (!hasMounted) {
		return (
			<section className='w-full max-w-none rounded-[1.25rem] border border-white/80 bg-white/90 p-4 font-sans shadow-xl shadow-slate-950/10 backdrop-blur-2xl sm:max-w-lg sm:p-6 lg:p-7'>
				<div className='mb-5 lg:hidden'>
					<Brand compact />
				</div>
				<div className='mx-auto hidden h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white lg:flex'>
					<ShieldCheck className='h-7 w-7' />
				</div>
				<div className='text-center lg:mt-5'>
					<p className='text-xs font-semibold uppercase text-emerald-700'>Secure access</p>
					<h2 className='mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl'>
						Welcome back
					</h2>
					<p className='mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500'>
						Preparing secure sign in...
					</p>
				</div>
				<div className='mt-5 h-12 rounded-2xl bg-slate-100' />
				<div className='mt-4 h-12 rounded-2xl bg-slate-100' />
				<div className='mt-4 h-12 rounded-2xl bg-slate-200' />
			</section>
		)
	}

	return (
		<section className='w-full max-w-none rounded-[1.25rem] border border-white/80 bg-white/90 p-4 font-sans shadow-xl shadow-slate-950/10 backdrop-blur-2xl sm:max-w-lg sm:p-6 lg:p-7'>
			<div className='mb-5 lg:hidden'>
				<Brand compact />
			</div>

			<div className='mx-auto hidden h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white lg:flex'>
				<ShieldCheck className='h-7 w-7' />
			</div>

			<div className='text-center lg:mt-5'>
				<p className='text-xs font-semibold uppercase text-emerald-700'>Secure access</p>
				<h2 className='mt-2 text-2xl font-semibold text-slate-950 sm:text-3xl'>
					Provider sign in
				</h2>
				<p className='mx-auto mt-2 max-w-full text-sm leading-6 text-slate-500'>
					Sign in with your username and PIN. Your device is tracked for security.
				</p>
			</div>

			{error && (
				<div className='mt-5 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600'>
					{error}
				</div>
			)}

			<form className='mt-5 space-y-4' onSubmit={submitPin}>
				<div className='space-y-2'>
					<label className='block text-sm font-medium text-slate-700' htmlFor='login-username'>
						Username
					</label>
					<div className='flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-slate-400'>
						<User className='h-4 w-4 text-slate-400' />
						<input
							ref={usernameInputRef}
							id='login-username'
							type='text'
							value={username}
							onChange={(event) => setUsername(event.target.value)}
							placeholder='your.username'
							autoComplete='username'
							autoCapitalize='none'
							autoCorrect='off'
							spellCheck={false}
							required
							maxLength={64}
							className='h-full min-w-0 flex-1 bg-transparent text-base sm:text-sm text-slate-950 outline-none placeholder:text-slate-400'
							style={{ fontSize: '16px' }}
						/>
					</div>
				</div>

				<div className='space-y-2'>
					<label className='block text-sm font-medium text-slate-700' htmlFor='login-pin'>
						PIN
					</label>
					<div
						className={`flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 shadow-sm focus-within:border-slate-400 ${shake ? 'animate-shake' : ''}`}
					>
						<KeyRound className='h-4 w-4 text-slate-400' />
						<input
							id='login-pin'
							type={showPin ? 'text' : 'password'}
							value={pin}
							onChange={(event) => setPin(event.target.value)}
							placeholder='Enter your PIN'
							autoComplete='current-password'
							required
							maxLength={32}
							className='h-full min-w-0 flex-1 bg-transparent text-base sm:text-sm tracking-wider text-slate-950 outline-none placeholder:tracking-normal placeholder:text-slate-400'
							style={{ fontSize: '16px' }}
						/>
						<button
							type='button'
							onClick={() => setShowPin((value) => !value)}
							className='text-slate-400 transition hover:text-slate-700'
							aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
							tabIndex={-1}
						>
							{showPin ? <EyeOff className='h-4 w-4' /> : <Eye className='h-4 w-4' />}
						</button>
					</div>
				</div>

				<button
					type='submit'
					disabled={isLoading || username.trim().length < 3 || pin.length < 6}
					className='flex h-12 w-full items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70'
				>
					{isLoading ? 'Signing in...' : 'Sign in'}
				</button>
				<p className='text-center text-xs leading-5 text-slate-500'>
					Your PIN is hashed with argon2id and never stored in plain text. Each
					sign-in is logged with your device, browser, and IP for your security.
				</p>
			</form>
		</section>
	)
}

function DesktopHero() {
	return (
		<section className='hidden min-h-0 flex-col justify-center lg:flex'>
			<Brand />
			<div className='mt-10 max-w-xl'>
				<div className='inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur-xl'>
					<ShieldCheck className='h-4 w-4' />
					Secure PIN sign in
				</div>
				<h2 className='mt-5 text-5xl font-semibold leading-[1.03] text-slate-950 xl:text-6xl'>
					Your workspace, one PIN away.
				</h2>
				<p className='mt-4 max-w-lg text-base leading-7 text-slate-600 xl:text-lg'>
					Access citation checks, reference matching, and research support in a clean workspace.
				</p>
			</div>
		</section>
	)
}

function LoginFallback() {
	return (
		<main className='flex h-[100dvh] min-h-[100svh] items-center justify-center bg-slate-50 px-4'>
			<div className='rounded-3xl border border-white/80 bg-white/85 p-5 text-sm text-slate-500 shadow-sm backdrop-blur-xl'>
				Loading...
			</div>
		</main>
	)
}

function LoginPageContent() {
	return (
		<main className='relative h-[100dvh] min-h-[100svh] overflow-hidden bg-slate-50 font-sans text-slate-950 antialiased'>
			<div className='relative z-10 mx-auto grid h-full w-full max-w-none grid-cols-1 items-center gap-4 px-2 py-2 sm:max-w-6xl sm:px-4 sm:py-4 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8 lg:gap-8'>
				<DesktopHero />
				<section className='flex min-h-0 w-full items-center justify-center px-1 sm:px-0'>
					<LoginCard />
				</section>
			</div>
		</main>
	)
}

export default function CognizAppAuthPages() {
	return (
		<Suspense fallback={<LoginFallback />}>
			<LoginPageContent />
		</Suspense>
	)
}
