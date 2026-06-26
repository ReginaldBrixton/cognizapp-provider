'use client'

import { useState, useCallback, useRef } from 'react'
import Link from 'next/link'
import {
	ArrowLeft,
	CalendarClock,
	Clock,
	FileText,
	GitBranch,
	History,
	Loader2,
	Send,
	Upload,
	AlertTriangle,
	CheckCircle2,
	XCircle,
	RotateCcw,
	Eye,
} from 'lucide-react'
import { toast } from 'sonner'
import { formatDistanceToNow } from 'date-fns'
import type {
	MilestoneHistoryRound,
	SupportMilestone,
	SupportMilestoneStatus,
	SupportRequest,
} from '@/types/support'
import { formatDate, formatDateTime, formatRelativeTime, hoursUntil } from '@/lib/format'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

interface MilestoneWorkspaceProps {
	request: SupportRequest
	milestone: SupportMilestone
	initialHistory: MilestoneHistoryRound[]
	backHref: string
}

const STATUS_CONFIG: Record<
	SupportMilestoneStatus,
	{ label: string; color: string; icon: typeof Clock }
> = {
	pending: { label: 'Pending', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Clock },
	active: { label: 'Active', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300', icon: Clock },
	submitted: { label: 'Submitted', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300', icon: Eye },
	revision_requested: { label: 'Revision Requested', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300', icon: RotateCcw },
	approved: { label: 'Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle2 },
	auto_approved: { label: 'Auto Approved', color: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300', icon: CheckCircle2 },
	disputed: { label: 'Disputed', color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300', icon: AlertTriangle },
	cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400', icon: XCircle },
}

export function MilestoneWorkspace({
	request,
	milestone: initialMilestone,
	initialHistory,
	backHref,
}: MilestoneWorkspaceProps) {
	const [milestone, setMilestone] = useState<SupportMilestone>(initialMilestone)
	const [history, setHistory] = useState<MilestoneHistoryRound[]>(initialHistory)
	const [loading, setLoading] = useState(false)
	const [deliveryNote, setDeliveryNote] = useState('')
	const [uploading, setUploading] = useState(false)
	const [sending, setSending] = useState(false)
	const fileInputRef = useRef<HTMLInputElement>(null)

	const statusConfig = STATUS_CONFIG[milestone.status] ?? STATUS_CONFIG.pending
	const currentRound = milestone.submissionRound ?? 0
	const isRevision = milestone.status === 'revision_requested'
	const canSubmit = milestone.status === 'active' || milestone.status === 'revision_requested' || milestone.status === 'pending'
	const isApproved = milestone.status === 'approved' || milestone.status === 'auto_approved'
	const hrsLeft = hoursUntil(milestone.dueAt)
	const isOverdue = hrsLeft !== null && hrsLeft < 0 && !isApproved

	const reloadMilestone = useCallback(async () => {
		setLoading(true)
		try {
			const [msRes, histRes] = await Promise.all([
				fetch(`/api/provider/requests/${request.id}/milestones/${milestone.id}`, { cache: 'no-store' }),
				fetch(`/api/provider/requests/${request.id}/milestones/${milestone.id}/history`, { cache: 'no-store' }),
			])
			const msPayload = await msRes.json().catch(() => null)
			const histPayload = await histRes.json().catch(() => null)
			if (msRes.ok && msPayload?.data) setMilestone(msPayload.data)
			if (histRes.ok && histPayload?.data) setHistory(histPayload.data)
		} catch {
			// silent
		} finally {
			setLoading(false)
		}
	}, [request.id, milestone.id])

	const handleUploadFiles = async (files: FileList) => {
		if (!files.length) return
		setUploading(true)
		try {
			const formData = new FormData()
			formData.append('requestId', request.id)
			formData.append('milestoneId', milestone.id)
			formData.append('purpose', 'milestone_upload')
			formData.append('submissionRound', String(Math.max(1, currentRound)))
			Array.from(files).forEach((file) => formData.append('files', file))

			const res = await fetch('/api/files/upload', { method: 'POST', body: formData })
			const payload = await res.json().catch(() => null)
			if (!res.ok) throw new Error(payload?.error || 'Upload failed')
			toast.success(`${files.length} file(s) uploaded`)
			await reloadMilestone()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Upload failed')
		} finally {
			setUploading(false)
			if (fileInputRef.current) fileInputRef.current.value = ''
		}
	}

	const handleSubmitForReview = async () => {
		setSending(true)
		try {
			const res = await fetch(
				`/api/provider/requests/${request.id}/milestones/${milestone.id}/send-card`,
				{
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						status: 'submitted',
						message: deliveryNote.trim() || `Milestone submitted: ${milestone.title}`,
					}),
				},
			)
			const payload = await res.json().catch(() => null)
			if (!res.ok) throw new Error(payload?.error || 'Failed to submit')
			toast.success(isRevision ? 'Revision resubmitted for review' : 'Milestone submitted for review')
			setDeliveryNote('')
			await reloadMilestone()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to submit')
		} finally {
			setSending(false)
		}
	}

	const handleMarkActive = async () => {
		setSending(true)
		try {
			const res = await fetch(
				`/api/provider/requests/${request.id}/milestones/${milestone.id}`,
				{
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ status: 'active' }),
				},
			)
			if (!res.ok) throw new Error('Failed to update status')
			toast.success('Milestone marked as active')
			await reloadMilestone()
		} catch {
			toast.error('Failed to update status')
		} finally {
			setSending(false)
		}
	}

	return (
		<div className='flex h-full min-h-0 flex-col overflow-hidden bg-slate-50 dark:bg-muted'>
			{/* Header */}
			<div className='flex-shrink-0 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-card md:px-6'>
				<div className='flex items-center justify-between gap-3'>
					<div className='flex min-w-0 items-center gap-3'>
						<Link href={backHref}>
							<Button variant='ghost' size='sm' className='gap-1.5'>
								<ArrowLeft className='h-4 w-4' />
								<span className='hidden sm:inline'>Back to request</span>
							</Button>
						</Link>
						<Separator orientation='vertical' className='h-6' />
						<div className='min-w-0'>
							<h1 className='truncate text-base font-semibold text-slate-900 dark:text-slate-100 md:text-lg'>
								{milestone.title}
							</h1>
							<p className='truncate text-xs text-slate-500 dark:text-slate-400'>
								{request.title}
							</p>
						</div>
					</div>
					<div className='flex items-center gap-2'>
						<Badge className={`${statusConfig.color} gap-1 border-0`}>
							{(() => {
								const Icon = statusConfig.icon
								return <Icon className='h-3 w-3' />
							})()}
							{statusConfig.label}
						</Badge>
						{currentRound > 0 && (
							<Badge variant='outline' className='gap-1'>
								<GitBranch className='h-3 w-3' />
								v{currentRound}
							</Badge>
						)}
						<Button variant='ghost' size='sm' onClick={reloadMilestone} disabled={loading}>
							{loading ? <Loader2 className='h-4 w-4 animate-spin' /> : <History className='h-4 w-4' />}
						</Button>
					</div>
				</div>
			</div>

			{/* Body: two-column layout on desktop */}
			<div className='flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row'>
				{/* Left: milestone details + actions */}
				<div className='flex min-h-0 flex-1 flex-col overflow-hidden'>
					<ScrollArea className='flex-1'>
						<div className='space-y-4 p-4 md:p-6'>
							{/* Description */}
							{milestone.description && (
								<Card className='p-4'>
									<h2 className='mb-2 text-sm font-medium text-slate-500 dark:text-slate-400'>
										Description
									</h2>
									<p className='text-sm text-slate-800 dark:text-slate-200'>
										{milestone.description}
									</p>
								</Card>
							)}

							{/* Meta info */}
							<div className='grid grid-cols-2 gap-3 sm:grid-cols-4'>
								<MetaCard
									icon={CalendarClock}
									label='Due Date'
									value={formatDate(milestone.dueAt)}
									danger={isOverdue}
								/>
								<MetaCard
									icon={Clock}
									label='Submitted'
									value={milestone.submittedAt ? formatRelativeTime(milestone.submittedAt) : 'Not yet'}
								/>
								<MetaCard
									icon={RotateCcw}
									label='Revisions'
									value={`${milestone.revisionCount ?? 0} requested`}
								/>
								<MetaCard
									icon={FileText}
									label='Files'
									value={`${milestone.fileCount ?? milestone.files?.length ?? 0} attached`}
								/>
							</div>

							{/* Overdue warning */}
							{isOverdue && (
								<div className='flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300'>
									<AlertTriangle className='h-4 w-4 flex-shrink-0' />
									This milestone is overdue. Please communicate with the client if needed.
								</div>
							)}

							{/* Revision feedback */}
							{isRevision && milestone.latestRevisionMessage && (
								<Card className='border-orange-200 bg-orange-50 p-4 dark:border-orange-900/50 dark:bg-orange-950/20'>
									<div className='flex items-start gap-2'>
										<AlertTriangle className='mt-0.5 h-4 w-4 flex-shrink-0 text-orange-600 dark:text-orange-400' />
										<div className='min-w-0 flex-1'>
											<h3 className='text-sm font-medium text-orange-800 dark:text-orange-300'>
												Revision requested: {milestone.latestRevisionReason ?? 'Other'}
											</h3>
											<p className='mt-1 text-sm text-orange-700 dark:text-orange-400'>
												{milestone.latestRevisionMessage}
											</p>
											{milestone.latestRevisionAt && (
												<p className='mt-1 text-xs text-orange-600 dark:text-orange-500'>
													{formatRelativeTime(milestone.latestRevisionAt)}
												</p>
											)}
										</div>
									</div>
								</Card>
							)}

							{/* Current files */}
							<Card className='p-4'>
								<div className='mb-3 flex items-center justify-between'>
									<h2 className='text-sm font-medium text-slate-700 dark:text-slate-300'>
										Current files ({milestone.files?.length ?? 0})
									</h2>
									{canSubmit && (
										<Button
											variant='outline'
											size='sm'
											className='gap-1.5'
											onClick={() => fileInputRef.current?.click()}
											disabled={uploading}
										>
											{uploading ? (
												<Loader2 className='h-4 w-4 animate-spin' />
											) : (
												<Upload className='h-4 w-4' />
											)}
											Upload
										</Button>
									)}
								</div>
								<input
									ref={fileInputRef}
									type='file'
									multiple
									className='hidden'
									onChange={(e) => e.target.files && handleUploadFiles(e.target.files)}
								/>
								{milestone.files && milestone.files.length > 0 ? (
									<div className='space-y-2'>
										{milestone.files.map((file) => (
											<FileRow key={file.id ?? file.name} file={file} />
										))}
									</div>
								) : (
									<p className='py-4 text-center text-sm text-slate-400'>
										No files uploaded yet
									</p>
								)}
							</Card>

							{/* Action area */}
							{canSubmit ? (
								<Card className='p-4'>
									<h2 className='mb-3 text-sm font-medium text-slate-700 dark:text-slate-300'>
										{isRevision ? 'Resubmit after revision' : 'Submit for client review'}
									</h2>
									<Textarea
										placeholder='Add a delivery note for the client (optional)...'
										value={deliveryNote}
										onChange={(e) => setDeliveryNote(e.target.value)}
										rows={3}
										className='mb-3'
									/>
									<div className='flex flex-wrap gap-2'>
										<Button
											onClick={handleSubmitForReview}
											disabled={sending || uploading}
											className='gap-1.5'
										>
											{sending ? (
												<Loader2 className='h-4 w-4 animate-spin' />
											) : (
												<Send className='h-4 w-4' />
											)}
											{isRevision ? 'Resubmit for review' : 'Submit for review'}
										</Button>
										{milestone.status === 'pending' && (
											<Button
												variant='outline'
												onClick={handleMarkActive}
												disabled={sending}
												className='gap-1.5'
											>
												<Clock className='h-4 w-4' />
												Mark as active
											</Button>
										)}
									</div>
									<p className='mt-2 text-xs text-slate-400'>
										Submitting will send a milestone card to the chat and notify the client.
									</p>
								</Card>
							) : isApproved ? (
								<Card className='border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/20'>
									<div className='flex items-center gap-2'>
										<CheckCircle2 className='h-5 w-5 text-green-600 dark:text-green-400' />
										<div>
											<h2 className='text-sm font-medium text-green-800 dark:text-green-300'>
												Milestone approved
											</h2>
											{milestone.approvedAt && (
												<p className='text-xs text-green-600 dark:text-green-500'>
													{formatDateTime(milestone.approvedAt)}
												</p>
											)}
										</div>
									</div>
								</Card>
							) : (
								<Card className='p-4'>
									<div className='flex items-center gap-2'>
										<Eye className='h-5 w-5 text-amber-500' />
										<h2 className='text-sm font-medium text-slate-700 dark:text-slate-300'>
											Waiting for client review
										</h2>
									</div>
									<p className='mt-1 text-xs text-slate-400'>
										The client will review your submission and either approve or request changes.
									</p>
								</Card>
							)}
						</div>
					</ScrollArea>
				</div>

				{/* Right: version history timeline */}
				<div className='flex min-h-0 flex-shrink-0 flex-col overflow-hidden border-t border-slate-200 dark:border-slate-800 lg:w-96 lg:border-l lg:border-t-0'>
					<div className='flex-shrink-0 border-b border-slate-200 px-4 py-3 dark:border-slate-800'>
						<h2 className='flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300'>
							<History className='h-4 w-4' />
							Version History
						</h2>
					</div>
					<ScrollArea className='flex-1'>
						<div className='p-4'>
							{history.length > 0 ? (
								<div className='space-y-4'>
									{history
										.slice()
										.reverse()
										.map((round) => (
											<RoundTimeline key={round.round} round={round} />
										))}
								</div>
							) : (
								<p className='py-8 text-center text-sm text-slate-400'>
									No history yet. Submit the milestone to start the collaboration timeline.
								</p>
							)}
						</div>
					</ScrollArea>
				</div>
			</div>
		</div>
	)
}

function MetaCard({
	icon: Icon,
	label,
	value,
	danger,
}: {
	icon: typeof Clock
	label: string
	value: string
	danger?: boolean
}) {
	return (
		<Card className={`p-3 ${danger ? 'border-red-200 dark:border-red-900/50' : ''}`}>
			<div className='flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400'>
				<Icon className={`h-3.5 w-3.5 ${danger ? 'text-red-500' : ''}`} />
				{label}
			</div>
			<p className={`mt-1 truncate text-sm font-medium ${danger ? 'text-red-700 dark:text-red-400' : 'text-slate-800 dark:text-slate-200'}`}>
				{value}
			</p>
		</Card>
	)
}

function FileRow({ file }: { file: any }) {
	const status = file.status ?? 'active'
	const isDeleted = status === 'deleted'
	const isReplaced = status === 'edited' || status === 'replaced'
	return (
		<div className={`flex items-center gap-2 rounded-lg border p-2 ${isDeleted ? 'border-slate-200 bg-slate-50 opacity-60 dark:border-slate-800 dark:bg-slate-900/50' : 'border-slate-200 dark:border-slate-800'}`}>
			<FileText className='h-4 w-4 flex-shrink-0 text-slate-400' />
			<div className='min-w-0 flex-1'>
				<p className={`truncate text-sm ${isDeleted ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
					{file.name ?? file.fileName ?? 'Unnamed file'}
				</p>
				<p className='text-xs text-slate-400'>
					{file.submissionRound ? `v${file.submissionRound} · ` : ''}
					{formatRelativeTime(file.createdAt)}
				</p>
			</div>
			{isDeleted && <Badge variant='outline' className='text-xs'>Deleted</Badge>}
			{isReplaced && <Badge variant='outline' className='text-xs'>Replaced</Badge>}
			{!isDeleted && !isReplaced && file.canPreview && (
				<Badge variant='outline' className='text-xs'>Ready</Badge>
			)}
		</div>
	)
}

function RoundTimeline({ round }: { round: MilestoneHistoryRound }) {
	return (
		<div className='relative rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-card'>
			{/* Round header */}
			<div className='mb-2 flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<div className='flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-semibold text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'>
						v{round.round}
					</div>
					<span className='text-sm font-medium text-slate-700 dark:text-slate-300'>
						{round.label}
					</span>
				</div>
				{round.submittedAt && (
					<span className='text-xs text-slate-400'>
						{formatRelativeTime(round.submittedAt)}
					</span>
				)}
			</div>

			{/* Files in this round */}
			{round.files.length > 0 && (
				<div className='mb-2 space-y-1'>
					{round.files.map((file) => (
						<div key={file.id} className='flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400'>
							<FileText className='h-3 w-3 flex-shrink-0' />
							<span className={`truncate ${file.status === 'deleted' ? 'line-through opacity-50' : ''}`}>
								{file.fileName}
							</span>
						</div>
					))}
				</div>
			)}

			{/* Revision feedback for this round */}
			{round.revision && (
				<div className='mt-2 rounded-md border border-orange-200 bg-orange-50 p-2 dark:border-orange-900/50 dark:bg-orange-950/20'>
					<p className='text-xs font-medium text-orange-700 dark:text-orange-400'>
						Revision: {round.revision.reason}
					</p>
					<p className='mt-0.5 text-xs text-orange-600 dark:text-orange-500'>
						{round.revision.message}
					</p>
				</div>
			)}

			{/* Events */}
			{round.events.length > 0 && (
				<div className='mt-2 space-y-0.5'>
					{round.events.map((event) => (
						<div key={event.id} className='flex items-center gap-1.5 text-xs text-slate-400'>
							<EventIcon eventType={event.eventType} />
							<span>{formatEventLabel(event.eventType)}</span>
							<span className='ml-auto'>{formatDistanceToNow(new Date(event.createdAt), { addSuffix: true })}</span>
						</div>
					))}
				</div>
			)}
		</div>
	)
}

function EventIcon({ eventType }: { eventType: string }) {
	switch (eventType) {
		case 'uploaded':
			return <Upload className='h-3 w-3' />
		case 'card_sent':
		case 'card_updated':
			return <Send className='h-3 w-3' />
		case 'accepted':
			return <CheckCircle2 className='h-3 w-3 text-green-500' />
		case 'revision_requested':
			return <RotateCcw className='h-3 w-3 text-orange-500' />
		case 'deleted':
			return <XCircle className='h-3 w-3 text-red-500' />
		case 'replaced':
			return <GitBranch className='h-3 w-3' />
		default:
			return <Clock className='h-3 w-3' />
	}
}

function formatEventLabel(eventType: string): string {
	const labels: Record<string, string> = {
		uploaded: 'File uploaded',
		card_sent: 'Submitted to client',
		card_updated: 'Card updated',
		accepted: 'Approved by client',
		revision_requested: 'Revision requested',
		deleted: 'File deleted',
		replaced: 'File replaced',
		locked: 'Files locked',
		unlocked: 'Files unlocked',
	}
	return labels[eventType] ?? eventType
}
