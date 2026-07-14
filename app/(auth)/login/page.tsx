'use client'

import React, { Suspense, useEffect, useRef, useState } from 'react'
import {
	CheckCircle2,
	Eye,
	EyeOff,
	Fingerprint,
	KeyRound,
	Loader2,
	LockKeyhole,
	ShieldCheck,
	Sparkles,
	User,
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

import { useAuth } from '@/lib/auth/hooks/use-auth'
import { useSession } from '@/components/providers/session'
import { useAuthStore } from '@/lib/store/auth'
import { ROLE_DASHBOARDS, normalizeUserRole } from '@/types/roles'

function Brand({ compact = false }: { compact?: boolean }) {
	return (
		<div
			className={
				compact
					? 'flex items-center justify-center gap-3'
					: 'flex items-center gap-3'
			}
		>
			<div className='relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-slate-950 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white'>
				<div
					aria-hidden='true'
					className='absolute inset-1 rounded-[0.8rem] bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600'
				/>
				<ShieldCheck className='relative h-5 w-5 text-white' />
				<span
					aria-hidden='true'
					className='absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_0_3px_rgba(255,255,255,0.18)]'
				/>
			</div>
			<div className='min-w-0'>
				<h1 className='truncate text-lg font-semibold text-slate-950 dark:text-white'>
					CognizApp
				</h1>
				<p className='truncate text-xs text-slate-500 dark:text-slate-400'>
					Research Integrity Platform
				</p>
			</div>
		</div>
	)
}

function SecurityVisual() {
	return (
		<div
			aria-hidden='true'
			className='relative mt-10 hidden h-[260px] w-full max-w-xl overflow-hidden rounded-[2rem] border border-slate-200/70 bg-white/65 p-6 shadow-[0_24px_80px_-44px_rgba(15,23,42,0.35)] backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.035] xl:block'
		>
			<div className='absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:34px_34px]' />
			<div className='absolute -right-20 -top-20 h-52 w-52 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/10' />
			<div className='absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/10' />

			<div className='relative flex h-full items-center justify-between gap-8'>
				<div className='relative flex h-40 w-40 shrink-0 items-center justify-center'>
					<div className='provider-login-orbit provider-login-orbit-slow absolute inset-0 rounded-full border border-dashed border-blue-300/70 dark:border-blue-400/30' />
					<div className='provider-login-orbit provider-login-orbit-reverse absolute inset-6 rounded-full border border-slate-300/80 dark:border-white/15' />
					<div className='provider-login-pulse absolute inset-12 rounded-full bg-blue-500/10 dark:bg-blue-400/10' />
					<div className='relative flex h-20 w-20 items-center justify-center rounded-[1.4rem] border border-white/90 bg-slate-950 text-white shadow-[0_18px_45px_-18px_rgba(15,23,42,0.75)] dark:border-white/10 dark:bg-white dark:text-slate-950'>
						<Fingerprint className='h-9 w-9' />
					</div>
					<div className='provider-login-float absolute -right-1 top-7 flex h-9 w-9 items-center justify-center rounded-xl border border-white bg-white text-blue-600 shadow-lg dark:border-white/10 dark:bg-slate-900 dark:text-blue-400'>
						<LockKeyhole className='h-4 w-4' />
					</div>
					<div className='provider-login-float-delayed absolute bottom-4 left-0 flex h-9 w-9 items-center justify-center rounded-xl border border-white bg-white text-emerald-600 shadow-lg dark:border-white/10 dark:bg-slate-900 dark:text-emerald-400'>
						<CheckCircle2 className='h-4 w-4' />
					</div>
				</div>

				<div className='min-w-0 flex-1 space-y-3'>
					<div className='rounded-2xl border border-slate-200/80 bg-white/80 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.04]'>
						<div className='flex items-center justify-between gap-3'>
							<div>
								<p className='text-sm font-medium text-slate-950 dark:text-white'>
									Protected provider workspace
								</p>
								<p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>
									Identity and session checks are active
								</p>
							</div>
							<span className='inline-flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
								<ShieldCheck className='h-4 w-4' />
							</span>
						</div>
					</div>

					<div className='grid grid-cols-2 gap-3'>
						<div className='rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.035]'>
							<p className='text-xs text-slate-500 dark:text-slate-400'>Session</p>
							<p className='mt-1 text-sm font-medium text-slate-950 dark:text-white'>
								Encrypted
							</p>
						</div>
						<div className='rounded-2xl border border-slate-200/80 bg-white/70 p-3 dark:border-white/10 dark:bg-white/[0.035]'>
							<p className='text-xs text-slate-500 dark:text-slate-400'>Access</p>
							<p className='mt-1 text-sm font-medium text-slate-950 dark:text-white'>
								Role based
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

function LoginCardSkeleton() {
	return (
		<section className='w-full max-w-none overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-4 font-sans shadow-[0_28px_80px_-38px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90 sm:max-w-lg sm:p-6 lg:p-7'>
			<div className='mb-5 lg:hidden'>
				<Brand compact />
			</div>
			<div className='mx-auto hidden h-14 w-14 items-center justify-center rounded-2xl bg-slate-950 text-white lg:flex dark:bg-white dark:text-slate-950'>
				<ShieldCheck className='h-7 w-7' />
			</div>
			<div className='text-center lg:mt-5'>
				<p className='text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400'>
					Secure access
				</p>
				<h2 className='mt-2 text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl'>
					Welcome back
				</h2>
				<p className='mx-auto mt-2 max-w-xs text-sm leading-6 text-slate-500 dark:text-slate-400'>
					Preparing secure sign in...
				</p>
			</div>
			<div className='mt-6 space-y-4'>
				<div className='provider-login-skeleton h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06]' />
				<div className='provider-login-skeleton h-12 rounded-2xl bg-slate-100 dark:bg-white/[0.06]' />
				<div className='provider-login-skeleton h-12 rounded-2xl bg-slate-200 dark:bg-white/[0.09]' />
			</div>
		</section>
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
				const roleDashboard =
					ROLE_DASHBOARDS[normalizeUserRole(authUser?.role)]
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
		return <LoginCardSkeleton />
	}

	return (
		<section className='relative w-full max-w-none overflow-hidden rounded-[1.75rem] border border-slate-200/80 bg-white/95 p-4 font-sans shadow-[0_28px_80px_-38px_rgba(15,23,42,0.35)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-950/90 sm:max-w-lg sm:p-6 lg:p-7'>
			<div
				aria-hidden='true'
				className='absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/70 to-transparent'
			/>
			<div
				aria-hidden='true'
				className='absolute -right-20 -top-20 h-48 w-48 rounded-full bg-blue-400/10 blur-3xl dark:bg-blue-500/10'
			/>

			<div className='relative'>
				<div className='mb-5 lg:hidden'>
					<Brand compact />
				</div>

				<div className='mx-auto hidden h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-white shadow-[0_14px_30px_-16px_rgba(15,23,42,0.75)] lg:flex dark:border-white/10 dark:bg-white dark:text-slate-950'>
					<ShieldCheck className='h-7 w-7' />
				</div>

				<div className='text-center lg:mt-5'>
					<p className='text-xs font-semibold uppercase text-emerald-700 dark:text-emerald-400'>
						Secure access
					</p>
					<h2 className='mt-2 text-2xl font-semibold text-slate-950 dark:text-white sm:text-3xl'>
						Provider sign in
					</h2>
					<p className='mx-auto mt-2 max-w-full text-sm leading-6 text-slate-500 dark:text-slate-400'>
						Sign in with your username and PIN. Your device is tracked for
						security.
					</p>
				</div>

				{error && (
					<div
						role='alert'
						aria-live='polite'
						className='mt-5 flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 shadow-sm dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300'
					>
						<span className='mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300'>
							<span className='h-1.5 w-1.5 rounded-full bg-current' />
						</span>
						<span>{error}</span>
					</div>
				)}

				<form className='mt-5 space-y-4' onSubmit={submitPin} aria-busy={isLoading}>
					<div className='space-y-2'>
						<label
							className='block text-sm font-medium text-slate-700 dark:text-slate-300'
							htmlFor='login-username'
						>
							Username
						</label>
						<div className='group flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/10'>
							<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-focus-within:bg-blue-500/10 group-focus-within:text-blue-600 dark:bg-white/[0.06] dark:text-slate-400 dark:group-focus-within:text-blue-400'>
								<User className='h-4 w-4' />
							</span>
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
								className='h-full min-w-0 flex-1 bg-transparent text-base text-slate-950 outline-none placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-600 sm:text-sm'
								style={{ fontSize: '16px' }}
							/>
						</div>
					</div>

					<div className='space-y-2'>
						<label
							className='block text-sm font-medium text-slate-700 dark:text-slate-300'
							htmlFor='login-pin'
						>
							PIN
						</label>
						<div
							className={`group flex h-12 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 shadow-sm transition-[border-color,box-shadow,background-color] duration-200 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/10 dark:border-white/10 dark:bg-white/[0.04] dark:focus-within:border-blue-400 dark:focus-within:ring-blue-400/10 ${shake ? 'animate-shake' : ''}`}
						>
							<span className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-focus-within:bg-blue-500/10 group-focus-within:text-blue-600 dark:bg-white/[0.06] dark:text-slate-400 dark:group-focus-within:text-blue-400'>
								<KeyRound className='h-4 w-4' />
							</span>
							<input
								id='login-pin'
								type={showPin ? 'text' : 'password'}
								value={pin}
								onChange={(event) => setPin(event.target.value)}
								placeholder='Enter your PIN'
								autoComplete='current-password'
								required
								maxLength={32}
								className='h-full min-w-0 flex-1 bg-transparent text-base tracking-wider text-slate-950 outline-none placeholder:tracking-normal placeholder:text-slate-400 dark:text-white dark:placeholder:text-slate-600 sm:text-sm'
								style={{ fontSize: '16px' }}
							/>
							<button
								type='button'
								onClick={() => setShowPin((value) => !value)}
								className='flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 dark:hover:bg-white/[0.06] dark:hover:text-white'
								aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
							>
								{showPin ? (
									<EyeOff className='h-4 w-4' />
								) : (
									<Eye className='h-4 w-4' />
								)}
							</button>
						</div>
					</div>

					<button
						type='submit'
						disabled={isLoading || username.trim().length < 3 || pin.length < 6}
						className='group relative flex h-12 w-full items-center justify-center overflow-hidden rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white shadow-[0_12px_24px_-14px_rgba(15,23,42,0.8)] transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-[0_16px_30px_-16px_rgba(15,23,42,0.85)] focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-100'
					>
						<span
							aria-hidden='true'
							className='absolute inset-y-0 -left-1/3 w-1/3 skew-x-[-20deg] bg-white/10 opacity-0 blur-sm transition-all duration-500 group-hover:left-[110%] group-hover:opacity-100 dark:bg-slate-950/5'
						/>
						<span className='relative inline-flex items-center gap-2'>
							{isLoading && <Loader2 className='h-4 w-4 animate-spin' />}
							{isLoading ? 'Signing in...' : 'Sign in'}
						</span>
					</button>

					<div className='rounded-2xl border border-slate-200/80 bg-slate-50/80 px-3 py-3 dark:border-white/10 dark:bg-white/[0.03]'>
						<div className='flex items-start gap-2.5'>
							<span className='mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'>
								<LockKeyhole className='h-3.5 w-3.5' />
							</span>
							<p className='text-xs leading-5 text-slate-500 dark:text-slate-400'>
								Your PIN is hashed with argon2id and never stored in plain text.
								Each sign-in is logged with your device, browser, and IP for your
								security.
							</p>
						</div>
					</div>
				</form>
			</div>
		</section>
	)
}

function DesktopHero() {
	return (
		<section className='hidden min-h-0 flex-col justify-center lg:flex'>
			<Brand />
			<div className='mt-10 max-w-xl'>
				<div className='inline-flex items-center gap-2 rounded-full border border-emerald-200/80 bg-white/70 px-3 py-1.5 text-sm font-medium text-emerald-700 shadow-sm backdrop-blur-xl dark:border-emerald-400/20 dark:bg-white/[0.04] dark:text-emerald-300'>
					<ShieldCheck className='h-4 w-4' />
					Secure PIN sign in
				</div>
				<h2 className='mt-5 text-5xl font-semibold leading-[1.03] text-slate-950 dark:text-white xl:text-6xl'>
					Your workspace,
					<span className='block bg-gradient-to-r from-blue-600 via-indigo-600 to-sky-500 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-sky-300'>
						one PIN away.
					</span>
				</h2>
				<p className='mt-4 max-w-lg text-base leading-7 text-slate-600 dark:text-slate-300 xl:text-lg'>
					Access citation checks, reference matching, and research support in a
					clean workspace.
				</p>
			</div>

			<SecurityVisual />
		</section>
	)
}

function LoginFallback() {
	return (
		<main className='flex min-h-[100svh] items-center justify-center overflow-hidden bg-slate-50 px-4 dark:bg-slate-950'>
			<div className='flex items-center gap-2 rounded-3xl border border-white/80 bg-white/85 p-5 text-sm text-slate-500 shadow-sm backdrop-blur-xl dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-400'>
				<Loader2 className='h-4 w-4 animate-spin' />
				Loading...
			</div>
		</main>
	)
}

function LoginPageContent() {
	return (
		<main className='relative min-h-[100svh] overflow-x-hidden bg-slate-50 font-sans text-slate-950 antialiased dark:bg-slate-950 dark:text-white lg:h-[100dvh] lg:overflow-hidden'>
			<div aria-hidden='true' className='pointer-events-none absolute inset-0'>
				<div className='absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.11),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(16,185,129,0.08),transparent_30%)] dark:bg-[radial-gradient(circle_at_18%_18%,rgba(59,130,246,0.12),transparent_28%),radial-gradient(circle_at_82%_78%,rgba(16,185,129,0.07),transparent_30%)]' />
				<div className='absolute inset-0 opacity-[0.035] dark:opacity-[0.07]'>
					<div className='absolute inset-0 bg-[linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] bg-[size:48px_48px]' />
				</div>
				<div className='provider-login-bubble absolute left-[8%] top-[14%] h-28 w-28 rounded-full border border-blue-300/25 bg-blue-400/5 blur-[0.5px] dark:border-blue-400/15 dark:bg-blue-400/5' />
				<div className='provider-login-bubble-delayed absolute bottom-[12%] right-[10%] h-40 w-40 rounded-full border border-emerald-300/20 bg-emerald-400/5 blur-[0.5px] dark:border-emerald-400/15 dark:bg-emerald-400/5' />
			</div>

			<div className='relative z-10 mx-auto grid min-h-[100svh] w-full max-w-7xl grid-cols-1 items-center gap-4 px-3 py-4 sm:px-5 sm:py-6 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-10 lg:px-10 lg:py-8 xl:grid-cols-[minmax(0,1fr)_460px] xl:gap-14 xl:px-14'>
				<DesktopHero />
				<section className='flex min-h-0 w-full items-center justify-center'>
					<LoginCard />
				</section>
			</div>

			<style jsx global>{`
				@keyframes provider-login-float {
					0%,
					100% {
						transform: translate3d(0, 0, 0);
					}
					50% {
						transform: translate3d(0, -7px, 0);
					}
				}

				@keyframes provider-login-bubble {
					0%,
					100% {
						transform: translate3d(0, 0, 0) scale(1);
					}
					50% {
						transform: translate3d(10px, -12px, 0) scale(1.04);
					}
				}

				@keyframes provider-login-orbit {
					to {
						transform: rotate(360deg);
					}
				}

				@keyframes provider-login-pulse {
					0%,
					100% {
						transform: scale(0.92);
						opacity: 0.55;
					}
					50% {
						transform: scale(1.08);
						opacity: 0.95;
					}
				}

				@keyframes provider-login-skeleton {
					0% {
						background-position: 200% 0;
					}
					100% {
						background-position: -200% 0;
					}
				}

				.provider-login-float {
					animation: provider-login-float 4.8s ease-in-out infinite;
				}

				.provider-login-float-delayed {
					animation: provider-login-float 5.4s ease-in-out 0.8s infinite;
				}

				.provider-login-bubble {
					animation: provider-login-bubble 10s ease-in-out infinite;
				}

				.provider-login-bubble-delayed {
					animation: provider-login-bubble 12s ease-in-out 1.5s infinite reverse;
				}

				.provider-login-orbit {
					will-change: transform;
				}

				.provider-login-orbit-slow {
					animation: provider-login-orbit 22s linear infinite;
				}

				.provider-login-orbit-reverse {
					animation: provider-login-orbit 15s linear infinite reverse;
				}

				.provider-login-pulse {
					animation: provider-login-pulse 3.2s ease-in-out infinite;
				}

				.provider-login-skeleton {
					background-image: linear-gradient(
						90deg,
						transparent,
						rgba(255, 255, 255, 0.65),
						transparent
					);
					background-size: 200% 100%;
					animation: provider-login-skeleton 1.7s linear infinite;
				}

				@media (prefers-reduced-motion: reduce) {
					.provider-login-float,
					.provider-login-float-delayed,
					.provider-login-bubble,
					.provider-login-bubble-delayed,
					.provider-login-orbit-slow,
					.provider-login-orbit-reverse,
					.provider-login-pulse,
					.provider-login-skeleton {
						animation: none !important;
					}
				}
			`}</style>
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

