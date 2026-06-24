'use client'

import { useCallback, useState } from 'react'
import {
	BadgePercent,
	Calendar,
	ChevronDown,
	ChevronUp,
	Copy,
	Edit3,
	Hash,
	Loader2,
	Percent,
	Plus,
	Save,
	Trash2,
	Users,
	X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { DiscountCodeRow } from './types'

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmtDate(v?: string) {
	if (!v) return 'No expiry'
	const d = new Date(v)
	if (Number.isNaN(d.getTime())) return 'No expiry'
	return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(d)
}

function dateInputValue(v?: string) {
	if (!v) return ''
	const d = new Date(v)
	if (Number.isNaN(d.getTime())) return ''
	return d.toISOString().slice(0, 10)
}

function isExpired(v?: string) {
	if (!v) return false
	return new Date(v).getTime() < Date.now()
}

function isExhausted(code: DiscountCodeRow) {
	if (!code.maxRedemptions) return false
	return (code.redemptionCount ?? 0) >= code.maxRedemptions
}

function statusConfig(code: DiscountCodeRow) {
	if (isExpired(code.expiresAt)) return { dot: 'bg-slate-400', label: 'Expired', text: 'text-slate-500' }
	if (isExhausted(code)) return { dot: 'bg-red-400', label: 'Used up', text: 'text-red-600' }
	if (code.status === 'inactive') return { dot: 'bg-slate-400', label: 'Inactive', text: 'text-slate-500' }
	return { dot: 'bg-emerald-500', label: 'Active', text: 'text-emerald-700' }
}

function genTempId() {
	return `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

// ─── main page component ──────────────────────────────────────────────────────

export function DiscountCodesPage({ initialCodes }: { initialCodes: DiscountCodeRow[] }) {
	const [codes, setCodes] = useState<DiscountCodeRow[]>(initialCodes)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const [busyId, setBusyId] = useState<string | null>(null)

	// ── creator state ──
	const [label, setLabel] = useState('')
	const [discountPercent, setDiscountPercent] = useState('10')
	const [maxRedemptions, setMaxRedemptions] = useState('1')
	const [expiresAt, setExpiresAt] = useState('')
	const [creating, setCreating] = useState(false)

	const updateCode = useCallback((id: string, patch: Partial<DiscountCodeRow>) => {
		setCodes((c) => c.map((row) => row.id === id ? { ...row, ...patch } : row))
	}, [])

	// ── create (optimistic) ───────────────────────────────────────────────────

	const handleCreate = async () => {
		if (!label.trim()) { toast.error('Label is required'); return }
		const pct = Number(discountPercent)
		// Allow 1–100%: providers can give 100% discount (free)
		if (!Number.isFinite(pct) || pct < 1 || pct > 100) { toast.error('Discount must be 1–100%'); return }
		const uses = Math.max(1, Number(maxRedemptions) || 1)

		// Optimistic entry — shown immediately while API is in flight
		const tempId = genTempId()
		const optimistic: DiscountCodeRow = {
			id: tempId,
			code: '…',
			label: label.trim(),
			discountPercent: pct,
			maxRedemptions: uses,
			redemptionCount: 0,
			status: 'active',
			expiresAt: expiresAt || undefined,
			redemptions: [],
		}
		setCodes((c) => [optimistic, ...c])

		// Clear form instantly
		const prevLabel = label
		const prevPct = discountPercent
		const prevUses = maxRedemptions
		const prevExpiry = expiresAt
		setLabel('')
		setDiscountPercent('10')
		setMaxRedemptions('1')
		setExpiresAt('')
		setCreating(true)

		try {
			const res = await fetch('/api/support/provider/discount-codes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					label: prevLabel.trim(),
					discountPercent: pct,
					maxRedemptions: uses,
					expiresAt: prevExpiry || undefined,
				}),
			})
			const payload = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(payload?.error || 'Could not create code')

			// Replace temp entry with real data
			const real = payload?.data as DiscountCodeRow | undefined
			if (real?.id) {
				setCodes((c) => c.map((row) => row.id === tempId ? { ...real, redemptions: [] } : row))
				toast.success(`Code ${real.code} created`)
			} else {
				// Fallback: remove temp and refetch won't happen (just leave it stale)
				setCodes((c) => c.filter((row) => row.id !== tempId))
				toast.success('Code created')
			}
		} catch (err) {
			// Revert optimistic entry and restore form
			setCodes((c) => c.filter((row) => row.id !== tempId))
			setLabel(prevLabel)
			setDiscountPercent(prevPct)
			setMaxRedemptions(prevUses)
			setExpiresAt(prevExpiry)
			toast.error(err instanceof Error ? err.message : 'Could not create code')
		} finally {
			setCreating(false)
		}
	}

	// ── save edit ─────────────────────────────────────────────────────────────

	const handleSave = async (code: DiscountCodeRow) => {
		setBusyId(code.id)
		try {
			const res = await fetch(`/api/support/provider/discount-codes/${code.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					label: code.label,
					discountPercent: Number(code.discountPercent),
					maxRedemptions: Number(code.maxRedemptions),
					expiresAt: code.expiresAt || undefined,
					status: code.status,
				}),
			})
			const payload = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(payload?.error || 'Could not update code')
			toast.success('Code updated')
			setEditingId(null)
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not update code')
		} finally {
			setBusyId(null)
		}
	}

	// ── delete (optimistic) ───────────────────────────────────────────────────

	const handleDelete = async (id: string) => {
		const snapshot = codes.find((c) => c.id === id)
		// Optimistic removal
		setCodes((c) => c.filter((row) => row.id !== id))
		setBusyId(id)
		try {
			const res = await fetch(`/api/support/provider/discount-codes/${id}`, { method: 'DELETE' })
			const payload = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(payload?.error || 'Could not delete code')
			toast.success('Code removed')
		} catch (err) {
			// Revert
			if (snapshot) setCodes((c) => [...c, snapshot])
			toast.error(err instanceof Error ? err.message : 'Could not delete code')
		} finally {
			setBusyId(null)
		}
	}

	return (
		<div className='h-full min-h-0 w-full overflow-x-hidden overflow-y-auto'>
			<div className='mx-auto flex min-h-full w-full max-w-screen-2xl flex-col gap-3 px-3 py-3 sm:px-5 sm:py-4 lg:gap-4 lg:px-8 lg:py-6'>
				<div className='min-w-0'>
					<h1 className='text-lg font-semibold tracking-tight text-slate-900 lg:text-2xl'>Discount Codes</h1>
					<p className='text-[12px] text-slate-500 lg:text-sm'>Create promo codes up to 100% off.</p>
				</div>

				<div className='grid min-w-0 gap-3 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] lg:items-start'>

			{/* Creator card */}
			<div className='min-w-0 rounded-provider-card border border-slate-200 bg-white p-2.5 shadow-sm lg:rounded-xl lg:p-4'>
				<p className='mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:mb-3'>New code</p>

				{/* Label — full width */}
				<div className='mb-2'>
					<label className='mb-1 block text-[11px] font-medium text-slate-500'>Label</label>
					<Input
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder='e.g. Welcome10'
						className='h-8 text-[13px] lg:h-9'
						onKeyDown={(e) => { if (e.key === 'Enter') void handleCreate() }}
					/>
				</div>

				{/* Three fields in a row */}
				<div className='mb-2 grid min-w-0 grid-cols-[minmax(0,0.8fr)_minmax(0,0.62fr)_minmax(0,1fr)] gap-1.5 sm:gap-2 lg:mb-3'>
					<div>
						<label className='mb-1 flex items-center gap-1 truncate text-[10px] font-medium text-slate-500 sm:text-[11px]'>
							<Percent className='h-3 w-3 shrink-0' /> %
						</label>
						<div className='relative'>
							<Input
								value={discountPercent}
								onChange={(e) => setDiscountPercent(e.target.value)}
								type='number'
								min='1'
								max='100'
								className='h-8 pr-6 text-[13px] lg:h-9'
							/>
							<span className='absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-400'>%</span>
						</div>
					</div>
					<div>
						<label className='mb-1 flex items-center gap-1 truncate text-[10px] font-medium text-slate-500 sm:text-[11px]'>
							<Hash className='h-3 w-3 shrink-0' /> Uses
						</label>
						<Input
							value={maxRedemptions}
							onChange={(e) => setMaxRedemptions(e.target.value)}
							type='number'
							min='1'
							className='h-8 text-[13px] lg:h-9'
						/>
					</div>
					<div>
						<label className='mb-1 flex items-center gap-1 truncate text-[10px] font-medium text-slate-500 sm:text-[11px]'>
							<Calendar className='h-3 w-3 shrink-0' /> Expiry
						</label>
						<Input
							value={expiresAt}
							onChange={(e) => setExpiresAt(e.target.value)}
							type='date'
							className='h-8 text-[11px] lg:h-9'
						/>
					</div>
				</div>

				<Button
					onClick={handleCreate}
					disabled={creating || !label.trim()}
					className='h-8 w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 lg:h-9'
					size='sm'
				>
					{creating ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Plus className='h-3.5 w-3.5' />}
					{creating ? 'Creating…' : 'Create code'}
				</Button>
			</div>

			{/* Code list */}
			{codes.length === 0 ? (
				<div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white py-14 text-center'>
					<BadgePercent className='mb-2.5 h-9 w-9 text-slate-300' />
					<p className='text-[13px] font-semibold text-slate-700'>No discount codes yet</p>
					<p className='mt-1 text-[12px] text-slate-400'>Create your first promo code above</p>
				</div>
			) : (
				<div className='space-y-2 pb-3 lg:pb-4'>
					{codes.map((code) => {
						const isTemp = code.id.startsWith('temp_')
						const editing = editingId === code.id && !isTemp
						const busy = busyId === code.id
						const expanded = expandedId === code.id
						const sc = statusConfig(code)
						const usageRatio = code.maxRedemptions ? Math.min((code.redemptionCount ?? 0) / code.maxRedemptions, 1) : 0
						const hasRedemptions = (code.redemptions?.length ?? 0) > 0

						return (
							<div
								key={code.id}
								className={cn(
									'overflow-hidden rounded-provider-card border bg-white shadow-sm transition-all lg:rounded-xl',
									isTemp ? 'border-slate-200 opacity-70' : 'border-slate-200',
								)}
							>
								{/* Main row */}
								<div className='flex items-center gap-2.5 p-2.5 sm:gap-3 sm:p-3'>
									{/* % badge */}
									<div className='flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 sm:h-11 sm:w-11'>
										<span className='text-[13px] font-bold leading-none text-emerald-700 sm:text-[14px]'>
											{Number(code.discountPercent ?? 0)}%
										</span>
										<span className='mt-0.5 text-[8px] uppercase leading-none tracking-wide text-emerald-500 sm:text-[9px]'>off</span>
									</div>

									{/* Info */}
									<div className='min-w-0 flex-1'>
										{editing ? (
											<Input
												value={code.label ?? ''}
												onChange={(e) => updateCode(code.id, { label: e.target.value })}
												className='mb-1 h-7 text-[13px] font-semibold'
												autoFocus
											/>
										) : (
											<p className='truncate text-[12px] font-semibold text-slate-900 sm:text-[13px]'>
												{code.label || code.code}
												{isTemp && <span className='ml-1.5 text-[10px] text-slate-400'>saving…</span>}
											</p>
										)}
										<div className='mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:gap-x-2'>
											{!isTemp && (
												<button
													type='button'
													onClick={() => { navigator.clipboard?.writeText(code.code); toast.success('Copied!') }}
													className='flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 transition hover:bg-slate-200'
													title='Copy code'
												>
													<Copy className='h-2.5 w-2.5' /> {code.code}
												</button>
											)}
											<span className='flex items-center gap-1 text-[11px] font-medium'>
												<span className={cn('h-1.5 w-1.5 rounded-full', sc.dot)} />
												<span className={sc.text}>{sc.label}</span>
											</span>
										</div>
									</div>

									{/* Usage meter (hidden on smallest screens) */}
									<div className='hidden shrink-0 flex-col items-end gap-1.5 xs:flex sm:flex'>
										<p className='text-[11px] text-slate-500'>
											<span className='font-semibold text-slate-800'>{code.redemptionCount ?? 0}</span>
											/{code.maxRedemptions ?? '∞'}
										</p>
										<div className='h-1 w-16 overflow-hidden rounded-full bg-slate-100'>
											<div
												className='h-full rounded-full bg-emerald-500 transition-all duration-500'
												style={{ width: `${usageRatio * 100}%` }}
											/>
										</div>
									</div>

									{/* Expiry (desktop only) */}
									<div className='hidden shrink-0 text-right lg:block'>
										{editing ? (
											<input
												type='date'
												value={dateInputValue(code.expiresAt)}
												onChange={(e) => updateCode(code.id, { expiresAt: e.target.value })}
												className='h-7 rounded-md border border-slate-200 px-2 text-[11px]'
											/>
										) : (
											<p className={cn('text-[11px]', isExpired(code.expiresAt) ? 'font-medium text-red-500' : 'text-slate-400')}>
												{fmtDate(code.expiresAt)}
											</p>
										)}
									</div>

									{/* Actions */}
									{!isTemp && (
										<div className='flex shrink-0 items-center gap-0.5'>
											{editing ? (
												<>
													<IconBtn
														icon={busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Save className='h-3.5 w-3.5' />}
														onClick={() => void handleSave(code)}
														disabled={busy}
														title='Save'
														className='text-emerald-600 hover:bg-emerald-50'
													/>
													<IconBtn
														icon={<X className='h-3.5 w-3.5' />}
														onClick={() => setEditingId(null)}
														title='Cancel'
													/>
												</>
											) : (
												<>
													<IconBtn
														icon={<Edit3 className='h-3.5 w-3.5' />}
														onClick={() => setEditingId(code.id)}
														title='Edit'
													/>
													<IconBtn
														icon={busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Trash2 className='h-3.5 w-3.5' />}
														onClick={() => void handleDelete(code.id)}
														disabled={busy}
														title='Delete'
														className='text-red-400 hover:bg-red-50 hover:text-red-600'
													/>
													{hasRedemptions && (
														<IconBtn
															icon={expanded ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
															onClick={() => setExpandedId(expanded ? null : code.id)}
															title='View redemptions'
														/>
													)}
												</>
											)}
										</div>
									)}
								</div>

								{/* Edit fields */}
								{editing && (
									<div className='grid grid-cols-2 gap-2 border-t border-slate-100 px-3 pb-3 pt-2 sm:grid-cols-4'>
										<div>
											<p className='mb-1 text-[10px] font-medium text-slate-500'>Discount %</p>
											<Input
												type='number'
												min='1'
												max='100'
												value={String(code.discountPercent ?? 0)}
												onChange={(e) => updateCode(code.id, { discountPercent: Number(e.target.value) })}
												className='h-7 text-[13px]'
											/>
										</div>
										<div>
											<p className='mb-1 text-[10px] font-medium text-slate-500'>Max uses</p>
											<Input
												type='number'
												min='1'
												value={String(code.maxRedemptions ?? 1)}
												onChange={(e) => updateCode(code.id, { maxRedemptions: Number(e.target.value) })}
												className='h-7 text-[13px]'
											/>
										</div>
										<div className='col-span-2'>
											<p className='mb-1 text-[10px] font-medium text-slate-500'>Status</p>
											<select
												value={code.status ?? 'active'}
												onChange={(e) => updateCode(code.id, { status: e.target.value })}
												className='h-7 w-full rounded-md border border-slate-200 px-2 text-[13px]'
											>
												<option value='active'>Active</option>
												<option value='inactive'>Inactive</option>
											</select>
										</div>
									</div>
								)}

								{/* Redemptions panel */}
								{expanded && hasRedemptions && (
									<div className='border-t border-slate-100 px-3 pb-3 pt-2'>
										<p className='mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600'>
											<Users className='h-3 w-3' />
											{code.redemptions!.length} redemption{code.redemptions!.length !== 1 ? 's' : ''}
										</p>
										<div className='space-y-1'>
											{code.redemptions!.map((r) => (
												<div
													key={r.id}
													className='flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[12px]'
												>
													<span className='truncate font-medium text-slate-700'>
														{r.fullName || r.email || 'Client'}
													</span>
													<div className='flex shrink-0 items-center gap-2'>
														<span className='rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700'>
															-GHS {Number(r.discountAmount ?? 0).toLocaleString()}
														</span>
														{r.redeemedAt && (
															<span className='text-[10px] text-slate-400'>{fmtDate(r.redeemedAt)}</span>
														)}
													</div>
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)
					})}
				</div>
			)}
		</div>
		</div>
		</div>
	)
}

function IconBtn({
	icon,
	onClick,
	disabled,
	title,
	className,
}: {
	icon: React.ReactNode
	onClick: () => void
	disabled?: boolean
	title: string
	className?: string
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			disabled={disabled}
			title={title}
			className={cn(
				'flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:pointer-events-none disabled:opacity-40',
				className,
			)}
		>
			{icon}
		</button>
	)
}
