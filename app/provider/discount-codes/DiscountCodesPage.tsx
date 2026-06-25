'use client'

import { useCallback, useState } from 'react'
import { BadgePercent } from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/shared'
import type { DiscountCodeRow } from './types'
import { DiscountCodeForm, type CreateDiscountCodePayload } from './components'
import { DiscountCodeRow as DiscountCodeRowComponent } from './components'

function genTempId() {
	return `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`
}

export function DiscountCodesPage({
	initialCodes,
}: {
	initialCodes: DiscountCodeRow[]
}) {
	const [codes, setCodes] = useState<DiscountCodeRow[]>(initialCodes)
	const [editingId, setEditingId] = useState<string | null>(null)
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const [busyId, setBusyId] = useState<string | null>(null)

	const updateCode = useCallback(
		(id: string, patch: Partial<DiscountCodeRow>) => {
			setCodes((c) =>
				c.map((row) => (row.id === id ? { ...row, ...patch } : row)),
			)
		},
		[],
	)

	// ── create (optimistic) ───────────────────────────────────────────────────

	const handleCreate = async (payload: CreateDiscountCodePayload) => {
		const tempId = genTempId()
		const optimistic: DiscountCodeRow = {
			id: tempId,
			code: '…',
			label: payload.label,
			discountPercent: payload.discountPercent,
			maxRedemptions: payload.maxRedemptions,
			redemptionCount: 0,
			status: 'active',
			expiresAt: payload.expiresAt,
			redemptions: [],
		}
		setCodes((c) => [optimistic, ...c])

		try {
			const res = await fetch('/api/provider/discount-codes', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(data?.error || 'Could not create code')

			const real = data?.data as DiscountCodeRow | undefined
			if (real?.id) {
				setCodes((c) =>
					c.map((row) =>
						row.id === tempId ? { ...real, redemptions: [] } : row,
					),
				)
				toast.success(`Code ${real.code} created`)
			} else {
				setCodes((c) => c.filter((row) => row.id !== tempId))
				toast.success('Code created')
			}
		} catch (err) {
			setCodes((c) => c.filter((row) => row.id !== tempId))
			throw err
		}
	}

	// ── save edit ─────────────────────────────────────────────────────────────

	const handleSave = async (code: DiscountCodeRow) => {
		setBusyId(code.id)
		try {
			const res = await fetch(`/api/provider/discount-codes/${code.id}`, {
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
			const data = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(data?.error || 'Could not update code')
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
		setCodes((c) => c.filter((row) => row.id !== id))
		setBusyId(id)
		try {
			const res = await fetch(`/api/provider/discount-codes/${id}`, {
				method: 'DELETE',
			})
			const data = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(data?.error || 'Could not delete code')
			toast.success('Code removed')
		} catch (err) {
			if (snapshot) setCodes((c) => [...c, snapshot])
			toast.error(err instanceof Error ? err.message : 'Could not delete code')
		} finally {
			setBusyId(null)
		}
	}

	return (
		<PageContainer
			title='Discount Codes'
			subtitle='Create promo codes up to 100% off.'
		>
			<div className='grid min-w-0 gap-3 lg:grid-cols-[minmax(320px,380px)_minmax(0,1fr)] lg:items-start'>
				<DiscountCodeForm onCreate={handleCreate} />

				{codes.length === 0 ? (
					<div className='flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-border bg-white dark:bg-card py-14 text-center'>
						<BadgePercent className='mb-2.5 h-9 w-9 text-slate-300 dark:text-muted-foreground/50' />
						<p className='text-[13px] font-semibold text-slate-700 dark:text-foreground'>
							No discount codes yet
						</p>
						<p className='mt-1 text-[12px] text-slate-400 dark:text-muted-foreground/70'>
							Create your first promo code above
						</p>
					</div>
				) : (
					<div className='space-y-2 pb-3 lg:pb-4'>
						{codes.map((code) => (
							<DiscountCodeRowComponent
								key={code.id}
								code={code}
								isEditing={editingId === code.id}
								isBusy={busyId === code.id}
								isExpanded={expandedId === code.id}
								onEdit={() => setEditingId(code.id)}
								onSave={handleSave}
								onCancelEdit={() => setEditingId(null)}
								onDelete={() => void handleDelete(code.id)}
								onToggleExpand={() =>
									setExpandedId(expandedId === code.id ? null : code.id)
								}
								onUpdate={updateCode}
							/>
						))}
					</div>
				)}
			</div>
		</PageContainer>
	)
}
