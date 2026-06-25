'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import type { ChangeEvent } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
	CalendarClock,
	Check,
	CreditCard,
	FileText,
	Loader2,
	MessageSquare,
	MoreHorizontal,
	Paperclip,
	Plus,
	RefreshCcw,
	Send,
	Sparkles,
	Upload,
	UserRound,
	LayoutList,
	Columns2,
	AlertTriangle,
	ArrowLeft,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { RequestFilters } from './RequestFilters'
import { RequestTable } from './RequestTable'
import { ThreadView } from '@/components/provider/ThreadView'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { SupportMilestone, SupportThread } from '@/types/support'
import { useCreateSupportThread } from '@/hooks/use-support-messages'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SupportRequest {
	id: string
	taskId?: string
	title: string
	description?: string
	status: string
	serviceTags: string[]
	academicLevel: string
	deadline?: string
	deadlineAt?: string
	createdAt: string
	clientUid: string
	email?: string
	fullName?: string
	paymentStatus?: string
	paymentAmount?: number
	quotedAmount?: number
	depositPercent?: number
	depositAmount?: number
	balanceAmount?: number
	currency?: string
	discountAmount?: number
	originalAmount?: number
	finalAmount?: number
	subscriptionPlanId?: string
	subscriptionPlanName?: string
	subscriptionPriorityLevel?: number
	userKeyId?: string
	clientId?: string
	fileCount?: number
	messageCount?: number
	messageThreadId?: string
	messageThreadLastMessageAt?: string
	riskTier?: 'first_time' | 'trusted' | 'high_risk'
	previewStatus?: 'not_started' | 'pending' | 'processing' | 'ready' | 'failed'
	previewAccess?: 'none' | 'limited' | 'full_protected' | 'clean_final'
	revisionsAllowed?: number
	revisionsUsed?: number
	paymentPolicy?: {
		depositPercent?: number
		previewUnlock?: 'deposit' | 'full_payment'
		workStartRequirement?: 'none' | 'deposit' | 'full_payment'
		editableDocumentRequired?: boolean
		revisionsAllowed?: number
		reason?: string
		override?: {
			reason: string
			actorId: string
			overriddenAt: string
		}
	}
	files?: Array<{
		id: string
		fileName: string
		fileType?: string
		fileSize?: number | string
		purpose?: string
	}>
}

const pendingPaymentStatuses = new Set([
	'unpaid',
	'failed',
	'pending',
	'paystack_pending',
	'deposit_required',
	'deposit_pending_verification',
	'final_payment_required',
	'final_payment_pending_verification',
])
const paidPaymentStatuses = new Set(['paid', 'deposit_paid'])
const activeRequestStatuses = new Set([
	'submitted',
	'payment_pending',
	'admin_review',
	'under_review',
	'accepted',
	'in_progress',
	'revision_requested',
	'revision_in_progress',
	'work_ready',
])
const completedRequestStatuses = new Set(['completed', 'closed'])

export function RequestInbox({
	initialRequests = [],
	initialFilters,
}: {
	initialRequests?: SupportRequest[]
	initialFilters?: Partial<{
		status: string
		paymentStatus: string
		deadline: string
		subscription: string
		priority: string
	}>
}) {
	const searchParams = useSearchParams()
	const hasSkippedInitialFetch = useRef(false)
	const [requests, setRequests] = useState<SupportRequest[]>(initialRequests)
	const [selectedRequest, setSelectedRequest] = useState<SupportRequest | null>(
		null,
	)
	const [loading, setLoading] = useState(false)
	const backgroundRefreshInFlight = useRef(false)
	// Default to list on mobile (xl+ gets split); split saved in state for desktop toggle
	const [viewMode, setViewMode] = useState<'list' | 'split'>('split')
	const [filters, setFilters] = useState({
		status: initialFilters?.status ?? '',
		paymentStatus: initialFilters?.paymentStatus ?? '',
		service: '',
		search: '',
		deadline: initialFilters?.deadline ?? '',
		subscription: initialFilters?.subscription ?? '',
		priority: initialFilters?.priority ?? '',
	})

	const filteredRequests = useMemo(
		() =>
			requests.filter((req) => {
				const search = filters.search.trim().toLowerCase()
				if (search) {
					const haystack = [
						req.title,
						req.email,
						req.fullName,
						req.academicLevel,
						req.subscriptionPlanName,
					]
						.filter(Boolean)
						.join(' ')
						.toLowerCase()
					if (!haystack.includes(search)) return false
				}
				if (
					filters.service &&
					filters.service !== 'all' &&
					!req.serviceTags?.includes(filters.service)
				)
					return false
				return true
			}),
		[filters.search, filters.service, requests],
	)

	const stats = useMemo(() => {
		const total = filteredRequests.length
		const pending = filteredRequests.filter((r) => {
			const ps = r.paymentStatus ?? 'unpaid'
			return r.status === 'draft' || pendingPaymentStatuses.has(ps)
		}).length
		const inProgress = filteredRequests.filter((r) => {
			const ps = r.paymentStatus ?? 'unpaid'
			return activeRequestStatuses.has(r.status) || paidPaymentStatuses.has(ps)
		}).length
		const completed = filteredRequests.filter((r) =>
			completedRequestStatuses.has(r.status),
		).length
		const urgent = filteredRequests.filter((r) => {
			const dv = r.deadlineAt || r.deadline
			if (!dv) return false
			const h = (new Date(dv).getTime() - Date.now()) / 3_600_000
			return h < 24 && h > 0
		}).length
		return { total, pending, inProgress, completed, urgent }
	}, [filteredRequests])

	useEffect(() => {
		if (!hasSkippedInitialFetch.current) {
			hasSkippedInitialFetch.current = true
			return
		}
		void fetchRequests()
	}, [
		filters.status,
		filters.paymentStatus,
		filters.deadline,
		filters.subscription,
		filters.priority,
	])

	useEffect(() => {
		const requestId = searchParams.get('request')
		if (!requestId) {
			setSelectedRequest(null)
			return
		}
		let cancelled = false
		const load = async () => {
			const res = await fetch(`/api/provider/requests/${requestId}`, {
				cache: 'no-store',
			})
			if (!res.ok) return
			const payload = await res.json()
			if (!cancelled)
				setSelectedRequest((payload.data ?? null) as SupportRequest | null)
		}
		void load()
		return () => {
			cancelled = true
		}
	}, [searchParams])

	const fetchRequests = async ({
		silent = false,
	}: { silent?: boolean } = {}) => {
		if (silent && backgroundRefreshInFlight.current) return
		try {
			if (silent) backgroundRefreshInFlight.current = true
			else setLoading(true)
			const params = new URLSearchParams()
			if (filters.status && filters.status !== 'all')
				params.set('status', filters.status)
			if (filters.paymentStatus && filters.paymentStatus !== 'all')
				params.set('paymentStatus', filters.paymentStatus)
			if (filters.deadline && filters.deadline !== 'all')
				params.set('deadline', filters.deadline)
			if (filters.subscription && filters.subscription !== 'all')
				params.set('subscription', filters.subscription)
			if (filters.priority && filters.priority !== 'all')
				params.set('priority', filters.priority)

			const res = await fetch(`/api/provider/requests?${params}`, {
				cache: 'no-store',
			})
			if (res.ok) {
				const data = await res.json()
				const nextRequests = (data.data || []) as SupportRequest[]
				setRequests(nextRequests)
				setSelectedRequest((cur) =>
					cur && !nextRequests.some((r) => r.id === cur.id) ? null : cur,
				)
			}
		} catch (err) {
			console.error('Failed to fetch requests:', err)
		} finally {
			if (silent) backgroundRefreshInFlight.current = false
			else setLoading(false)
		}
	}

	useEffect(() => {
		const refresh = () => {
			if (document.visibilityState === 'visible')
				void fetchRequests({ silent: true })
		}
		const interval = window.setInterval(refresh, 8000)
		window.addEventListener('focus', refresh)
		document.addEventListener('visibilitychange', refresh)
		return () => {
			window.clearInterval(interval)
			window.removeEventListener('focus', refresh)
			document.removeEventListener('visibilitychange', refresh)
		}
	}, [
		filters.status,
		filters.paymentStatus,
		filters.deadline,
		filters.subscription,
		filters.priority,
	])

	const statItems = [
		{
			label: 'Total',
			value: stats.total,
			color: 'text-slate-900 dark:text-foreground',
			dot: 'bg-slate-400 dark:bg-muted-foreground',
		},
		{
			label: 'Pending',
			value: stats.pending,
			color: 'text-amber-600',
			dot: 'bg-amber-400',
		},
		{
			label: 'In Progress',
			value: stats.inProgress,
			color: 'text-blue-600',
			dot: 'bg-blue-500',
		},
		{
			label: 'Completed',
			value: stats.completed,
			color: 'text-emerald-600',
			dot: 'bg-emerald-500',
		},
		{
			label: 'Urgent',
			value: stats.urgent,
			color: 'text-red-600',
			dot: 'bg-red-500',
		},
	]

	return (
		<div className='flex min-h-0 flex-1 flex-col gap-2.5 lg:gap-4'>
			{/* Compact Stats Strip — scrollable on mobile */}
			<div className='flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none lg:grid lg:grid-cols-5 lg:gap-2 lg:overflow-visible'>
				{statItems.map((s) => (
					<div
						key={s.label}
						className='flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-2.5 py-1.5 shadow-sm lg:min-h-14 lg:gap-2 lg:px-4 lg:py-2'
					>
						<span
							className={`inline-block h-1.5 w-1.5 rounded-full lg:h-2 lg:w-2 ${s.dot}`}
						/>
						<span className='text-[10px] font-medium text-slate-500 dark:text-muted-foreground lg:text-[11px]'>
							{s.label}
						</span>
						<span className={`text-[13px] font-bold lg:text-[15px] ${s.color}`}>
							{s.value}
						</span>
					</div>
				))}
			</div>

			{/* Filters + View Toggle */}
			<div className='flex flex-col gap-2 rounded-provider-card border border-slate-200 dark:border-border bg-white dark:bg-card p-1.5 shadow-sm lg:flex-row lg:items-center lg:justify-between lg:p-3'>
				<div className='flex-1 min-w-0'>
					<RequestFilters filters={filters} onFiltersChange={setFilters} />
				</div>
				<div className='hidden shrink-0 gap-1 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card p-0.5 shadow-sm lg:flex'>
					<button
						type='button'
						onClick={() => setViewMode('split')}
						className={cn(
							'flex h-7 w-8 items-center justify-center rounded-md transition-colors',
							viewMode === 'split'
								? 'bg-emerald-600 text-white'
								: 'text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted',
						)}
						title='Split view'
					>
						<Columns2 className='h-3.5 w-3.5' />
					</button>
					<button
						type='button'
						onClick={() => setViewMode('list')}
						className={cn(
							'flex h-7 w-8 items-center justify-center rounded-md transition-colors',
							viewMode === 'list'
								? 'bg-emerald-600 text-white'
								: 'text-slate-500 dark:text-muted-foreground hover:bg-slate-100 dark:hover:bg-muted',
						)}
						title='List view'
					>
						<LayoutList className='h-3.5 w-3.5' />
					</button>
				</div>
			</div>

			{/* Content */}
			{viewMode === 'split' ? (
				<div className='grid min-h-0 flex-1 grid-cols-1 gap-2.5 xl:grid-cols-[minmax(520px,1fr)_minmax(460px,0.72fr)] xl:items-stretch'>
					<RequestTable
						requests={filteredRequests}
						loading={loading}
						selectedId={selectedRequest?.id ?? searchParams.get('request')}
						onRefresh={fetchRequests}
						viewMode={viewMode}
					/>
					<div className='hidden min-h-[560px] overflow-hidden rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card shadow-sm xl:block'>
						{selectedRequest ? (
							<RequestWorkspace
								request={selectedRequest}
								onRefresh={fetchRequests}
							/>
						) : (
							<div className='flex min-h-[380px] flex-col items-center justify-center px-6 text-center'>
								<Columns2 className='mb-2.5 h-8 w-8 text-slate-300 dark:text-muted-foreground/50' />
								<p className='text-[13px] font-semibold text-slate-700 dark:text-foreground'>
									Select a request
								</p>
								<p className='mt-1 text-[12px] text-slate-400 dark:text-muted-foreground/70 max-w-[200px]'>
									Pick one from the list to review details and chat
								</p>
							</div>
						)}
					</div>
				</div>
			) : (
				<RequestTable
					requests={filteredRequests}
					loading={loading}
					selectedId={selectedRequest?.id ?? searchParams.get('request')}
					onRefresh={fetchRequests}
					viewMode={viewMode}
				/>
			)}
		</div>
	)
}

// ─── RequestWorkspace ──────────────────────────────────────────────────────────

export function RequestWorkspace({
	request,
	initialMilestones = [],
	onRefresh,
	backHref,
}: {
	request: any
	initialMilestones?: SupportMilestone[]
	onRefresh?: () => void
	backHref?: string
}) {
	const [milestones, setMilestones] =
		useState<SupportMilestone[]>(initialMilestones)
	const [loadingMilestones, setLoadingMilestones] = useState(false)
	const [savingMilestone, setSavingMilestone] = useState(false)
	const [sendingCardId, setSendingCardId] = useState<string | null>(null)
	const [discountSaving, setDiscountSaving] = useState(false)
	const [retryingPreview, setRetryingPreview] = useState(false)
	const [policySaving, setPolicySaving] = useState(false)
	const [newMilestone, setNewMilestone] = useState({
		title: '',
		description: '',
		dueAt: '',
		status: 'pending',
	})
	const baseDiscountAmount = Number(
		request.originalAmount ??
			request.paymentAmount ??
			request.quotedAmount ??
			0,
	)
	const [discount, setDiscount] = useState({
		requestedAmount: '',
		approvedAmount: '',
		discountPercent: '',
		reason: '',
	})
	const [showDiscountDialog, setShowDiscountDialog] = useState(false)
	const [showMilestoneDialog, setShowMilestoneDialog] = useState(false)
	const [showFilesDialog, setShowFilesDialog] = useState(false)
	const [showInfoDialog, setShowInfoDialog] = useState(false)
	const [showPolicyDialog, setShowPolicyDialog] = useState(false)
	const [showToolsDrawer, setShowToolsDrawer] = useState(false)
	const [policy, setPolicy] = useState({
		depositPercent: String(
			request.paymentPolicy?.depositPercent ?? request.depositPercent ?? 40,
		),
		previewUnlock: request.paymentPolicy?.previewUnlock ?? 'deposit',
		workStartRequirement: request.paymentPolicy?.workStartRequirement ?? 'none',
		editableDocumentRequired:
			request.paymentPolicy?.editableDocumentRequired !== false,
		revisionsAllowed: String(
			request.paymentPolicy?.revisionsAllowed ?? request.revisionsAllowed ?? 2,
		),
		reason: '',
	})

	const completed = milestones.filter(
		(m) => m.status === 'approved' || m.status === 'auto_approved',
	).length
	const progress = milestones.length
		? Math.round((completed / milestones.length) * 100)
		: 0

	const loadMilestones = async () => {
		setLoadingMilestones(true)
		try {
			const res = await fetch(
				`/api/provider/requests/${request.id}/milestones`,
				{ cache: 'no-store' },
			)
			const payload = await res.json().catch(() => null)
			if (!res.ok)
				throw new Error(payload?.error || 'Failed to load milestones')
			setMilestones(payload?.data || [])
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to load milestones',
			)
		} finally {
			setLoadingMilestones(false)
		}
	}

	const createMilestone = async () => {
		if (newMilestone.title.trim().length < 3) {
			toast.error('Title too short')
			return
		}
		setSavingMilestone(true)
		try {
			const res = await fetch(
				`/api/provider/requests/${request.id}/milestones`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(newMilestone),
				},
			)
			const payload = await res.json().catch(() => null)
			if (!res.ok)
				throw new Error(payload?.error || 'Failed to create milestone')
			setNewMilestone({
				title: '',
				description: '',
				dueAt: '',
				status: 'pending',
			})
			toast.success('Milestone created')
			await loadMilestones()
			onRefresh?.()
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to create milestone',
			)
		} finally {
			setSavingMilestone(false)
		}
	}

	const updateMilestoneStatus = async (
		milestone: SupportMilestone,
		status: string,
	) => {
		try {
			const res = await fetch(
				`/api/provider/requests/${request.id}/milestones/${milestone.id}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ status }),
				},
			)
			const payload = await res.json().catch(() => null)
			if (!res.ok)
				throw new Error(payload?.error || 'Failed to update milestone')
			toast.success('Milestone updated')
			await loadMilestones()
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to update milestone',
			)
		}
	}

	const sendMilestoneCard = async (milestone: SupportMilestone) => {
		setSendingCardId(milestone.id)
		try {
			const res = await fetch(
				`/api/provider/requests/${request.id}/milestones/${milestone.id}/send-card`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						status: 'submitted',
						message: `I've submitted "${milestone.title}" for your review. Please open the milestone card to accept or request revisions.`,
					}),
				},
			)
			const payload = await res.json().catch(() => null)
			if (!res.ok) throw new Error(payload?.error || 'Failed to send card')
			toast.success('Milestone card sent to chat')
			await loadMilestones()
			onRefresh?.()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to send card')
		} finally {
			setSendingCardId(null)
		}
	}

	const decideDiscount = async (status: 'approved' | 'rejected') => {
		setDiscountSaving(true)
		try {
			const percentValue = Number(discount.discountPercent || 0)
			const requestedAmount = Number(
				discount.requestedAmount || baseDiscountAmount || 0,
			)
			if (
				status === 'approved' &&
				percentValue &&
				(percentValue < 1 || percentValue > 100)
			) {
				throw new Error('Discount percent must be between 1 and 100')
			}
			const percentApprovedAmount =
				percentValue > 0
					? Math.round(
							Math.min(
								baseDiscountAmount,
								(baseDiscountAmount * percentValue) / 100,
							) * 100,
						) / 100
					: 0
			const approvedAmount =
				status === 'approved'
					? percentApprovedAmount || Number(discount.approvedAmount || 0)
					: 0
			if (
				status === 'approved' &&
				(!Number.isFinite(approvedAmount) || approvedAmount < 0)
			) {
				throw new Error('Enter a valid discount amount')
			}
			const res = await fetch(
				`/api/provider/requests/${request.id}/discount-decision`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						status,
						requestedAmount,
						approvedAmount,
						discountPercent: percentValue || undefined,
						reason: discount.reason,
					}),
				},
			)
			const payload = await res.json().catch(() => null)
			if (!res.ok) throw new Error(payload?.error || 'Failed to save discount')
			toast.success(
				status === 'approved' ? 'Discount approved' : 'Discount rejected',
			)
			onRefresh?.()
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Failed to save discount',
			)
		} finally {
			setDiscountSaving(false)
		}
	}

	const discountPercentValue = Number(discount.discountPercent || 0)
	const discountPreviewAmount =
		Number.isFinite(discountPercentValue) && discountPercentValue > 0
			? Math.round(
					Math.min(
						baseDiscountAmount,
						(baseDiscountAmount * discountPercentValue) / 100,
					) * 100,
				) / 100
			: Number(discount.approvedAmount || 0)

	const retryPreviewGeneration = async () => {
		setRetryingPreview(true)
		try {
			const response = await fetch(
				`/api/provider/requests/${request.id}/previews/retry`,
				{
					method: 'POST',
				},
			)
			const payload = await response.json().catch(() => null)
			if (!response.ok)
				throw new Error(payload?.error || 'Failed to retry preview generation')
			toast.success('Protected previews regenerated')
			onRefresh?.()
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to retry preview generation',
			)
		} finally {
			setRetryingPreview(false)
		}
	}

	const savePaymentPolicy = async () => {
		setPolicySaving(true)
		try {
			const response = await fetch(
				`/api/provider/requests/${request.id}/payment-policy-override`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						depositPercent: Number(policy.depositPercent),
						previewUnlock: policy.previewUnlock,
						workStartRequirement: policy.workStartRequirement,
						editableDocumentRequired: policy.editableDocumentRequired,
						revisionsAllowed: Number(policy.revisionsAllowed),
						reason: policy.reason,
					}),
				},
			)
			const payload = await response.json().catch(() => null)
			if (!response.ok)
				throw new Error(payload?.error || 'Failed to save payment policy')
			toast.success('Payment policy override saved')
			setShowPolicyDialog(false)
			onRefresh?.()
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to save payment policy',
			)
		} finally {
			setPolicySaving(false)
		}
	}

	return (
		<>
			<div className='flex h-full min-h-0 flex-col'>
				{/* Compact Header */}
				<div className='shrink-0 border-b border-slate-100 dark:border-border bg-white dark:bg-card px-3 py-2'>
					<div className='flex items-center gap-2'>
						{backHref && (
							<Link
								href={backHref}
								aria-label='Back to inbox'
								className='flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-600 dark:text-muted-foreground transition hover:bg-slate-100 dark:hover:bg-muted hover:text-slate-900 dark:text-foreground'
							>
								<ArrowLeft className='h-4 w-4' />
							</Link>
						)}
						<div className='min-w-0 flex-1'>
							<p className='truncate text-[13px] font-semibold text-slate-900 dark:text-foreground'>
								{request.title}
							</p>
							<p className='text-[11px] text-slate-500 dark:text-muted-foreground'>
								{request.fullName || request.email || 'Client'}
							</p>
						</div>
						<div className='flex shrink-0 items-center gap-1'>
							{milestones.length > 0 && (
								<div className='hidden items-center gap-1.5 sm:flex'>
									<div className='h-1 w-12 overflow-hidden rounded-full bg-slate-100 dark:bg-muted'>
										<div
											className='h-full rounded-full bg-emerald-500 transition-all'
											style={{ width: `${progress}%` }}
										/>
									</div>
									<span className='text-[10px] font-medium text-slate-500 dark:text-muted-foreground'>
										{completed}/{milestones.length}
									</span>
								</div>
							)}
							<div className='lg:hidden'>
								<ActionIconBtn
									icon={MoreHorizontal}
									title='Tools'
									onClick={() => setShowToolsDrawer(true)}
								/>
							</div>
							<div className='hidden items-center gap-1 lg:flex'>
								<ActionIconBtn
									icon={FileText}
									title='Details'
									onClick={() => setShowInfoDialog(true)}
								/>
								<ActionIconBtn
									icon={Paperclip}
									title={`${request.files?.length ?? request.fileCount ?? 0} files`}
									onClick={() => setShowFilesDialog(true)}
								/>
								<ActionIconBtn
									icon={Sparkles}
									title='Discount'
									onClick={() => setShowDiscountDialog(true)}
								/>
								<ActionIconBtn
									icon={AlertTriangle}
									title='Payment policy'
									onClick={() => setShowPolicyDialog(true)}
								/>
								<ActionIconBtn
									icon={Plus}
									title='Milestones'
									onClick={() => setShowMilestoneDialog(true)}
									badge={milestones.length || undefined}
								/>
							</div>
						</div>
					</div>
					<div className='mt-2 flex flex-wrap items-center gap-1.5 text-[10px]'>
						<Badge variant='secondary'>
							{formatLabel(request.riskTier || 'first_time')}
						</Badge>
						<Badge variant='outline'>
							{request.paymentPolicy?.depositPercent ??
								request.depositPercent ??
								0}
							% required
						</Badge>
						<Badge
							className='hidden xs:inline-flex'
							variant={
								request.previewStatus === 'failed' ? 'destructive' : 'outline'
							}
						>
							Preview: {formatLabel(request.previewStatus || 'not_started')}
						</Badge>
						<Badge className='hidden sm:inline-flex' variant='outline'>
							Revisions:{' '}
							{Math.max(
								0,
								Number(request.revisionsAllowed ?? 2) -
									Number(request.revisionsUsed ?? 0),
							)}
						</Badge>
						{request.previewStatus === 'failed' && (
							<button
								type='button'
								onClick={() => void retryPreviewGeneration()}
								disabled={retryingPreview}
								className='inline-flex h-7 items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50'
							>
								{retryingPreview ? (
									<Loader2 className='h-3 w-3 animate-spin' />
								) : (
									<RefreshCcw className='h-3 w-3' />
								)}
								Retry preview
							</button>
						)}
					</div>
				</div>

				{/* Chat */}
				<div className='min-h-0 flex-1 overflow-hidden'>
					<RequestConversation
						request={request}
						onRefresh={onRefresh}
						onOpenMilestones={() => setShowMilestoneDialog(true)}
					/>
				</div>
			</div>

			<Drawer open={showToolsDrawer} onOpenChange={setShowToolsDrawer}>
				<DrawerContent className='rounded-t-2xl'>
					<DrawerHeader className='text-left'>
						<DrawerTitle className='text-base'>Request Tools</DrawerTitle>
					</DrawerHeader>
					<div className='grid grid-cols-2 gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]'>
						<ToolButton
							icon={FileText}
							label='Details'
							onClick={() => {
								setShowToolsDrawer(false)
								setShowInfoDialog(true)
							}}
						/>
						<ToolButton
							icon={Paperclip}
							label='Files'
							onClick={() => {
								setShowToolsDrawer(false)
								setShowFilesDialog(true)
							}}
						/>
						<ToolButton
							icon={Sparkles}
							label='Discount'
							onClick={() => {
								setShowToolsDrawer(false)
								setShowDiscountDialog(true)
							}}
						/>
						<ToolButton
							icon={AlertTriangle}
							label='Policy'
							onClick={() => {
								setShowToolsDrawer(false)
								setShowPolicyDialog(true)
							}}
						/>
						<ToolButton
							icon={Plus}
							label='Milestones'
							onClick={() => {
								setShowToolsDrawer(false)
								setShowMilestoneDialog(true)
							}}
						/>
					</div>
				</DrawerContent>
			</Drawer>

			{/* ── Discount Dialog ── */}
			{showDiscountDialog && (
				<Dialog
					onClose={() => setShowDiscountDialog(false)}
					title='Discount Decision'
					icon={Sparkles}
				>
					<div className='space-y-2.5 p-3 sm:p-4'>
						<div className='rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-800'>
							<p className='font-semibold'>
								Providers can approve 1-100% discounts directly.
							</p>
							<p className='mt-0.5'>
								Current request value:{' '}
								{formatMoney(baseDiscountAmount, request.currency)}
							</p>
						</div>
						<Field label='Discount percent'>
							<Input
								type='number'
								min='1'
								max='100'
								value={discount.discountPercent}
								onChange={(e) =>
									setDiscount((s) => ({
										...s,
										discountPercent: e.target.value,
									}))
								}
								placeholder='100'
								className='h-8 text-[13px]'
							/>
						</Field>
						<div className='grid grid-cols-4 gap-1.5'>
							{[25, 50, 75, 100].map((value) => (
								<button
									key={value}
									type='button'
									onClick={() =>
										setDiscount((s) => ({
											...s,
											discountPercent: String(value),
										}))
									}
									className={cn(
										'h-7 rounded-md border text-[11px] font-semibold transition',
										Number(discount.discountPercent) === value
											? 'border-emerald-600 bg-emerald-600 text-white'
											: 'border-slate-200 dark:border-border bg-white dark:bg-card text-slate-600 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted',
									)}
								>
									{value}%
								</button>
							))}
						</div>
						<Field label='Requested amount'>
							<Input
								type='number'
								value={discount.requestedAmount}
								onChange={(e) =>
									setDiscount((s) => ({
										...s,
										requestedAmount: e.target.value,
									}))
								}
								placeholder={String(baseDiscountAmount || 0)}
								className='h-8 text-[13px]'
							/>
						</Field>
						<Field label='Amount to approve'>
							<Input
								type='number'
								value={discount.approvedAmount}
								onChange={(e) =>
									setDiscount((s) => ({ ...s, approvedAmount: e.target.value }))
								}
								placeholder='0'
								className='h-8 text-[13px]'
							/>
						</Field>
						<div className='rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted px-3 py-2 text-[12px] text-slate-700 dark:text-foreground'>
							Discount to apply:{' '}
							<span className='font-semibold'>
								{formatMoney(discountPreviewAmount, request.currency)}
							</span>
							{discountPercentValue >= 100 && (
								<span className='ml-1 font-semibold text-emerald-700'>
									Full discount, no payment required.
								</span>
							)}
						</div>
						<Field label='Reason'>
							<Textarea
								value={discount.reason}
								onChange={(e) =>
									setDiscount((s) => ({ ...s, reason: e.target.value }))
								}
								rows={2}
								className='resize-none text-[13px]'
								placeholder='Reason or note for the user…'
							/>
						</Field>
						<div className='grid grid-cols-2 gap-2 pt-1'>
							<Button
								size='sm'
								onClick={() => {
									void decideDiscount('approved')
									setShowDiscountDialog(false)
								}}
								disabled={discountSaving}
								className='gap-1.5 bg-emerald-600 hover:bg-emerald-700'
							>
								{discountSaving ? (
									<Loader2 className='h-3.5 w-3.5 animate-spin' />
								) : (
									<Check className='h-3.5 w-3.5' />
								)}{' '}
								Approve
							</Button>
							<Button
								size='sm'
								variant='outline'
								onClick={() => {
									void decideDiscount('rejected')
									setShowDiscountDialog(false)
								}}
								disabled={discountSaving}
							>
								Reject
							</Button>
						</div>
					</div>
				</Dialog>
			)}

			{showPolicyDialog && (
				<Dialog
					onClose={() => setShowPolicyDialog(false)}
					title='Payment Policy Override'
					icon={AlertTriangle}
				>
					<div className='space-y-3 p-3 sm:p-4'>
						<div className='rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[12px] text-amber-900'>
							Overrides are audited and cannot be changed after a verified
							payment.
						</div>
						<Field label='Deposit percent'>
							<Input
								type='number'
								min='0'
								max='100'
								value={policy.depositPercent}
								onChange={(event) =>
									setPolicy((current) => ({
										...current,
										depositPercent: event.target.value,
									}))
								}
							/>
						</Field>
						<Field label='Full preview unlock'>
							<select
								value={policy.previewUnlock}
								onChange={(event) =>
									setPolicy((current) => ({
										...current,
										previewUnlock: event.target.value as
											| 'deposit'
											| 'full_payment',
									}))
								}
								className='h-9 w-full rounded-md border border-slate-200 dark:border-border bg-white dark:bg-card px-2 text-[13px]'
							>
								<option value='deposit'>After deposit</option>
								<option value='full_payment'>After full payment</option>
							</select>
						</Field>
						<Field label='Work start requirement'>
							<select
								value={policy.workStartRequirement}
								onChange={(event) =>
									setPolicy((current) => ({
										...current,
										workStartRequirement: event.target.value as
											| 'none'
											| 'deposit'
											| 'full_payment',
									}))
								}
								className='h-9 w-full rounded-md border border-slate-200 dark:border-border bg-white dark:bg-card px-2 text-[13px]'
							>
								<option value='none'>No payment before work</option>
								<option value='deposit'>Deposit before work</option>
								<option value='full_payment'>Full payment before work</option>
							</select>
						</Field>
						<Field label='Included revisions'>
							<Input
								type='number'
								min='0'
								max='10'
								value={policy.revisionsAllowed}
								onChange={(event) =>
									setPolicy((current) => ({
										...current,
										revisionsAllowed: event.target.value,
									}))
								}
							/>
						</Field>
						<label className='flex items-center gap-2 rounded-lg border border-slate-200 dark:border-border px-3 py-2 text-[13px] text-slate-700 dark:text-foreground'>
							<input
								type='checkbox'
								checked={policy.editableDocumentRequired}
								onChange={(event) =>
									setPolicy((current) => ({
										...current,
										editableDocumentRequired: event.target.checked,
									}))
								}
							/>
							Require final editable DOCX
						</label>
						<Field label='Override reason'>
							<Textarea
								value={policy.reason}
								onChange={(event) =>
									setPolicy((current) => ({
										...current,
										reason: event.target.value,
									}))
								}
								rows={3}
								placeholder='Explain why this request needs different terms.'
							/>
						</Field>
						<Button
							onClick={() => void savePaymentPolicy()}
							disabled={policySaving || policy.reason.trim().length < 8}
							className='w-full'
						>
							{policySaving ? (
								<Loader2 className='mr-2 h-4 w-4 animate-spin' />
							) : null}
							Save audited override
						</Button>
					</div>
				</Dialog>
			)}

			{/* ── Milestone Studio ── */}
			{showMilestoneDialog && (
				<Dialog
					onClose={() => setShowMilestoneDialog(false)}
					title='Milestones'
					icon={Plus}
					wide
				>
					<div className='p-3 sm:p-4'>
						<div className='mb-2.5 flex items-center justify-between gap-2'>
							<div className='flex items-center gap-2'>
								<div className='h-1.5 w-20 overflow-hidden rounded-full bg-slate-100 dark:bg-muted sm:w-24'>
									<div
										className='h-full rounded-full bg-emerald-500 transition-all'
										style={{ width: `${progress}%` }}
									/>
								</div>
								<span className='text-[11px] font-medium text-slate-600 dark:text-muted-foreground'>
									{completed}/{milestones.length} done
								</span>
							</div>
							<button
								type='button'
								onClick={() => void loadMilestones()}
								disabled={loadingMilestones}
								className='flex h-7 items-center gap-1 rounded-md border border-slate-200 dark:border-border px-2 text-[12px] text-slate-500 dark:text-muted-foreground hover:bg-slate-50 dark:hover:bg-muted'
							>
								{loadingMilestones ? (
									<Loader2 className='h-3 w-3 animate-spin' />
								) : (
									<RefreshCcw className='h-3 w-3' />
								)}{' '}
								Refresh
							</button>
						</div>

						<div className='grid gap-2.5 lg:grid-cols-[1fr_240px]'>
							<div className='min-h-[96px] space-y-2 sm:min-h-[160px]'>
								{milestones.length === 0 ? (
									<div className='flex items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-border py-6 text-[12px] text-slate-400 dark:text-muted-foreground/70 sm:py-8'>
										No milestones yet
									</div>
								) : (
									milestones.map((m, i) => (
										<ProviderMilestoneRow
											key={m.id}
											requestId={request.id}
											milestone={m}
											number={i + 1}
											sending={sendingCardId === m.id}
											onStatus={updateMilestoneStatus}
											onSendCard={sendMilestoneCard}
											onUploaded={loadMilestones}
										/>
									))
								)}
							</div>
							<details className='group rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted'>
								<summary className='flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-[12px] font-semibold text-slate-700 dark:text-foreground'>
									<Plus className='h-3.5 w-3.5' /> New milestone
								</summary>
								<div className='space-y-2 border-t border-slate-200 dark:border-border p-2.5'>
									<Input
										value={newMilestone.title}
										onChange={(e) =>
											setNewMilestone((s) => ({ ...s, title: e.target.value }))
										}
										placeholder='e.g. Chapter 2 review'
										className='h-8 text-[13px]'
									/>
									<Textarea
										value={newMilestone.description}
										onChange={(e) =>
											setNewMilestone((s) => ({
												...s,
												description: e.target.value,
											}))
										}
										placeholder='What is deliverable?'
										rows={2}
										className='resize-none text-[13px]'
									/>
									<Input
										type='date'
										value={newMilestone.dueAt}
										onChange={(e) =>
											setNewMilestone((s) => ({ ...s, dueAt: e.target.value }))
										}
										className='h-8 text-[13px]'
									/>
									<select
										value={newMilestone.status}
										onChange={(e) =>
											setNewMilestone((s) => ({ ...s, status: e.target.value }))
										}
										className='h-8 w-full rounded-md border border-slate-200 dark:border-border bg-white dark:bg-card px-2 text-[13px]'
									>
										<option value='pending'>Pending</option>
										<option value='active'>Active</option>
										<option value='submitted'>Submitted</option>
									</select>
									<Button
										size='sm'
										onClick={createMilestone}
										disabled={savingMilestone}
										className='w-full gap-1.5'
									>
										{savingMilestone ? (
											<Loader2 className='h-3.5 w-3.5 animate-spin' />
										) : (
											<Plus className='h-3.5 w-3.5' />
										)}{' '}
										Create
									</Button>
								</div>
							</details>
						</div>
					</div>
				</Dialog>
			)}

			{/* ── Files Dialog ── */}
			{showFilesDialog && (
				<Dialog
					onClose={() => setShowFilesDialog(false)}
					title='Attached Files'
					icon={Paperclip}
				>
					<div className='max-h-mobile-dialog overflow-y-auto p-3 sm:p-4'>
						{!request.files?.length ? (
							<div className='flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-border py-8 text-center text-[12px] text-slate-400 dark:text-muted-foreground/70'>
								<Paperclip className='mb-1.5 h-7 w-7 text-slate-300 dark:text-muted-foreground/50' />
								No files attached yet
							</div>
						) : (
							<div className='space-y-1.5'>
								{request.files.map(
									(file: NonNullable<SupportRequest['files']>[number]) => (
										<a
											key={file.id}
											href={`/api/files/${file.id}/download`}
											className='flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-border px-3 py-2 transition hover:bg-slate-50 dark:hover:bg-muted'
										>
											<span className='flex min-w-0 items-center gap-2'>
												<Paperclip className='h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-muted-foreground/70' />
												<span className='truncate text-[13px] font-medium text-slate-700 dark:text-foreground'>
													{file.fileName}
												</span>
											</span>
											<span className='shrink-0 text-[11px] text-slate-400 dark:text-muted-foreground/70'>
												{file.purpose || 'file'}
											</span>
										</a>
									),
								)}
							</div>
						)}
					</div>
				</Dialog>
			)}

			{/* ── Info Dialog ── */}
			{showInfoDialog && (
				<Dialog
					onClose={() => setShowInfoDialog(false)}
					title='Request Details'
					icon={FileText}
				>
					<div className='space-y-2.5 p-3 sm:p-4'>
						<div className='grid gap-2 sm:grid-cols-2'>
							<InfoTile
								icon={<UserRound className='h-3.5 w-3.5' />}
								label='Client'
								value={request.fullName || request.email || 'Client'}
								meta={
									request.email && request.fullName
										? request.email
										: request.userKeyId
								}
							/>
							<InfoTile
								icon={<CreditCard className='h-3.5 w-3.5' />}
								label='Payment'
								value={formatMoney(
									request.paymentAmount ?? request.quotedAmount,
									request.currency,
								)}
								meta={formatLabel(request.paymentStatus || 'pending')}
							/>
							<InfoTile
								icon={<CalendarClock className='h-3.5 w-3.5' />}
								label='Deadline'
								value={formatDateDistance(
									request.deadlineAt || request.deadline,
								)}
								meta={request.academicLevel || 'Not specified'}
							/>
							<InfoTile
								icon={<MessageSquare className='h-3.5 w-3.5' />}
								label='Activity'
								value={`${request.messageCount ?? 0} messages`}
								meta={
									request.messageThreadLastMessageAt
										? `Last: ${formatDateDistance(request.messageThreadLastMessageAt)}`
										: 'No messages'
								}
							/>
						</div>
						{request.description && (
							<div className='rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted p-2.5'>
								<p className='mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-muted-foreground/70'>
									Brief
								</p>
								<p className='max-h-32 overflow-y-auto whitespace-pre-wrap text-[12px] leading-relaxed text-slate-700 dark:text-foreground sm:text-[13px]'>
									{request.description}
								</p>
							</div>
						)}
						{request.subscriptionPlanName && (
							<div className='flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-border bg-blue-50 px-2.5 py-2'>
								<div>
									<p className='text-[11px] font-medium text-slate-500 dark:text-muted-foreground'>
										Plan
									</p>
									<p className='text-[13px] font-semibold text-slate-900 dark:text-foreground'>
										{request.subscriptionPlanName}
									</p>
								</div>
								<Badge
									variant={
										Number(request.subscriptionPriorityLevel ?? 0) >= 2
											? 'default'
											: 'secondary'
									}
								>
									{Number(request.subscriptionPriorityLevel ?? 0) >= 2
										? 'Priority'
										: 'Standard'}
								</Badge>
							</div>
						)}
						<div className='flex items-center justify-between gap-3 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted px-2.5 py-2'>
							<span className='text-[11px] font-medium text-slate-500 dark:text-muted-foreground'>
								Task ID
							</span>
							<code className='min-w-0 truncate rounded bg-slate-200 dark:bg-muted px-2 py-0.5 font-mono text-[11px] text-slate-900 dark:text-foreground'>
								{request.taskId || request.id}
							</code>
						</div>
					</div>
				</Dialog>
			)}
		</>
	)
}

// ─── Dialog ──────────────────────────────────────────────────────────────────

function Dialog({
	children,
	onClose,
	title,
	icon: Icon,
	wide = false,
}: {
	children: React.ReactNode
	onClose: () => void
	title: string
	icon: React.ElementType
	wide?: boolean
}) {
	return (
		<Drawer
			open
			onOpenChange={(open) => {
				if (!open) onClose()
			}}
		>
			<DrawerContent
				className={cn(
					'mx-auto flex max-h-[88vh] flex-col overflow-hidden rounded-t-2xl border-slate-200 dark:border-border bg-white dark:bg-card p-0 shadow-mobile-sheet sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:max-h-[90vh] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl',
					wide ? 'w-full max-w-3xl' : 'w-full max-w-md',
				)}
			>
				<div className='flex shrink-0 items-center justify-between border-b border-slate-100 dark:border-border px-4 py-3'>
					<div className='flex min-w-0 items-center gap-2'>
						<Icon className='h-4 w-4 shrink-0 text-slate-600 dark:text-muted-foreground' />
						<h3 className='truncate text-[14px] font-semibold text-slate-900 dark:text-foreground'>
							{title}
						</h3>
					</div>
					<button
						type='button'
						onClick={onClose}
						aria-label={`Close ${title}`}
						className='flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-400 dark:text-muted-foreground/70 hover:bg-slate-100 dark:hover:bg-muted hover:text-slate-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-ring'
					>
						<span className='text-xl leading-none'>&times;</span>
					</button>
				</div>
				<div className='min-h-0 flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]'>
					{children}
				</div>
			</DrawerContent>
		</Drawer>
	)
}

function ToolButton({
	icon: Icon,
	label,
	onClick,
}: {
	icon: React.ElementType
	label: string
	onClick: () => void
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			className='flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card px-3 py-2 text-left text-[13px] font-semibold text-slate-700 dark:text-foreground shadow-sm transition hover:bg-slate-50 dark:hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring'
		>
			<Icon className='h-4 w-4 shrink-0 text-slate-500 dark:text-muted-foreground' />
			<span className='truncate'>{label}</span>
		</button>
	)
}

function Field({
	label,
	children,
}: {
	label: string
	children: React.ReactNode
}) {
	return (
		<div>
			<p className='mb-1 text-[11px] font-medium text-slate-600 dark:text-muted-foreground'>
				{label}
			</p>
			{children}
		</div>
	)
}

// ─── ActionIconBtn ────────────────────────────────────────────────────────────

function ActionIconBtn({
	icon: Icon,
	title,
	onClick,
	badge,
}: {
	icon: React.ElementType
	title: string
	onClick: () => void
	badge?: number
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			title={title}
			className='relative flex h-7 w-7 items-center justify-center rounded-md text-slate-500 dark:text-muted-foreground transition hover:bg-slate-100 dark:hover:bg-muted hover:text-slate-800 dark:text-foreground'
		>
			<Icon className='h-3.5 w-3.5' />
			{badge != null && badge > 0 && (
				<span className='absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-600 text-[8px] font-bold text-white'>
					{badge > 9 ? '9+' : badge}
				</span>
			)}
		</button>
	)
}

// ─── ProviderMilestoneRow ────────────────────────────────────────────────────

function ProviderMilestoneRow({
	requestId,
	milestone,
	number,
	sending,
	onStatus,
	onSendCard,
	onUploaded,
}: {
	requestId: string
	milestone: SupportMilestone
	number: number
	sending?: boolean
	onStatus: (m: SupportMilestone, s: string) => void
	onSendCard: (m: SupportMilestone) => void
	onUploaded: () => void
}) {
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [uploading, setUploading] = useState(false)
	const [pendingFiles, setPendingFiles] = useState<File[]>([])
	const [deliveryNote, setDeliveryNote] = useState('')
	const approved =
		milestone.status === 'approved' || milestone.status === 'auto_approved'
	const inReview =
		milestone.status === 'submitted' ||
		milestone.status === 'revision_requested'
	const revisionMsg = milestone.latestRevisionMessage || milestone.userFeedback

	const chooseFiles = (e: ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? [])
		if (!files.length) return
		setPendingFiles((current) => [...current, ...files])
		if (fileInputRef.current) fileInputRef.current.value = ''
	}

	const publishMilestone = async () => {
		setUploading(true)
		try {
			if (pendingFiles.length > 0) {
				const fd = new FormData()
				fd.append('requestId', requestId)
				fd.append('milestoneId', milestone.id)
				fd.append('purpose', 'milestone_upload')
				for (const file of pendingFiles) fd.append('files', file, file.name)
				const uploadRes = await fetch('/api/files/upload', {
					method: 'POST',
					body: fd,
				})
				const uploadPayload = await uploadRes.json().catch(() => null)
				if (!uploadRes.ok)
					throw new Error(uploadPayload?.error || 'Upload failed')
			}
			const note = deliveryNote.trim()
			const res = await fetch(
				`/api/provider/requests/${requestId}/milestones/${milestone.id}/send-card`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						status: 'submitted',
						message:
							note ||
							`I've submitted "${milestone.title}" for your review. Please open the milestone card to accept or request revisions.`,
						note,
					}),
				},
			)
			const payload = await res.json().catch(() => null)
			if (!res.ok)
				throw new Error(payload?.error || 'Failed to publish milestone')
			setPendingFiles([])
			setDeliveryNote('')
			toast.success('Milestone delivery published to chat')
			onUploaded()
		} catch (err) {
			toast.error(
				err instanceof Error ? err.message : 'Could not publish milestone',
			)
		} finally {
			setUploading(false)
		}
	}

	return (
		<div
			className={cn(
				'rounded-xl border p-2.5 sm:p-3',
				inReview
					? 'border-blue-200 bg-blue-50/50'
					: 'border-slate-200 dark:border-border bg-white dark:bg-card',
			)}
		>
			<input
				ref={fileInputRef}
				type='file'
				multiple
				className='hidden'
				onChange={chooseFiles}
			/>
			<div className='flex items-start gap-2.5'>
				<div
					className={cn(
						'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold',
						approved
							? 'bg-emerald-500 text-white'
							: inReview
								? 'bg-blue-600 text-white'
								: 'bg-slate-100 dark:bg-muted text-slate-600 dark:text-muted-foreground',
					)}
				>
					{approved ? <Check className='h-3 w-3' /> : number}
				</div>
				<div className='min-w-0 flex-1'>
					<p className='truncate text-[13px] font-semibold text-slate-900 dark:text-foreground'>
						{milestone.title}
					</p>
					{milestone.description && (
						<p className='mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-muted-foreground'>
							{milestone.description}
						</p>
					)}
					<div className='mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400 dark:text-muted-foreground/70 sm:text-[11px]'>
						<span className='flex items-center gap-1'>
							<CalendarClock className='h-3 w-3' />
							{formatDate(milestone.dueAt)}
						</span>
						<span className='hidden xs:inline'>
							{milestone.fileCount ?? 0} files
						</span>
						<span className='hidden xs:inline'>
							{milestone.revisionCount ?? 0} revisions
						</span>
					</div>
					{revisionMsg && (
						<div className='mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800'>
							<p className='font-semibold'>
								{milestone.latestRevisionReason || 'Revision note'}
							</p>
							<p className='mt-0.5 whitespace-pre-wrap'>{revisionMsg}</p>
						</div>
					)}
					{milestone.files && milestone.files.length > 0 && (
						<div className='mt-2 grid gap-1.5'>
							{milestone.files.slice(0, 4).map((file, index) => (
								<div
									key={file.id || file.fileId || `${file.name}-${index}`}
									className='flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-2 py-1.5 text-[11px] text-slate-600 dark:text-muted-foreground'
								>
									<FileText className='h-3.5 w-3.5 shrink-0 text-blue-600' />
									<span className='truncate font-medium'>
										{file.name || file.label || `File ${index + 1}`}
									</span>
									<span
										className={cn(
											'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
											file.status === 'deleted'
												? 'bg-red-50 text-red-700'
												: file.status === 'edited'
													? 'bg-amber-50 text-amber-700'
													: 'bg-emerald-50 text-emerald-700',
										)}
									>
										{file.status === 'deleted'
											? 'Deleted'
											: file.status === 'edited'
												? 'Edited'
												: 'Ready'}
									</span>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
			<div className='mt-2 grid gap-2 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted p-2 sm:mt-2.5'>
				<div className='flex items-center justify-between gap-2'>
					<p className='text-[11px] font-semibold text-slate-700 dark:text-foreground'>
						Milestone delivery composer
					</p>
					<span className='text-[10px] text-slate-500 dark:text-muted-foreground'>
						{pendingFiles.length} pending
					</span>
				</div>
				{pendingFiles.length > 0 && (
					<div className='flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
						{pendingFiles.map((file, index) => (
							<span
								key={`${file.name}-${file.size}-${index}`}
								className='flex min-w-[160px] max-w-[220px] items-center gap-1.5 rounded-lg bg-white dark:bg-card px-2 py-1.5 text-[11px] text-slate-700 dark:text-foreground shadow-sm'
							>
								<Paperclip className='h-3 w-3 shrink-0 text-slate-400 dark:text-muted-foreground/70' />
								<span className='truncate'>{file.name}</span>
								<button
									type='button'
									aria-label={`Remove ${file.name}`}
									onClick={() =>
										setPendingFiles((current) =>
											current.filter((_, itemIndex) => itemIndex !== index),
										)
									}
									className='ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-slate-400 dark:text-muted-foreground/70 hover:bg-slate-100 dark:hover:bg-muted hover:text-slate-700 dark:text-foreground'
								>
									x
								</button>
							</span>
						))}
					</div>
				)}
				<Textarea
					value={deliveryNote}
					onChange={(event) => setDeliveryNote(event.target.value)}
					placeholder='Add a short note for the user before publishing...'
					rows={2}
					className='resize-none bg-white dark:bg-card text-[12px]'
				/>
			</div>
			<div className='mt-2 flex flex-wrap items-center gap-1.5 sm:mt-2.5'>
				<select
					value={milestone.status}
					onChange={(e) => onStatus(milestone, e.target.value)}
					className='h-7 rounded-md border border-slate-200 dark:border-border bg-white dark:bg-card px-2 text-[12px] text-slate-700 dark:text-foreground'
				>
					<option value='pending'>Pending</option>
					<option value='active'>Active</option>
					<option value='submitted'>Submitted</option>
					<option value='revision_requested'>Revision requested</option>
					<option value='approved'>Approved</option>
					<option value='cancelled'>Cancelled</option>
				</select>
				<button
					type='button'
					onClick={() => void publishMilestone()}
					disabled={sending || uploading}
					className='flex h-9 items-center gap-1 rounded-md bg-blue-600 px-2.5 text-[11px] font-medium text-white transition hover:bg-blue-700 disabled:opacity-60 sm:text-[12px]'
				>
					{sending || uploading ? (
						<Loader2 className='h-3 w-3 animate-spin' />
					) : (
						<Send className='h-3 w-3' />
					)}{' '}
					Publish to chat
				</button>
				<button
					type='button'
					onClick={() => fileInputRef.current?.click()}
					disabled={uploading}
					className='flex h-9 items-center gap-1 rounded-md border border-slate-200 dark:border-border bg-white dark:bg-card px-2.5 text-[11px] text-slate-600 dark:text-muted-foreground transition hover:bg-slate-50 dark:hover:bg-muted disabled:opacity-60 sm:text-[12px]'
				>
					{uploading ? (
						<Loader2 className='h-3 w-3 animate-spin' />
					) : (
						<Upload className='h-3 w-3' />
					)}{' '}
					Add files
				</button>
			</div>
		</div>
	)
}

// ─── RequestConversation ──────────────────────────────────────────────────────

function RequestConversation({
	request,
	onRefresh,
	onOpenMilestones,
}: {
	request: any
	onRefresh?: () => void
	onOpenMilestones?: () => void
}) {
	const createThread = useCreateSupportThread()
	const createThreadMutation = createThread.mutateAsync
	const [thread, setThread] = useState<SupportThread | null>(null)

	const seededThread = useMemo<SupportThread | null>(() => {
		if (!request.messageThreadId) return null
		return {
			id: request.messageThreadId,
			requestId: request.id,
			requestTitle: request.title,
			requestTaskId: request.taskId,
			requestStatus: request.status,
			type: 'request',
			status: 'active',
			participants: [
				{
					userId: request.userKeyId || request.clientId || 'client',
					name: request.fullName || request.email || 'Client',
					role: 'client',
				},
				{
					userId: 'cognizap-support',
					name: 'CognizApp Support',
					role: 'provider',
				},
			],
			unreadCount: 0,
			lastMessageAt: request.messageThreadLastMessageAt,
			createdAt: request.createdAt,
			updatedAt: request.messageThreadLastMessageAt || request.createdAt,
		}
	}, [request])

	useEffect(() => {
		let cancelled = false
		setThread(seededThread)
		if (seededThread) return
		createThreadMutation({ requestId: request.id })
			.then((created) => {
				if (!cancelled)
					setThread({
						...created,
						requestId: request.id,
						requestTitle: request.title,
						requestTaskId: request.taskId,
						requestStatus: request.status,
						participants: created.participants?.length
							? created.participants
							: [
									{
										userId: request.userKeyId || request.clientId || 'client',
										name: request.fullName || request.email || 'Client',
										role: 'client',
									},
									{
										userId: 'cognizap-support',
										name: 'CognizApp Support',
										role: 'provider',
									},
								],
					})
				onRefresh?.()
			})
			.catch(() => {
				if (!cancelled) setThread(null)
			})
		return () => {
			cancelled = true
		}
	}, [createThreadMutation, onRefresh, request, seededThread])

	return (
		<div className='h-full min-h-0'>
			{thread ? (
				<ThreadView
					thread={thread}
					onRefresh={onRefresh}
					compact
					onOpenMilestones={onOpenMilestones}
				/>
			) : (
				<div className='flex h-full min-h-[200px] items-center justify-center gap-2 text-[13px] text-slate-400 dark:text-muted-foreground/70'>
					<Loader2 className='h-4 w-4 animate-spin' />
					Preparing conversation…
				</div>
			)}
		</div>
	)
}

// ─── InfoTile ─────────────────────────────────────────────────────────────────

function InfoTile({
	icon,
	label,
	value,
	meta,
}: {
	icon: React.ReactNode
	label: string
	value: string
	meta?: string
}) {
	return (
		<div className='rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted p-2'>
			<div className='flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-muted-foreground/70'>
				{icon} {label}
			</div>
			<p className='mt-1 truncate text-[12px] font-semibold text-slate-900 dark:text-foreground sm:text-[13px]'>
				{value}
			</p>
			{meta && (
				<p className='mt-0.5 truncate text-[10px] text-slate-500 dark:text-muted-foreground sm:text-[11px]'>
					{meta}
				</p>
			)}
		</div>
	)
}

// ─── helpers ─────────────────────────────────────────────────────────────────

function formatLabel(v: string) {
	return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function formatMoney(value?: number, currency = 'GHS') {
	const amt = Number(value ?? 0)
	return new Intl.NumberFormat('en-GH', {
		style: 'currency',
		currency,
		maximumFractionDigits: 2,
	}).format(Number.isFinite(amt) ? amt : 0)
}
function formatDate(v?: string | null) {
	if (!v) return 'No date'
	try {
		return new Intl.DateTimeFormat('en-GH', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		}).format(new Date(v))
	} catch {
		return 'No date'
	}
}
function formatDateDistance(v?: string) {
	if (!v) return '—'
	try {
		return formatDistanceToNow(new Date(v), { addSuffix: true })
	} catch {
		return v
	}
}
