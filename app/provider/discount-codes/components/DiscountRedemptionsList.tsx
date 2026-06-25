'use client'

import { Users } from 'lucide-react'
import { formatDate } from '@/lib/format'
import type { DiscountCodeRow } from '../types'

interface DiscountRedemptionsListProps {
	redemptions: NonNullable<DiscountCodeRow['redemptions']>
}

export function DiscountRedemptionsList({
	redemptions,
}: DiscountRedemptionsListProps) {
	if (redemptions.length === 0) return null

	return (
		<div className='border-t border-slate-100 dark:border-border px-3 pb-3 pt-2'>
			<p className='mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-600 dark:text-muted-foreground'>
				<Users className='h-3 w-3' />
				{redemptions.length} redemption{redemptions.length !== 1 ? 's' : ''}
			</p>
			<div className='space-y-1'>
				{redemptions.map((r) => (
					<div
						key={r.id}
						className='flex items-center justify-between gap-2 rounded-lg bg-slate-50 dark:bg-muted px-2.5 py-1.5 text-[12px]'
					>
						<span className='truncate font-medium text-slate-700 dark:text-foreground'>
							{r.fullName || r.email || 'Client'}
						</span>
						<div className='flex shrink-0 items-center gap-2'>
							<span className='rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700'>
								-GHS {Number(r.discountAmount ?? 0).toLocaleString()}
							</span>
							{r.redeemedAt && (
								<span className='text-[10px] text-slate-400 dark:text-muted-foreground/70'>
									{formatDate(r.redeemedAt)}
								</span>
							)}
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
