'use client'

import { type ReactNode } from 'react'
import {
	ChevronDown,
	ChevronUp,
	Copy,
	Edit3,
	Loader2,
	Save,
	Trash2,
	X,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { formatDate, isExpired, toDateInputValue } from '@/lib/format'
import { getDiscountStatus } from '@/lib/status-config'
import type { DiscountCodeRow as DiscountCodeRowType } from '../types'
import { DiscountRedemptionsList } from './DiscountRedemptionsList'

interface DiscountCodeRowProps {
	code: DiscountCodeRowType
	isEditing: boolean
	isBusy: boolean
	isExpanded: boolean
	onEdit: () => void
	onSave: (code: DiscountCodeRowType) => void
	onCancelEdit: () => void
	onDelete: () => void
	onToggleExpand: () => void
	onUpdate: (id: string, patch: Partial<DiscountCodeRowType>) => void
}

export function DiscountCodeRow({
	code,
	isEditing,
	isBusy,
	isExpanded,
	onEdit,
	onSave,
	onCancelEdit,
	onDelete,
	onToggleExpand,
	onUpdate,
}: DiscountCodeRowProps) {
	const isTemp = code.id.startsWith('temp_')
	const editing = isEditing && !isTemp
	const exhausted = !!(
		code.maxRedemptions && (code.redemptionCount ?? 0) >= code.maxRedemptions
	)
	const sc = getDiscountStatus(code.status, code.expiresAt, exhausted)
	const usageRatio = code.maxRedemptions
		? Math.min((code.redemptionCount ?? 0) / code.maxRedemptions, 1)
		: 0
	const hasRedemptions = (code.redemptions?.length ?? 0) > 0

	return (
		<div
			className={cn(
				'overflow-hidden rounded-provider-card border bg-white dark:bg-card shadow-sm transition-all',
				isTemp
					? 'border-slate-200 dark:border-border opacity-70'
					: 'border-slate-200 dark:border-border',
			)}
		>
			{/* Main row */}
			<div className='flex items-center gap-2.5 p-2.5 sm:gap-3 sm:p-3'>
				{/* % badge */}
				<div className='flex h-9 w-9 shrink-0 flex-col items-center justify-center rounded-xl bg-emerald-50 sm:h-11 sm:w-11'>
					<span className='text-[13px] font-bold leading-none text-emerald-700 sm:text-[14px]'>
						{Number(code.discountPercent ?? 0)}%
					</span>
					<span className='mt-0.5 text-[8px] uppercase leading-none tracking-wide text-emerald-500 sm:text-[9px]'>
						off
					</span>
				</div>

				{/* Info */}
				<div className='min-w-0 flex-1'>
					{editing ? (
						<Input
							value={code.label ?? ''}
							onChange={(e) => onUpdate(code.id, { label: e.target.value })}
							className='mb-1 h-7 text-[13px] font-semibold'
							autoFocus
						/>
					) : (
						<p className='truncate text-[12px] font-semibold text-slate-900 dark:text-foreground sm:text-[13px]'>
							{code.label || code.code}
							{isTemp && (
								<span className='ml-1.5 text-[10px] text-slate-400 dark:text-muted-foreground/70'>
									saving…
								</span>
							)}
						</p>
					)}
					<div className='mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 sm:gap-x-2'>
						{!isTemp && (
							<button
								type='button'
								onClick={() => {
									navigator.clipboard?.writeText(code.code)
									toast.success('Copied!')
								}}
								className='flex items-center gap-1 rounded-md bg-slate-100 dark:bg-muted px-1.5 py-0.5 font-mono text-[11px] text-slate-700 dark:text-foreground transition hover:bg-slate-200'
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

				{/* Usage meter */}
				<div className='hidden shrink-0 flex-col items-end gap-1.5 xs:flex sm:flex'>
					<p className='text-[11px] text-slate-500 dark:text-muted-foreground'>
						<span className='font-semibold text-slate-800 dark:text-foreground'>
							{code.redemptionCount ?? 0}
						</span>
						/{code.maxRedemptions ?? '∞'}
					</p>
					<div className='h-1 w-16 overflow-hidden rounded-full bg-slate-100 dark:bg-muted'>
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
							value={toDateInputValue(code.expiresAt)}
							onChange={(e) => onUpdate(code.id, { expiresAt: e.target.value })}
							className='h-7 rounded-md border border-slate-200 dark:border-border px-2 text-[11px]'
						/>
					) : (
						<p
							className={cn(
								'text-[11px]',
								isExpired(code.expiresAt)
									? 'font-medium text-red-500'
									: 'text-slate-400 dark:text-muted-foreground/70',
							)}
						>
							{formatDate(code.expiresAt, 'No expiry')}
						</p>
					)}
				</div>

				{/* Actions */}
				{!isTemp && (
					<div className='flex shrink-0 items-center gap-0.5'>
						{editing ? (
							<>
								<IconBtn
									icon={
										isBusy ? (
											<Loader2 className='h-3.5 w-3.5 animate-spin' />
										) : (
											<Save className='h-3.5 w-3.5' />
										)
									}
									onClick={() => onSave(code)}
									disabled={isBusy}
									title='Save'
									className='text-emerald-600 hover:bg-emerald-50'
								/>
								<IconBtn
									icon={<X className='h-3.5 w-3.5' />}
									onClick={onCancelEdit}
									title='Cancel'
								/>
							</>
						) : (
							<>
								<IconBtn
									icon={<Edit3 className='h-3.5 w-3.5' />}
									onClick={onEdit}
									title='Edit'
								/>
								<IconBtn
									icon={
										isBusy ? (
											<Loader2 className='h-3.5 w-3.5 animate-spin' />
										) : (
											<Trash2 className='h-3.5 w-3.5' />
										)
									}
									onClick={onDelete}
									disabled={isBusy}
									title='Delete'
									className='text-red-400 hover:bg-red-50 hover:text-red-600'
								/>
								{hasRedemptions && (
									<IconBtn
										icon={
											isExpanded ? (
												<ChevronUp className='h-3.5 w-3.5' />
											) : (
												<ChevronDown className='h-3.5 w-3.5' />
											)
										}
										onClick={onToggleExpand}
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
				<div className='grid grid-cols-2 gap-2 border-t border-slate-100 dark:border-border px-3 pb-3 pt-2 sm:grid-cols-4'>
					<div>
						<p className='mb-1 text-[10px] font-medium text-slate-500 dark:text-muted-foreground'>
							Discount %
						</p>
						<Input
							type='number'
							min='1'
							max='100'
							value={String(code.discountPercent ?? 0)}
							onChange={(e) =>
								onUpdate(code.id, { discountPercent: Number(e.target.value) })
							}
							className='h-7 text-[13px]'
						/>
					</div>
					<div>
						<p className='mb-1 text-[10px] font-medium text-slate-500 dark:text-muted-foreground'>
							Max uses
						</p>
						<Input
							type='number'
							min='1'
							value={String(code.maxRedemptions ?? 1)}
							onChange={(e) =>
								onUpdate(code.id, { maxRedemptions: Number(e.target.value) })
							}
							className='h-7 text-[13px]'
						/>
					</div>
					<div className='col-span-2'>
						<p className='mb-1 text-[10px] font-medium text-slate-500 dark:text-muted-foreground'>
							Status
						</p>
						<select
							value={code.status ?? 'active'}
							onChange={(e) => onUpdate(code.id, { status: e.target.value })}
							className='h-7 w-full rounded-md border border-slate-200 dark:border-border px-2 text-[13px]'
						>
							<option value='active'>Active</option>
							<option value='inactive'>Inactive</option>
						</select>
					</div>
				</div>
			)}

			{/* Redemptions panel */}
			{isExpanded && hasRedemptions && (
				<DiscountRedemptionsList redemptions={code.redemptions!} />
			)}
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
	icon: ReactNode
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
				'flex h-7 w-7 items-center justify-center rounded-md text-slate-400 dark:text-muted-foreground/70 transition hover:bg-slate-100 dark:hover:bg-muted hover:text-slate-700 dark:text-foreground disabled:pointer-events-none disabled:opacity-40',
				className,
			)}
		>
			{icon}
		</button>
	)
}
