'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Edit3, Loader2, Save, Trash2, Users, X, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type DiscountCodeRow = {
	id: string
	code: string
	label?: string
	discountPercent?: number
	maxRedemptions?: number
	redemptionCount?: number
	status?: string
	expiresAt?: string
	redemptions?: Array<{
		id: string
		email?: string
		fullName?: string
		finalAmount?: number
		discountAmount?: number
		redeemedAt?: string
		status?: string
	}>
}

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
	return d.toISOString().slice(0, 16)
}

function isExpired(v?: string) {
	if (!v) return false
	return new Date(v).getTime() < Date.now()
}

function statusColor(status?: string, expiresAt?: string) {
	if (isExpired(expiresAt)) return { dot: 'bg-slate-400', label: 'expired', text: 'text-slate-500' }
	switch (status) {
		case 'active': return { dot: 'bg-emerald-500', label: 'active', text: 'text-emerald-700' }
		case 'inactive': return { dot: 'bg-slate-400', label: 'inactive', text: 'text-slate-500' }
		default: return { dot: 'bg-emerald-500', label: 'active', text: 'text-emerald-700' }
	}
}

export function DiscountCodesManager({ initialCodes }: { initialCodes: DiscountCodeRow[] }) {
	const router = useRouter()
	const [codes, setCodes] = useState(initialCodes)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const [busyId, setBusyId] = useState<string | null>(null)

	const update = (id: string, patch: Partial<DiscountCodeRow>) =>
		setCodes((c) => c.map((row) => row.id === id ? { ...row, ...patch } : row))

	const save = async (code: DiscountCodeRow) => {
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
			router.refresh()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not update code')
		} finally {
			setBusyId(null)
		}
	}

	const remove = async (id: string) => {
		setBusyId(id)
		try {
			const res = await fetch(`/api/support/provider/discount-codes/${id}`, { method: 'DELETE' })
			const payload = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(payload?.error || 'Could not delete code')
			setCodes((c) => c.filter((row) => row.id !== id))
			toast.success('Code removed')
			router.refresh()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not delete code')
		} finally {
			setBusyId(null)
		}
	}

	if (codes.length === 0) return null

	return (
		<div className='space-y-2'>
			{codes.map((code) => {
				const editing = editingId === code.id
				const busy = busyId === code.id
				const expanded = expandedId === code.id
				const sc = statusColor(code.status, code.expiresAt)
				const usageRatio = code.maxRedemptions ? (code.redemptionCount ?? 0) / code.maxRedemptions : 0

				return (
					<div key={code.id} className='overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'>
						{/* Main row */}
						<div className='flex items-center gap-3 p-3'>
							{/* Discount badge */}
							<div className='flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50'>
								<span className='text-[15px] font-bold text-emerald-700 leading-none'>{Number(code.discountPercent ?? 0)}%</span>
								<span className='text-[9px] font-medium text-emerald-500 uppercase tracking-wide leading-none mt-0.5'>off</span>
							</div>

							{/* Info */}
							<div className='min-w-0 flex-1'>
								{editing ? (
									<Input
										value={code.label ?? ''}
										onChange={(e) => update(code.id, { label: e.target.value })}
										className='h-7 text-[13px] font-semibold mb-1'
										autoFocus
									/>
								) : (
									<p className='truncate text-[13px] font-semibold text-slate-900'>{code.label || code.code}</p>
								)}
								<div className='flex flex-wrap items-center gap-x-2 gap-y-1 mt-1'>
									{/* Copy code */}
									<button
										type='button'
										onClick={() => { navigator.clipboard?.writeText(code.code); toast.success('Copied!') }}
										className='flex items-center gap-1 rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-700 transition hover:bg-slate-200'
										title='Click to copy'
									>
										<Copy className='h-2.5 w-2.5' /> {code.code}
									</button>
									{/* Status */}
									<span className='flex items-center gap-1 text-[11px] font-medium'>
										<span className={`h-1.5 w-1.5 rounded-full ${sc.dot}`} />
										<span className={sc.text}>{sc.label}</span>
									</span>
								</div>
							</div>

							{/* Usage */}
							<div className='hidden shrink-0 flex-col items-end gap-1 sm:flex'>
								<p className='text-[11px] text-slate-500'>
									<span className='font-semibold text-slate-800'>{code.redemptionCount ?? 0}</span>/{code.maxRedemptions ?? '∞'} used
								</p>
								<div className='h-1 w-20 overflow-hidden rounded-full bg-slate-100'>
									<div
										className='h-full rounded-full bg-emerald-500 transition-all'
										style={{ width: `${Math.min(usageRatio * 100, 100)}%` }}
									/>
								</div>
							</div>

							{/* Expiry */}
							<div className='hidden shrink-0 text-right md:block'>
								{editing ? (
									<input
										type='datetime-local'
										value={dateInputValue(code.expiresAt)}
										onChange={(e) => update(code.id, { expiresAt: e.target.value })}
										className='h-7 rounded-md border border-slate-200 px-2 text-[12px]'
									/>
								) : (
									<p className={cn('text-[11px]', isExpired(code.expiresAt) ? 'font-medium text-red-500' : 'text-slate-500')}>
										{fmtDate(code.expiresAt)}
									</p>
								)}
							</div>

							{/* Actions */}
							<div className='flex shrink-0 items-center gap-1'>
								{editing ? (
									<>
										<button type='button' onClick={() => save(code)} disabled={busy} className='flex h-7 w-7 items-center justify-center rounded-md text-emerald-600 hover:bg-emerald-50 disabled:opacity-50' title='Save'>
											{busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Save className='h-3.5 w-3.5' />}
										</button>
										<button type='button' onClick={() => setEditingId(null)} className='flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100' title='Cancel'>
											<X className='h-3.5 w-3.5' />
										</button>
									</>
								) : (
									<>
										<button type='button' onClick={() => setEditingId(code.id)} className='flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700' title='Edit'>
											<Edit3 className='h-3.5 w-3.5' />
										</button>
										<button type='button' onClick={() => remove(code.id)} disabled={busy} className='flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50' title='Delete'>
											{busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Trash2 className='h-3.5 w-3.5' />}
										</button>
										{(code.redemptions?.length ?? 0) > 0 && (
											<button
												type='button'
												onClick={() => setExpandedId(expanded ? null : code.id)}
												className='flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100'
												title='View redemptions'
											>
												{expanded ? <ChevronUp className='h-3.5 w-3.5' /> : <ChevronDown className='h-3.5 w-3.5' />}
											</button>
										)}
									</>
								)}
							</div>
						</div>

						{/* Edit row (discount %, uses) when editing */}
						{editing && (
							<div className='grid grid-cols-2 gap-2 border-t border-slate-100 px-3 pb-3 pt-2 sm:grid-cols-4'>
								<div>
									<p className='mb-1 text-[10px] font-medium text-slate-500'>Discount %</p>
									<Input type='number' min='1' max='100' value={String(code.discountPercent ?? 0)} onChange={(e) => update(code.id, { discountPercent: Number(e.target.value) })} className='h-7 text-[13px]' />
								</div>
								<div>
									<p className='mb-1 text-[10px] font-medium text-slate-500'>Max uses</p>
									<Input type='number' min='1' value={String(code.maxRedemptions ?? 1)} onChange={(e) => update(code.id, { maxRedemptions: Number(e.target.value) })} className='h-7 text-[13px]' />
								</div>
								<div className='col-span-2'>
									<p className='mb-1 text-[10px] font-medium text-slate-500'>Status</p>
									<select value={code.status ?? 'active'} onChange={(e) => update(code.id, { status: e.target.value })} className='h-7 w-full rounded-md border border-slate-200 px-2 text-[13px]'>
										<option value='active'>Active</option>
										<option value='inactive'>Inactive</option>
									</select>
								</div>
							</div>
						)}

						{/* Redemptions panel */}
						{expanded && (code.redemptions?.length ?? 0) > 0 && (
							<div className='border-t border-slate-100 px-3 pb-3 pt-2'>
								<p className='mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600'>
									<Users className='h-3 w-3' /> {code.redemptions!.length} redemption{code.redemptions!.length !== 1 ? 's' : ''}
								</p>
								<div className='space-y-1'>
									{code.redemptions!.map((r) => (
										<div key={r.id} className='flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-2.5 py-1.5 text-[12px]'>
											<span className='truncate font-medium text-slate-700'>{r.fullName || r.email || 'Client'}</span>
											<div className='flex shrink-0 items-center gap-2 text-slate-500'>
												<span className='rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700'>
													-GHS {Number(r.discountAmount ?? 0).toLocaleString()}
												</span>
												{r.redeemedAt && (
													<span className='text-[10px]'>{fmtDate(r.redeemedAt)}</span>
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
	)
}
