'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Plus, Percent, Hash, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function DiscountCodeCreator() {
	const router = useRouter()
	const [label, setLabel] = useState('')
	const [discountPercent, setDiscountPercent] = useState('10')
	const [maxRedemptions, setMaxRedemptions] = useState('1')
	const [expiresAt, setExpiresAt] = useState('')
	const [busy, setBusy] = useState(false)

	const createCode = async () => {
		if (!label.trim()) { toast.error('Label is required'); return }
		const pct = Number(discountPercent)
		if (!pct || pct < 1 || pct > 100) { toast.error('Discount must be 1–100%'); return }
		setBusy(true)
		try {
			const res = await fetch('/api/support/provider/discount-codes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					label: label.trim(),
					discountPercent: pct,
					maxRedemptions: Number(maxRedemptions),
					expiresAt: expiresAt || undefined,
				}),
			})
			const payload = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(payload?.error || 'Could not create code')
			toast.success(`Code ${payload?.data?.code ?? ''} created`)
			setLabel('')
			setDiscountPercent('10')
			setMaxRedemptions('1')
			setExpiresAt('')
			router.refresh()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Could not create code')
		} finally {
			setBusy(false)
		}
	}

	return (
		<div className='rounded-xl border border-slate-200 bg-white p-3 shadow-sm'>
			<p className='mb-2.5 text-[12px] font-semibold uppercase tracking-wide text-slate-500'>New discount code</p>
			<div className='grid gap-2.5 sm:grid-cols-[1fr_100px_90px_160px_auto] sm:items-end'>
				{/* Label */}
				<div>
					<p className='mb-1 text-[11px] font-medium text-slate-500'>Label</p>
					<Input
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder='e.g. May promo'
						className='h-8 text-[13px]'
					/>
				</div>
				{/* Discount % */}
				<div>
					<p className='mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-500'>
						<Percent className='h-3 w-3' /> Discount
					</p>
					<div className='relative'>
						<Input
							value={discountPercent}
							onChange={(e) => setDiscountPercent(e.target.value)}
							type='number'
							min='1'
							max='100'
							className='h-8 pr-6 text-[13px]'
						/>
						<span className='absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-slate-400'>%</span>
					</div>
				</div>
				{/* Uses */}
				<div>
					<p className='mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-500'>
						<Hash className='h-3 w-3' /> Uses
					</p>
					<Input
						value={maxRedemptions}
						onChange={(e) => setMaxRedemptions(e.target.value)}
						type='number'
						min='1'
						className='h-8 text-[13px]'
					/>
				</div>
				{/* Expiry */}
				<div>
					<p className='mb-1 flex items-center gap-1 text-[11px] font-medium text-slate-500'>
						<Calendar className='h-3 w-3' /> Expiry
					</p>
					<Input
						value={expiresAt}
						onChange={(e) => setExpiresAt(e.target.value)}
						type='datetime-local'
						className='h-8 text-[13px]'
					/>
				</div>
				<Button
					onClick={createCode}
					disabled={busy}
					size='sm'
					className='h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 sm:self-end'
				>
					{busy ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Plus className='h-3.5 w-3.5' />}
					Create
				</Button>
			</div>
		</div>
	)
}
