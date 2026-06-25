import { Gift } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Empty, ErrorState, PageContainer } from '@/components/shared'
import { formatDate, formatMoney } from '@/lib/format'
import { fetchProviderData } from '@/lib/server/provider-data'

type ReferralRow = {
	id: string
	referrerCode?: string
	sourceUserKeyId?: string
	referredUserKeyId?: string
	taskId?: string
	requestStatus?: string
	rewardAmount?: number
	paidAmount?: number
	currency?: string
	rewardStatus?: string
	createdAt?: string
}

const rewardStatusConfig: Record<string, { badge: 'default' | 'secondary' | 'destructive' | 'outline'; tone: string }> = {
	pending: { badge: 'secondary', tone: 'text-amber-700 dark:text-amber-300' },
	paid: { badge: 'default', tone: 'text-emerald-700 dark:text-emerald-300' },
	rejected: { badge: 'destructive', tone: 'text-red-600 dark:text-red-300' },
}

export default async function ProviderReferralsPage() {
	const referrals = await fetchProviderData<ReferralRow[]>('/api/support/provider/referrals', { revalidate: 15 })

	const hasError = referrals === null
	const rows = referrals ?? []

	return (
		<PageContainer
			title='Referrals'
			subtitle='Track referred clients and reward status'
			fillHeight
		>
			{hasError && (
				<ErrorState
					message='Could not load referral data. Please try again.'
					variant='destructive'
				/>
			)}

			{!hasError && rows.length === 0 ? (
				<Card className='flex flex-1 items-center justify-center border-dashed'>
					<CardContent>
						<Empty
							icon={Gift}
							title='No referrals yet'
							description='Referral activity will appear here once clients sign up using your code.'
						/>
					</CardContent>
				</Card>
			) : (
				!hasError && (
					<Card className='min-h-0 flex-1 overflow-hidden'>
						<CardHeader className='border-b px-4 py-3 sm:px-6 sm:py-4'>
							<CardTitle className='text-sm font-semibold sm:text-base'>Referral activity</CardTitle>
						</CardHeader>
						<CardContent className='h-full min-h-0 overflow-y-auto p-0'>
							<div className='divide-y divide-border'>
								{rows.map((ref) => {
									const status = ref.rewardStatus ?? 'pending'
									const config = rewardStatusConfig[status] ?? rewardStatusConfig.pending
									return (
										<div key={ref.id} className='flex items-center gap-2.5 px-3 py-2.5 sm:gap-3 sm:px-5 sm:py-3'>
											<div className='flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/10 sm:h-9 sm:w-9'>
												<Gift className='h-3.5 w-3.5 text-accent sm:h-4 sm:w-4' />
											</div>

											<div className='min-w-0 flex-1'>
												<p className='truncate text-[13px] font-semibold text-foreground sm:text-sm'>
													{ref.taskId || ref.referrerCode || 'Referral'}
												</p>
												<p className='truncate text-[11px] text-muted-foreground sm:text-xs'>
													{ref.referredUserKeyId || 'Referred user'} · {formatDate(ref.createdAt)}
												</p>
											</div>

											<div className='hidden shrink-0 flex-col items-end gap-1 xs:flex'>
												<Badge variant={config.badge} className='text-[10px] sm:text-xs'>
													{status}
												</Badge>
												<span className='rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'>
													{formatMoney(ref.rewardAmount, ref.currency)}
												</span>
											</div>
										</div>
									)
								})}
							</div>
						</CardContent>
					</Card>
				)
			)}
		</PageContainer>
	)
}
