'use client'

import { useState } from 'react'
import { Calendar, Hash, Loader2, Percent, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export interface CreateDiscountCodePayload {
	label: string
	discountPercent: number
	maxRedemptions: number
	expiresAt?: string
}

interface DiscountCodeFormProps {
	onCreate: (payload: CreateDiscountCodePayload) => Promise<void>
}

export function DiscountCodeForm({ onCreate }: DiscountCodeFormProps) {
	const [label, setLabel] = useState('')
	const [discountPercent, setDiscountPercent] = useState('10')
	const [maxRedemptions, setMaxRedemptions] = useState('1')
	const [expiresAt, setExpiresAt] = useState('')
	const [creating, setCreating] = useState(false)

	const handleSubmit = async () => {
		if (!label.trim()) {
			toast.error('Label is required')
			return
		}
		const pct = Number(discountPercent)
		// Allow 1–100%: providers can give 100% discount (free)
		if (!Number.isFinite(pct) || pct < 1 || pct > 100) {
			toast.error('Discount must be 1–100%')
			return
		}
		const uses = Math.max(1, Number(maxRedemptions) || 1)

		const snapshot = { label, discountPercent, maxRedemptions, expiresAt }
		setLabel('')
		setDiscountPercent('10')
		setMaxRedemptions('1')
		setExpiresAt('')
		setCreating(true)

		try {
			await onCreate({
				label: snapshot.label.trim(),
				discountPercent: pct,
				maxRedemptions: uses,
				expiresAt: snapshot.expiresAt || undefined,
			})
		} catch (err) {
			setLabel(snapshot.label)
			setDiscountPercent(snapshot.discountPercent)
			setMaxRedemptions(snapshot.maxRedemptions)
			setExpiresAt(snapshot.expiresAt)
			toast.error(err instanceof Error ? err.message : 'Could not create code')
		} finally {
			setCreating(false)
		}
	}

	return (
		<div className='min-w-0 rounded-provider-card border border-slate-200 bg-white p-2.5 shadow-sm lg:rounded-xl lg:p-4'>
			<p className='mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400 lg:mb-3'>New code</p>

			<div className='mb-2'>
				<label className='mb-1 block text-[11px] font-medium text-slate-500'>Label</label>
				<Input
					value={label}
					onChange={(e) => setLabel(e.target.value)}
					placeholder='e.g. Welcome10'
					className='h-8 text-[13px] lg:h-9'
					onKeyDown={(e) => { if (e.key === 'Enter') void handleSubmit() }}
				/>
			</div>

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
				onClick={handleSubmit}
				disabled={creating || !label.trim()}
				className='h-8 w-full gap-1.5 bg-emerald-600 hover:bg-emerald-700 lg:h-9'
				size='sm'
			>
				{creating ? <Loader2 className='h-3.5 w-3.5 animate-spin' /> : <Plus className='h-3.5 w-3.5' />}
				{creating ? 'Creating…' : 'Create code'}
			</Button>
		</div>
	)
}
