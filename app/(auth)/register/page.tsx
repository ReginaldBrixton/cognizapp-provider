'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import Link from 'next/link'
import { AlertCircle, Loader2, Mail, ShieldCheck, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

import { useAuth } from '@/lib/auth/hooks/use-auth'
import { AuthCardModern } from '@/components/auth'

export default function RegisterPage() {
	const {
		loading,
		error,
		success,
		handleRequestOtp,
		handleResendOtp,
		handleVerifyOtp,
	} = useAuth()
	const [email, setEmail] = useState('')
	const [code, setCode] = useState('')
	const [codeSent, setCodeSent] = useState(false)
	const [cooldown, setCooldown] = useState(0)
	const [shake, setShake] = useState(false)
	const codeInputRef = useRef<HTMLInputElement>(null)
	const normalizedCode = useMemo(() => code.replace(/\D/g, '').slice(0, 6), [code])

	useEffect(() => {
		if (!cooldown) {
			return
		}
		const timer = window.setInterval(() => {
			setCooldown((value) => Math.max(value - 1, 0))
		}, 1000)
		return () => window.clearInterval(timer)
	}, [cooldown])

	async function submitEmail(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const nextCooldown = await handleRequestOtp(email)
		if (nextCooldown !== null) {
			setCodeSent(true)
			setCooldown(nextCooldown)
		}
	}

	async function submitCode(event: FormEvent<HTMLFormElement>) {
		event.preventDefault()
		const verified = await handleVerifyOtp(email, normalizedCode)
		if (!verified) {
			setCode('')
			setShake(true)
			setTimeout(() => setShake(false), 500)
			codeInputRef.current?.focus()
		}
	}

	async function resendCode() {
		const nextCooldown = await handleResendOtp(email)
		if (nextCooldown !== null) {
			setCooldown(nextCooldown)
		}
	}

	return (
		<div className='flex min-h-[100dvh] w-full items-center justify-center bg-zinc-50 px-4 py-8 transition-colors duration-300 dark:bg-[#0a0a0a] sm:px-6 lg:px-8'>
			<div className='w-full max-w-[440px]'>
				<AuthCardModern>
					<div className='mb-8 flex justify-center'>
						<Link href='/' className='flex items-center gap-2'>
							<div className='flex h-10 w-10 items-center justify-center rounded-xl bg-sage shadow-sm'>
								<Sparkles className='h-5 w-5 text-white' />
							</div>
							<span className='text-xl font-bold text-charcoal dark:text-cream'>
								CognizApp
							</span>
						</Link>
					</div>

					<div className='space-y-6'>
						<div className='space-y-2 text-center'>
							<div className='mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-sage/25 bg-sage/10 text-sage'>
								<ShieldCheck className='h-6 w-6' />
							</div>
							<h1 className='text-2xl font-semibold text-charcoal dark:text-cream'>
								Create your provider account
							</h1>
							<p className='text-sm leading-6 text-zinc-500 dark:text-zinc-400'>
								Use your authorized email to receive a secure one-time code.
							</p>
						</div>

						{error && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className='flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-200'
							>
								<AlertCircle className='h-4 w-4 flex-shrink-0' />
								<span>{error}</span>
							</motion.div>
						)}

						{success && (
							<motion.div
								initial={{ opacity: 0, y: -10 }}
								animate={{ opacity: 1, y: 0 }}
								className='rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:border-emerald-900/30 dark:bg-emerald-900/20 dark:text-emerald-200'
							>
								{success}
							</motion.div>
						)}

						{!codeSent ? (
							<form className='space-y-4' onSubmit={submitEmail}>
								<label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200' htmlFor='register-email'>
									Email
								</label>
								<div className='flex h-12 items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900'>
									<Mail className='h-4 w-4 text-zinc-400' />
									<input
										id='register-email'
										type='email'
										value={email}
										onChange={(event) => setEmail(event.target.value)}
										placeholder='you@example.com'
										autoComplete='email'
										required
										className='h-full min-w-0 flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400 dark:text-zinc-100'
									/>
								</div>
								<button
									type='submit'
									disabled={loading}
									className='flex w-full items-center justify-center gap-3 rounded-lg bg-sage px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sage/90 disabled:cursor-not-allowed disabled:opacity-50'
								>
									{loading && <Loader2 className='h-5 w-5 animate-spin' />}
									<span>{loading ? 'Sending...' : 'Send code'}</span>
								</button>
							</form>
						) : (
							<form className='space-y-4' onSubmit={submitCode}>
								<label className='block text-sm font-medium text-zinc-700 dark:text-zinc-200' htmlFor='register-code'>
									Code
								</label>
								<input
									ref={codeInputRef}
									id='register-code'
									inputMode='numeric'
									value={normalizedCode}
									onChange={(event) => setCode(event.target.value)}
									placeholder='000000'
									autoComplete='one-time-code'
									required
									className={`h-14 w-full rounded-lg border border-zinc-200 bg-white px-4 text-center font-mono text-2xl tracking-[0.35em] text-zinc-900 outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 ${shake ? 'animate-shake' : ''}`}
								/>
								<button
									type='submit'
									disabled={loading || normalizedCode.length !== 6}
									className='flex w-full items-center justify-center gap-3 rounded-lg bg-sage px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-sage/90 disabled:cursor-not-allowed disabled:opacity-50'
								>
									{loading && <Loader2 className='h-5 w-5 animate-spin' />}
									<span>{loading ? 'Verifying...' : 'Verify and continue'}</span>
								</button>
								<button
									type='button'
									onClick={resendCode}
									disabled={loading || cooldown > 0}
									className='w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 shadow-sm transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100'
								>
									{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
								</button>
							</form>
						)}

						<p className='text-center text-xs leading-5 text-zinc-500 dark:text-zinc-400'>
							By continuing, you agree to the CognizApp{' '}
							<Link href='/terms' className='font-medium text-sage hover:underline'>
								Terms
							</Link>{' '}
							and{' '}
							<Link href='/privacy' className='font-medium text-sage hover:underline'>
								Privacy Policy
							</Link>
							.
						</p>

						<div className='text-center text-sm text-zinc-500 dark:text-zinc-400'>
							Already have an account?{' '}
							<Link href='/login' className='font-semibold text-sage hover:underline'>
								Sign in with email
							</Link>
						</div>
					</div>
				</AuthCardModern>
			</div>
		</div>
	)
}
