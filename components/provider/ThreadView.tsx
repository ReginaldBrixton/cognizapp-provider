'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import {
	ArrowDown,
	ArrowUp,
	CalendarClock,
	CheckCircle,
	ClipboardCheck,
	CreditCard,
	Edit2,
	Eye,
	FileText,
	Images,
	Loader2,
	MessageSquareText,
	MoreHorizontal,
	Paperclip,
	PackageCheck,
	Pencil,
	Reply,
	RotateCcw,
	Send,
	Trash2,
	Upload,
	X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
	Drawer,
	DrawerContent,
	DrawerHeader,
	DrawerTitle,
} from '@/components/ui/drawer'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import type {
	Attachment,
	SupportFile,
	SupportMessage,
	SupportThread,
} from '@/types/support'
import {
	useSendSupportMessage,
	useSupportThreadMessages,
	useSupportThreadRealtime,
	useEditSupportMessage,
	useDeleteSupportMessage,
} from '@/hooks/use-support-messages'
import { cn } from '@/lib/utils'
import { useSession } from '@/components/providers/SessionProvider'

interface ThreadViewProps {
	thread: SupportThread
	onRefresh?: () => void
	compact?: boolean
	onOpenMilestones?: () => void
}

export function ThreadView({
	thread,
	onRefresh,
	compact = false,
	onOpenMilestones,
}: ThreadViewProps) {
	const { data: session } = useSession()
	const [newMessage, setNewMessage] = useState('')
	const [pendingFiles, setPendingFiles] = useState<File[]>([])
	const [uploading, setUploading] = useState(false)
	const [delivering, setDelivering] = useState(false)
	const [showDeliveryTools, setShowDeliveryTools] = useState(false)
	const [showCardTools, setShowCardTools] = useState(false)
	const [replyingTo, setReplyingTo] = useState<{
		messageId: string
		senderName: string
		preview: string
	} | null>(null)
	const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const messagesContainerRef = useRef<HTMLDivElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const deliveryPdfInputRef = useRef<HTMLInputElement>(null)
	const deliveryDocxInputRef = useRef<HTMLInputElement>(null)
	const previewImagesInputRef = useRef<HTMLInputElement>(null)
	const [deliveryPdf, setDeliveryPdf] = useState<File | null>(null)
	const [deliveryDocx, setDeliveryDocx] = useState<File | null>(null)
	const [previewImages, setPreviewImages] = useState<File[]>([])
	const hasInitiallyScrolledRef = useRef(false)
	const textareaRef = useRef<HTMLTextAreaElement>(null)
	const { data: messages = [], isLoading } = useSupportThreadMessages(thread.id)
	const sendMessage = useSendSupportMessage(thread)
	const editMessageMutation = useEditSupportMessage(thread.id)
	const deleteMessageMutation = useDeleteSupportMessage(thread.id)
	const realtime = useSupportThreadRealtime(thread.id)

	useEffect(() => {
		// Use setTimeout to ensure DOM has updated
		setTimeout(() => {
			const container = messagesContainerRef.current
			if (!container) return

			// On initial load, scroll instantly to bottom
			if (!hasInitiallyScrolledRef.current && messages.length > 0) {
				container.scrollTo({
					top: container.scrollHeight,
					behavior: 'auto',
				})
				hasInitiallyScrolledRef.current = true
			} else {
				// For new messages, smooth scroll
				container.scrollTo({
					top: container.scrollHeight,
					behavior: 'smooth',
				})
			}
		}, 0)
	}, [messages])

	const adjustTextareaHeight = useCallback(() => {
		const textarea = textareaRef.current
		if (!textarea) return

		// Reset height to auto to correctly measure scrollHeight
		textarea.style.height = 'auto'

		// Calculate new height (capping around 7 lines / ~160px)
		const newHeight = Math.min(textarea.scrollHeight, 160)
		textarea.style.height = `${newHeight}px`

		// Enable scrollbar only when content exceeds max height
		textarea.style.overflowY = textarea.scrollHeight > 160 ? 'auto' : 'hidden'
	}, [])

	// Adjust height whenever newMessage changes
	useEffect(() => {
		adjustTextareaHeight()
	}, [newMessage, adjustTextareaHeight])

	// Optional: Also adjust on window resize
	useEffect(() => {
		window.addEventListener('resize', adjustTextareaHeight)
		return () => window.removeEventListener('resize', adjustTextareaHeight)
	}, [adjustTextareaHeight])

	const uploadPendingFiles = async () => {
		if (pendingFiles.length === 0) return [] as SupportFile[]
		const fd = new FormData()
		for (const file of pendingFiles) fd.append('files', file)
		fd.append('threadId', thread.id)
		if (thread.requestId) fd.append('requestId', thread.requestId)
		fd.append('purpose', 'provider_message_upload')
		const res = await fetch('/api/files/upload', { method: 'POST', body: fd })
		const payload = await res.json().catch(() => ({}))
		if (!res.ok) throw new Error(payload?.error || 'Upload failed')
		return (payload?.data || []) as SupportFile[]
	}

	const handleSend = async () => {
		const body = newMessage.trim()
		if (
			(!body && pendingFiles.length === 0) ||
			sendMessage.isPending ||
			uploading
		)
			return
		setUploading(true)
		try {
			const uploadedFiles = await uploadPendingFiles()
			const fileReferences = uploadedFiles.map((file) => ({
				type: 'file' as const,
				id: file.id,
				label: file.fileName,
				meta: file.purpose || 'provider message',
			}))
			const attachments = uploadedFiles.map((file) => ({
				kind: 'file',
				id: file.id,
				fileId: file.id,
				name: file.fileName,
				label: file.fileName,
				url: file.fileUrl || `/api/files/${file.id}/download`,
				externalUrl: file.externalFileUrl ?? null,
				type: file.fileType,
				size: Number(file.fileSize ?? 0),
				purpose: file.purpose || 'provider_message_upload',
			}))
			const fallbackBody =
				uploadedFiles.length === 1
					? `Sent file: ${uploadedFiles[0].fileName}`
					: uploadedFiles.length > 1
						? `Sent ${uploadedFiles.length} files`
						: body
			await sendMessage.mutateAsync({
				body: body || fallbackBody,
				attachments,
				fileReferences,
				replyToMessageId: replyingTo?.messageId || null,
			})
			setNewMessage('')
			setPendingFiles([])
			setReplyingTo(null)
			onRefresh?.()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to send message')
		} finally {
			setUploading(false)
		}
	}

	const handleEditMessage = async (messageId: string, newContent: string) => {
		try {
			await editMessageMutation.mutateAsync({ messageId, content: newContent })
			toast.success('Message updated')
		} catch (error) {
			toast.error('Failed to edit message')
		}
	}

	const handleDeleteMessage = async (messageId: string) => {
		try {
			await deleteMessageMutation.mutateAsync(messageId)
			toast.success('Message deleted')
			setDeleteTargetId(null)
		} catch (error) {
			toast.error('Failed to delete message')
		}
	}

	const handleMilestoneTool = () => {
		if (onOpenMilestones) {
			onOpenMilestones()
			toast.info('Select a milestone to send its review card.')
			return
		}
		toast.info('No milestones panel available.')
	}

	const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files ?? [])
		if (files.length === 0) return
		setPendingFiles((current) => [...current, ...files])
		toast.success(
			files.length === 1
				? 'File attached. Hit Send to share it.'
				: `${files.length} files attached. Hit Send to share them.`,
		)
		if (fileInputRef.current) fileInputRef.current.value = ''
	}

	const handleFinalDelivery = async () => {
		if (!thread.requestId) return
		if (!deliveryPdf) {
			toast.error('Select the clean PDF before publishing.')
			return
		}
		if (!deliveryDocx) {
			toast.error('Select the clean DOCX before publishing.')
			return
		}
		if (previewImages.length === 0) {
			toast.error('Select ordered preview page images before publishing.')
			return
		}
		setDelivering(true)
		try {
			const fd = new FormData()
			fd.append('pdfFile', deliveryPdf)
			fd.append('docxFile', deliveryDocx)
			for (const image of previewImages)
				fd.append('previewImages', image, image.name)
			fd.append(
				'deliveryNote',
				'Preview page images are available in chat; clean final files stay locked until full payment.',
			)
			const res = await fetch(
				`/api/provider/requests/${thread.requestId}/deliver`,
				{
					method: 'POST',
					body: fd,
				},
			)
			const payload = await res.json().catch(() => ({}))
			if (!res.ok) throw new Error(payload?.error || 'Delivery failed')
			toast.success(
				'Preview pages published. Clean final files remain locked until full payment.',
			)
			onRefresh?.()
			setDeliveryPdf(null)
			setDeliveryDocx(null)
			setPreviewImages([])
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to upload final delivery',
			)
		} finally {
			setDelivering(false)
			if (deliveryPdfInputRef.current) deliveryPdfInputRef.current.value = ''
			if (deliveryDocxInputRef.current) deliveryDocxInputRef.current.value = ''
			if (previewImagesInputRef.current)
				previewImagesInputRef.current.value = ''
		}
	}

	const movePreviewImage = (fromIndex: number, direction: -1 | 1) => {
		setPreviewImages((current) => {
			const toIndex = fromIndex + direction
			if (toIndex < 0 || toIndex >= current.length) return current
			const next = [...current]
			const [moved] = next.splice(fromIndex, 1)
			next.splice(toIndex, 0, moved)
			return next
		})
	}

	const deliveryPackagePanel = (
		<div className='space-y-3'>
			<input
				ref={deliveryPdfInputRef}
				type='file'
				accept='application/pdf,.pdf'
				className='hidden'
				onChange={(event) => setDeliveryPdf(event.target.files?.[0] ?? null)}
			/>
			<input
				ref={deliveryDocxInputRef}
				type='file'
				accept='application/vnd.openxmlformats-officedocument.wordprocessingml.document,.docx'
				className='hidden'
				onChange={(event) => setDeliveryDocx(event.target.files?.[0] ?? null)}
			/>
			<input
				ref={previewImagesInputRef}
				type='file'
				accept='image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp'
				multiple
				className='hidden'
				onChange={(event) => {
					const files = Array.from(event.target.files ?? [])
					if (files.length > 60) {
						toast.error('Upload 60 preview images or fewer.')
						if (previewImagesInputRef.current)
							previewImagesInputRef.current.value = ''
						return
					}
					const tooLarge = files.find((file) => file.size > 15 * 1024 * 1024)
					if (tooLarge) {
						toast.error(`${tooLarge.name} is larger than 15 MB.`)
						if (previewImagesInputRef.current)
							previewImagesInputRef.current.value = ''
						return
					}
					setPreviewImages(files)
				}}
			/>
			<div className='min-w-0'>
				<p className='text-xs font-semibold text-slate-900 dark:text-foreground'>
					Publish delivery package
				</p>
				<p className='text-[11px] leading-4 text-slate-500 dark:text-muted-foreground'>
					Upload clean files and ordered preview images. Clean files stay locked
					until payment.
				</p>
			</div>
			<div className='grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.15fr_auto]'>
				<Button
					type='button'
					variant='outline'
					onClick={() => deliveryPdfInputRef.current?.click()}
					disabled={delivering}
					className='h-11 min-w-0 justify-start gap-2 px-3 text-xs'
				>
					<FileText className='h-4 w-4 shrink-0 text-red-600' />
					<span className='truncate'>{deliveryPdf?.name || 'Select PDF'}</span>
				</Button>
				<Button
					type='button'
					variant='outline'
					onClick={() => deliveryDocxInputRef.current?.click()}
					disabled={delivering}
					className='h-11 min-w-0 justify-start gap-2 px-3 text-xs'
				>
					<FileText className='h-4 w-4 shrink-0 text-blue-600' />
					<span className='truncate'>
						{deliveryDocx?.name || 'Select DOCX'}
					</span>
				</Button>
				<Button
					type='button'
					variant='outline'
					onClick={() => previewImagesInputRef.current?.click()}
					disabled={delivering}
					className='h-11 min-w-0 justify-start gap-2 px-3 text-xs sm:col-span-2 lg:col-span-1'
				>
					<Images className='h-4 w-4 shrink-0 text-emerald-600' />
					<span className='truncate'>
						{previewImages.length
							? `${previewImages.length} preview images`
							: 'Select preview images'}
					</span>
				</Button>
				<Button
					type='button'
					onClick={() => void handleFinalDelivery()}
					disabled={
						delivering ||
						!deliveryPdf ||
						!deliveryDocx ||
						previewImages.length === 0
					}
					className='h-11 gap-2 bg-emerald-600 text-xs text-white hover:bg-emerald-700 sm:col-span-2 lg:col-span-1 lg:px-4'
				>
					{delivering ? (
						<Loader2 className='h-4 w-4 animate-spin' />
					) : (
						<PackageCheck className='h-4 w-4' />
					)}
					{delivering ? 'Publishing...' : 'Publish package'}
				</Button>
			</div>
			{previewImages.length > 0 && (
				<div className='flex gap-2 overflow-x-auto rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card p-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden'>
					{previewImages.map((file, index) => (
						<div
							key={`${file.name}-${file.size}-${index}`}
							className='flex min-w-[190px] max-w-[240px] items-center gap-2 rounded-lg bg-slate-50 dark:bg-muted px-2 py-1.5 text-[11px] text-slate-600 dark:text-muted-foreground'
						>
							<span className='flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-emerald-100 font-semibold text-emerald-700'>
								{index + 1}
							</span>
							<span className='truncate font-medium'>{file.name}</span>
							<div className='ml-auto flex shrink-0 items-center gap-1'>
								<button
									type='button'
									aria-label={`Move preview image ${index + 1} earlier`}
									disabled={index === 0 || delivering}
									onClick={() => movePreviewImage(index, -1)}
									className='flex h-6 w-6 items-center justify-center rounded-md text-slate-400 dark:text-muted-foreground/70 hover:bg-slate-200 hover:text-slate-700 dark:text-foreground disabled:cursor-not-allowed disabled:opacity-35'
								>
									<ArrowUp className='h-3.5 w-3.5' />
								</button>
								<button
									type='button'
									aria-label={`Move preview image ${index + 1} later`}
									disabled={index === previewImages.length - 1 || delivering}
									onClick={() => movePreviewImage(index, 1)}
									className='flex h-6 w-6 items-center justify-center rounded-md text-slate-400 dark:text-muted-foreground/70 hover:bg-slate-200 hover:text-slate-700 dark:text-foreground disabled:cursor-not-allowed disabled:opacity-35'
								>
									<ArrowDown className='h-3.5 w-3.5' />
								</button>
							</div>
							<button
								type='button'
								aria-label={`Remove preview image ${index + 1}`}
								onClick={() =>
									setPreviewImages((current) =>
										current.filter((_, itemIndex) => itemIndex !== index),
									)
								}
								className='flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 dark:text-muted-foreground/70 hover:bg-slate-200 hover:text-slate-700 dark:text-foreground'
							>
								<X className='h-3.5 w-3.5' />
							</button>
						</div>
					))}
				</div>
			)}
		</div>
	)

	return (
		<div
			className={cn(
				'relative flex flex-col overflow-hidden',
				compact ? 'h-full min-h-0' : 'min-h-[680px]',
			)}
		>
			{/* Non-compact header */}
			{!compact && (
				<div className='shrink-0 border-b border-slate-100 dark:border-border bg-white dark:bg-card px-4 py-2.5 flex items-center justify-between'>
					<div>
						<p className='text-[13px] font-semibold text-slate-900 dark:text-foreground'>
							{thread.requestTitle || 'Support Chat'}
						</p>
						<p className='text-[11px] text-slate-400 dark:text-muted-foreground/70'>
							{realtime.status === 'connected'
								? 'Live'
								: realtime.status === 'connecting'
									? 'Connecting…'
									: 'Offline'}
						</p>
					</div>
				</div>
			)}

			{thread.requestId && (
				<div className='shrink-0 border-b border-slate-200 dark:border-border bg-slate-50 dark:bg-muted px-3 py-2.5'>
					<div className='lg:hidden'>
						<Button
							type='button'
							variant='outline'
							onClick={() => setShowDeliveryTools(true)}
							className='h-11 w-full justify-between rounded-xl text-xs'
						>
							<span className='inline-flex items-center gap-2'>
								<PackageCheck className='h-4 w-4 text-emerald-600' />
								Delivery package
							</span>
							<span className='text-[11px] text-slate-500 dark:text-muted-foreground'>
								{
									[
										deliveryPdf,
										deliveryDocx,
										previewImages.length ? previewImages : null,
									].filter(Boolean).length
								}
								/3 ready
							</span>
						</Button>
					</div>
					<div className='hidden lg:block'>{deliveryPackagePanel}</div>
				</div>
			)}

			{/* Messages */}
			<div
				ref={messagesContainerRef}
				className='min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-3 py-2.5 pb-[8.75rem] sm:space-y-2.5 sm:py-3 sm:pb-[10rem]'
			>
				{isLoading ? (
					<div className='flex min-h-[200px] items-center justify-center'>
						<Loader2 className='h-5 w-5 animate-spin text-slate-400 dark:text-muted-foreground/70' />
					</div>
				) : messages.length === 0 ? (
					<div className='flex min-h-[200px] items-center justify-center text-[12px] text-slate-400 dark:text-muted-foreground/70'>
						No messages yet
					</div>
				) : (
					messages.map((msg) => (
						<MessageBubble
							key={msg.id}
							message={msg}
							isOwnMessage={
								msg.canEdit ??
								(msg.senderKeyId === session?.user?.id ||
									msg.senderId === session?.user?.id)
							}
							handleEditMessage={handleEditMessage}
							handleDeleteMessage={async (messageId) =>
								setDeleteTargetId(messageId)
							}
							setReplyingTo={setReplyingTo}
							onFilesChanged={onRefresh}
							onReplacePackage={() => setShowDeliveryTools(true)}
						/>
					))
				)}
				<div ref={messagesEndRef} />
			</div>

			{/* Compose bar — uses safe-area-inset-bottom for mobile browser chrome */}
			<div className='pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-white via-white/95 to-transparent px-2.5 pb-[calc(0.375rem+env(safe-area-inset-bottom,0px))] pt-3 sm:px-3 sm:pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] sm:pt-4'>
				<input
					ref={fileInputRef}
					type='file'
					multiple
					className='hidden'
					onChange={handleFileUpload}
				/>

				{/* Quick-action card senders */}
				{thread.requestId && (
					<div className='pointer-events-auto mb-1.5 grid grid-cols-1 gap-1 sm:mb-2 lg:hidden'>
						<QuickBtn
							icon={MoreHorizontal}
							label='Open chat tools'
							color='text-slate-600 dark:text-muted-foreground'
							onClick={() => setShowCardTools(true)}
						/>
					</div>
				)}

				{thread.requestId && (
					<div className='pointer-events-auto mb-1.5 hidden grid-cols-4 gap-1 sm:mb-2 sm:gap-1.5 lg:grid'>
						<QuickBtn
							icon={ClipboardCheck}
							label='Milestone card'
							color='text-blue-600'
							onClick={handleMilestoneTool}
						/>
						<PaymentCardBtn requestId={thread.requestId} onSent={onRefresh} />
						<RevisionCardBtn requestId={thread.requestId} onSent={onRefresh} />
						<DeliveryCardBtn requestId={thread.requestId} onSent={onRefresh} />
					</div>
				)}

				{pendingFiles.length > 0 && (
					<div className='pointer-events-auto mb-1.5 flex max-h-16 flex-wrap gap-1 overflow-y-auto rounded-lg border border-emerald-100 bg-emerald-50 p-1.5'>
						{pendingFiles.map((file, index) => (
							<span
								key={`${file.name}-${file.size}-${index}`}
								className='flex min-w-0 max-w-full items-center gap-1 rounded-md bg-white dark:bg-card px-2 py-1 text-[11px] font-medium text-emerald-800 shadow-sm'
							>
								<Paperclip className='h-3 w-3 shrink-0' />
								<span className='truncate'>{file.name}</span>
								<button
									type='button'
									aria-label={`Remove ${file.name}`}
									onClick={() =>
										setPendingFiles((current) =>
											current.filter((_, itemIndex) => itemIndex !== index),
										)
									}
									className='ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-emerald-600 hover:bg-emerald-100'
								>
									x
								</button>
							</span>
						))}
					</div>
				)}

				{/* Reply preview */}
				{replyingTo && (
					<div className='pointer-events-auto mb-1.5 flex items-center justify-between gap-2 rounded-lg border border-blue-100 bg-blue-50 p-2'>
						<div className='min-w-0 flex-1'>
							<p className='text-[10px] font-semibold text-blue-700'>
								Replying to {replyingTo.senderName}
							</p>
							<p className='truncate text-[11px] text-blue-600'>
								{replyingTo.preview}
							</p>
						</div>
						<button
							type='button'
							onClick={() => setReplyingTo(null)}
							className='flex h-5 w-5 shrink-0 items-center justify-center rounded text-blue-600 hover:bg-blue-100'
							aria-label='Cancel reply'
						>
							×
						</button>
					</div>
				)}

				{/* Textarea + send */}
				<div className='pointer-events-auto flex items-end gap-1.5 rounded-xl border border-slate-200 dark:border-border bg-white dark:bg-card p-1.5 shadow-sm'>
					<Textarea
						ref={textareaRef}
						value={newMessage}
						onChange={(e) => setNewMessage(e.target.value)}
						placeholder='Type a message…'
						rows={1}
						style={{
							minHeight: '40px',
							maxHeight: '160px',
							transition: 'height 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
						}}
						className='min-w-0 flex-1 resize-none border-0 bg-transparent p-1.5 text-[13px] shadow-none focus-visible:ring-0'
						onKeyDown={(e) => {
							if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
								e.preventDefault()
								void handleSend()
							}
						}}
					/>
					<div className='flex flex-col gap-1 pb-0.5'>
						<button
							type='button'
							onClick={() => fileInputRef.current?.click()}
							disabled={uploading || sendMessage.isPending}
							title='Attach file'
							className='flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 dark:border-border text-slate-500 dark:text-muted-foreground transition hover:bg-slate-50 dark:hover:bg-muted disabled:opacity-50'
						>
							{uploading ? (
								<Loader2 className='h-3.5 w-3.5 animate-spin' />
							) : (
								<Upload className='h-3.5 w-3.5' />
							)}
						</button>
						<button
							type='button'
							onClick={handleSend}
							disabled={
								sendMessage.isPending ||
								uploading ||
								(!newMessage.trim() && pendingFiles.length === 0)
							}
							title='Send'
							className='flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:opacity-50'
						>
							{sendMessage.isPending || uploading ? (
								<Loader2 className='h-3.5 w-3.5 animate-spin' />
							) : (
								<Send className='h-3.5 w-3.5' />
							)}
						</button>
					</div>
				</div>
			</div>

			<Drawer open={showDeliveryTools} onOpenChange={setShowDeliveryTools}>
				<DrawerContent className='max-h-[88vh] rounded-t-2xl'>
					<DrawerHeader className='text-left'>
						<DrawerTitle className='text-base'>Delivery Package</DrawerTitle>
					</DrawerHeader>
					<div className='overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]'>
						{deliveryPackagePanel}
					</div>
				</DrawerContent>
			</Drawer>

			<Drawer open={showCardTools} onOpenChange={setShowCardTools}>
				<DrawerContent className='rounded-t-2xl'>
					<DrawerHeader className='text-left'>
						<DrawerTitle className='text-base'>Chat Tools</DrawerTitle>
					</DrawerHeader>
					<div className='grid grid-cols-2 gap-2 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]'>
						<QuickBtn
							icon={ClipboardCheck}
							label='Milestone card'
							color='text-blue-600'
							onClick={() => {
								setShowCardTools(false)
								handleMilestoneTool()
							}}
						/>
						<PaymentCardBtn
							requestId={thread.requestId ?? ''}
							onSent={onRefresh}
						/>
						<RevisionCardBtn
							requestId={thread.requestId ?? ''}
							onSent={onRefresh}
						/>
						<DeliveryCardBtn
							requestId={thread.requestId ?? ''}
							onSent={onRefresh}
						/>
					</div>
				</DrawerContent>
			</Drawer>
			<ProviderConfirmDialog
				open={Boolean(deleteTargetId)}
				onOpenChange={(open) => {
					if (!open) setDeleteTargetId(null)
				}}
				title='Delete message?'
				description='The message text will be hidden and replaced with a deleted-message note.'
				confirmLabel='Delete message'
				cancelLabel='Keep message'
				isLoading={deleteMessageMutation.isPending}
				onConfirm={() => {
					if (deleteTargetId) void handleDeleteMessage(deleteTargetId)
				}}
			/>
		</div>
	)
}

// ─── QuickBtn ─────────────────────────────────────────────────────────────────

function releaseDialogLocks() {
	if (typeof document === 'undefined') return
	document.body.style.pointerEvents = ''
	document.body.removeAttribute('data-scroll-locked')
}

function ProviderConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	cancelLabel,
	onConfirm,
	isLoading,
}: {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description: string
	confirmLabel: string
	cancelLabel: string
	onConfirm: () => void
	isLoading?: boolean
}) {
	const handleOpenChange = (nextOpen: boolean) => {
		onOpenChange(nextOpen)
		if (!nextOpen) window.setTimeout(releaseDialogLocks, 80)
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				fallbackTitle={title}
				showCloseButton={!isLoading}
				className='sm:max-w-[420px] sm:rounded-2xl sm:p-0'
			>
				<div className='px-1 pb-[calc(0.5rem+env(safe-area-inset-bottom,0px))] pt-1 sm:px-0 sm:pb-0 sm:pt-0'>
					<DialogHeader className='gap-4 border-b border-slate-200 dark:border-border px-1 pb-5 text-left sm:px-6 sm:pt-6'>
						<div className='flex items-start gap-4'>
							<span className='flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-600'>
								<Trash2 className='h-5 w-5' />
							</span>
							<div className='min-w-0 flex-1 pt-0.5'>
								<DialogTitle className='text-xl leading-tight'>
									{title}
								</DialogTitle>
								<DialogDescription className='mt-2 text-sm leading-relaxed'>
									{description}
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>
					<DialogFooter className='grid grid-cols-1 gap-2 px-1 pt-4 sm:grid-cols-2 sm:px-6 sm:pb-6'>
						<Button
							type='button'
							variant='outline'
							onClick={() => handleOpenChange(false)}
							disabled={isLoading}
							className='h-12 rounded-xl font-semibold sm:h-11'
						>
							{cancelLabel}
						</Button>
						<Button
							type='button'
							onClick={() => {
								onConfirm()
								window.setTimeout(releaseDialogLocks, 80)
							}}
							disabled={isLoading}
							className='h-12 rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700 sm:h-11'
						>
							{isLoading ? 'Please wait...' : confirmLabel}
						</Button>
					</DialogFooter>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function QuickBtn({
	icon: Icon,
	label,
	color,
	onClick,
}: {
	icon: React.ElementType
	label: string
	color: string
	onClick: () => void
}) {
	return (
		<button
			type='button'
			onClick={onClick}
			className='flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-2 text-[11px] font-medium text-slate-700 dark:text-foreground transition hover:bg-slate-50 dark:hover:bg-muted hover:shadow-sm'
		>
			<Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
			<span className='hidden truncate xs:inline'>{label}</span>
		</button>
	)
}

// ─── PaymentCardBtn ───────────────────────────────────────────────────────────

function PaymentCardBtn({
	requestId,
	onSent,
}: {
	requestId: string
	onSent?: () => void
}) {
	const [open, setOpen] = useState(false)
	const [amount, setAmount] = useState('')
	const [paymentType, setPaymentType] = useState('deposit')
	const [note, setNote] = useState('')
	const [busy, setBusy] = useState(false)
	const [requestAmounts, setRequestAmounts] = useState<{
		deposit: number
		full_payment: number
		final_balance: number
		partial_balance: number
	} | null>(null)

	const loadAmounts = useCallback(async () => {
		try {
			const res = await fetch(`/api/provider/requests/${requestId}`, {
				cache: 'no-store',
			})
			const payload = await res.json().catch(() => ({}))
			if (!res.ok)
				throw new Error(payload?.error || 'Failed to load payment amounts')
			const request = payload?.data || {}
			const full = Number(
				request.finalAmount ??
					request.paymentAmount ??
					request.quotedAmount ??
					0,
			)
			const balance = Number(request.balanceAmount ?? 0)
			const amounts = {
				deposit: Number(request.depositAmount ?? 0),
				full_payment: full,
				final_balance: balance,
				partial_balance: Math.round((balance / 2) * 100) / 100,
			}
			setRequestAmounts(amounts)
			setAmount(String(amounts[paymentType as keyof typeof amounts] || ''))
		} catch (error) {
			toast.error(
				error instanceof Error
					? error.message
					: 'Failed to load payment amounts',
			)
		}
	}, [paymentType, requestId])

	useEffect(() => {
		if (!open) return
		const timer = window.setTimeout(() => {
			void loadAmounts()
		}, 0)
		return () => window.clearTimeout(timer)
	}, [loadAmounts, open])

	const handlePaymentTypeChange = (nextPaymentType: string) => {
		setPaymentType(nextPaymentType)
		if (!requestAmounts) return
		setAmount(
			String(
				requestAmounts[nextPaymentType as keyof typeof requestAmounts] || '',
			),
		)
	}

	const send = async () => {
		if (!amount || Number(amount) <= 0) {
			toast.error('Enter a valid amount')
			return
		}
		setBusy(true)
		try {
			const res = await fetch(`/api/provider/requests/${requestId}/send-card`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					kind: 'payment_card',
					amount: Number(amount),
					paymentType,
					note,
				}),
			})
			const payload = await res.json().catch(() => ({}))
			if (!res.ok)
				throw new Error(payload?.error || 'Failed to send payment card')
			toast.success('Payment card sent to client')
			setAmount('')
			setNote('')
			setOpen(false)
			onSent?.()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to send card')
		} finally {
			setBusy(false)
		}
	}

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				className='flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-2 text-[11px] font-medium text-slate-700 dark:text-foreground transition hover:bg-slate-50 dark:hover:bg-muted hover:shadow-sm'
			>
				<CreditCard className='h-3.5 w-3.5 shrink-0 text-emerald-600' />
				<span className='hidden truncate xs:inline'>Payment card</span>
			</button>

			{open && (
				<CardDialog onClose={() => setOpen(false)}>
					{/* Preview */}
					<div className='rounded-t-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-4 text-white sm:p-5'>
						<div className='mb-2.5 flex items-center gap-2.5 sm:mb-3'>
							<div className='flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-card/20 sm:h-9 sm:w-9'>
								<CreditCard className='h-4 w-4' />
							</div>
							<div>
								<p className='text-[13px] font-bold'>Payment Request</p>
								<p className='text-[11px] opacity-60'>
									From your service provider · CogniZap
								</p>
							</div>
						</div>
						<p className='text-[28px] font-bold leading-none tracking-tight sm:text-[32px]'>
							{amount ? `GHS ${Number(amount).toLocaleString()}` : 'GHS —'}
						</p>
						<p className='mt-1 text-[12px] opacity-75 capitalize'>
							{paymentType.replace('_', ' ')} payment
						</p>
						{note && (
							<p className='mt-1 text-[11px] opacity-60 line-clamp-1'>{note}</p>
						)}
						<div className='mt-3 hidden items-center gap-2 rounded-lg bg-white dark:bg-card/10 px-3 py-2 xs:flex'>
							<div className='h-2 w-2 rounded-full bg-white dark:bg-card/60' />
							<p className='text-[11px] opacity-80'>
								Client clicks "Pay Now" → Paystack opens
							</p>
						</div>
					</div>

					{/* Form */}
					<div className='space-y-2.5 p-3 sm:p-4'>
						<FormField label='Amount (GHS)'>
							<Input
								type='number'
								value={amount}
								onChange={(e) =>
									paymentType === 'partial_balance' && setAmount(e.target.value)
								}
								placeholder='Calculated from accepted quote'
								readOnly={paymentType !== 'partial_balance'}
								className='h-8 text-[13px]'
								autoFocus
							/>
							<p className='mt-1 text-[10px] text-slate-500 dark:text-muted-foreground'>
								Calculated from the accepted quote and payment policy.
							</p>
						</FormField>
						<FormField label='Payment type'>
							<select
								value={paymentType}
								onChange={(e) => handlePaymentTypeChange(e.target.value)}
								className='h-8 w-full rounded-md border border-slate-200 dark:border-border bg-white dark:bg-card px-2 text-[13px]'
							>
								<option value='deposit'>Deposit</option>
								<option value='full_payment'>Full payment</option>
								<option value='final_balance'>Balance payment</option>
								<option value='partial_balance'>Milestone payment</option>
							</select>
						</FormField>
						<FormField label='Note (optional)'>
							<Input
								value={note}
								onChange={(e) => setNote(e.target.value)}
								placeholder='e.g. 50% deposit for Chapter 1'
								className='h-8 text-[13px]'
							/>
						</FormField>
						<div className='grid grid-cols-2 gap-2 pt-1'>
							<Button
								size='sm'
								onClick={send}
								disabled={busy || !amount}
								className='gap-1.5 bg-emerald-600 hover:bg-emerald-700'
							>
								{busy ? (
									<Loader2 className='h-3.5 w-3.5 animate-spin' />
								) : (
									<Send className='h-3.5 w-3.5' />
								)}
								Send card
							</Button>
							<Button
								size='sm'
								variant='outline'
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
						</div>
					</div>
				</CardDialog>
			)}
		</>
	)
}

// ─── RevisionCardBtn ──────────────────────────────────────────────────────────

function RevisionCardBtn({
	requestId,
	onSent,
}: {
	requestId: string
	onSent?: () => void
}) {
	const [open, setOpen] = useState(false)
	const [title, setTitle] = useState('Revision Update')
	const [message, setMessage] = useState('')
	const [expectedAt, setExpectedAt] = useState('')
	const [busy, setBusy] = useState(false)

	const send = async () => {
		if (!message.trim()) {
			toast.error('Add a message for the client')
			return
		}
		setBusy(true)
		try {
			const res = await fetch(`/api/provider/requests/${requestId}/send-card`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					kind: 'revision_card',
					title,
					message,
					expectedAt: expectedAt || undefined,
				}),
			})
			const payload = await res.json().catch(() => ({}))
			if (!res.ok)
				throw new Error(payload?.error || 'Failed to send revision card')
			toast.success('Revision card sent to client')
			setTitle('Revision Update')
			setMessage('')
			setExpectedAt('')
			setOpen(false)
			onSent?.()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to send card')
		} finally {
			setBusy(false)
		}
	}

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				className='flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-2 text-[11px] font-medium text-slate-700 dark:text-foreground transition hover:bg-slate-50 dark:hover:bg-muted hover:shadow-sm'
			>
				<MessageSquareText className='h-3.5 w-3.5 shrink-0 text-amber-600' />
				<span className='hidden truncate xs:inline'>Revision reply</span>
			</button>

			{open && (
				<CardDialog onClose={() => setOpen(false)}>
					{/* Preview */}
					<div className='rounded-t-2xl bg-gradient-to-br from-amber-500 to-orange-600 p-4 text-white sm:p-5'>
						<div className='mb-2.5 flex items-center gap-2.5 sm:mb-3'>
							<div className='flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-card/20 sm:h-9 sm:w-9'>
								<RotateCcw className='h-4 w-4' />
							</div>
							<div>
								<p className='text-[13px] font-bold'>
									{title || 'Revision Update'}
								</p>
								<p className='text-[11px] opacity-60'>
									From your provider · CogniZap
								</p>
							</div>
						</div>
						{message && (
							<p className='text-[12px] leading-relaxed opacity-80 line-clamp-3'>
								{message}
							</p>
						)}
						{expectedAt && (
							<div className='mt-3 flex items-center gap-1.5 rounded-lg bg-white dark:bg-card/10 px-3 py-2'>
								<CalendarClock className='h-3.5 w-3.5 opacity-70' />
								<p className='text-[11px] opacity-80'>
									Expected: {new Date(expectedAt).toLocaleDateString()}
								</p>
							</div>
						)}
					</div>

					{/* Form */}
					<div className='space-y-2.5 p-3 sm:p-4'>
						<FormField label='Title'>
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className='h-8 text-[13px]'
							/>
						</FormField>
						<FormField label='Message to client'>
							<Textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder='Describe what was revised and what they can expect…'
								rows={2}
								className='resize-none text-[13px]'
								autoFocus
							/>
						</FormField>
						<FormField label='Expected completion (optional)'>
							<Input
								type='date'
								value={expectedAt}
								onChange={(e) => setExpectedAt(e.target.value)}
								className='h-8 text-[13px]'
							/>
						</FormField>
						<div className='grid grid-cols-2 gap-2 pt-1'>
							<Button
								size='sm'
								onClick={send}
								disabled={busy || !message.trim()}
								className='gap-1.5 bg-amber-500 hover:bg-amber-600'
							>
								{busy ? (
									<Loader2 className='h-3.5 w-3.5 animate-spin' />
								) : (
									<Send className='h-3.5 w-3.5' />
								)}
								Send card
							</Button>
							<Button
								size='sm'
								variant='outline'
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
						</div>
					</div>
				</CardDialog>
			)}
		</>
	)
}

// ─── DeliveryCardBtn ──────────────────────────────────────────────────────────

function DeliveryCardBtn({
	requestId,
	onSent,
}: {
	requestId: string
	onSent?: () => void
}) {
	const [open, setOpen] = useState(false)
	const [title, setTitle] = useState('Work Delivered')
	const [message, setMessage] = useState('')
	const [busy, setBusy] = useState(false)

	const send = async () => {
		setBusy(true)
		try {
			const res = await fetch(`/api/provider/requests/${requestId}/send-card`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					kind: 'delivery_card',
					title,
					message,
					locked: true,
				}),
			})
			const payload = await res.json().catch(() => ({}))
			if (!res.ok)
				throw new Error(payload?.error || 'Failed to send delivery card')
			toast.success('Delivery card sent to client')
			setTitle('Work Delivered')
			setMessage('')
			setOpen(false)
			onSent?.()
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Failed to send card')
		} finally {
			setBusy(false)
		}
	}

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				className='flex h-8 items-center justify-center gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-white dark:bg-card px-2 text-[11px] font-medium text-slate-700 dark:text-foreground transition hover:bg-slate-50 dark:hover:bg-muted hover:shadow-sm'
			>
				<PackageCheck className='h-3.5 w-3.5 shrink-0 text-indigo-600' />
				<span className='hidden truncate xs:inline'>Delivery note</span>
			</button>

			{open && (
				<CardDialog onClose={() => setOpen(false)}>
					{/* Preview */}
					<div className='rounded-t-2xl bg-gradient-to-br from-indigo-600 to-purple-700 p-4 text-white sm:p-5'>
						<div className='mb-2.5 flex items-center gap-2.5 sm:mb-3'>
							<div className='flex h-8 w-8 items-center justify-center rounded-full bg-white dark:bg-card/20 sm:h-9 sm:w-9'>
								<PackageCheck className='h-4 w-4' />
							</div>
							<div>
								<p className='text-[13px] font-bold'>
									{title || 'Work Delivered'}
								</p>
								<p className='text-[11px] opacity-60'>
									From your provider · CogniZap
								</p>
							</div>
						</div>
						{message && (
							<p className='text-[12px] leading-relaxed opacity-80 line-clamp-3'>
								{message}
							</p>
						)}
						<div className='mt-3 hidden items-center gap-1.5 rounded-lg bg-white dark:bg-card/10 px-3 py-2 xs:flex'>
							<CheckCircle className='h-3.5 w-3.5 opacity-70' />
							<p className='text-[11px] opacity-80'>
								Files are ready — complete payment to unlock
							</p>
						</div>
					</div>

					{/* Form */}
					<div className='space-y-2.5 p-3 sm:p-4'>
						<FormField label='Title'>
							<Input
								value={title}
								onChange={(e) => setTitle(e.target.value)}
								className='h-8 text-[13px]'
							/>
						</FormField>
						<FormField label='Message to client (optional)'>
							<Textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder='e.g. Your research paper is complete. Pay the balance to unlock the files.'
								rows={2}
								className='resize-none text-[13px]'
								autoFocus
							/>
						</FormField>
						<div className='grid grid-cols-2 gap-2 pt-1'>
							<Button
								size='sm'
								onClick={send}
								disabled={busy}
								className='gap-1.5 bg-indigo-600 hover:bg-indigo-700'
							>
								{busy ? (
									<Loader2 className='h-3.5 w-3.5 animate-spin' />
								) : (
									<Send className='h-3.5 w-3.5' />
								)}
								Send card
							</Button>
							<Button
								size='sm'
								variant='outline'
								onClick={() => setOpen(false)}
							>
								Cancel
							</Button>
						</div>
					</div>
				</CardDialog>
			)}
		</>
	)
}

// ─── CardDialog ───────────────────────────────────────────────────────────────

function CardDialog({
	children,
	onClose,
}: {
	children: React.ReactNode
	onClose: () => void
}) {
	return (
		<Drawer
			open
			onOpenChange={(open) => {
				if (!open) onClose()
			}}
		>
			<DrawerContent className='mx-auto max-h-[88vh] w-full max-w-sm overflow-hidden rounded-t-2xl border-slate-200 dark:border-border bg-white dark:bg-card p-0 shadow-mobile-sheet sm:left-1/2 sm:right-auto sm:top-1/2 sm:bottom-auto sm:max-h-[82vh] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl'>
				<div className='overflow-y-auto'>{children}</div>
			</DrawerContent>
		</Drawer>
	)
}

function FormField({
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

// ─── MessageBubble ────────────────────────────────────────────────────────────

import { FilePreview } from '@/components/provider/FilePreview'

interface MessageBubbleProps {
	message: SupportMessage
	isOwnMessage: boolean
	handleEditMessage: (messageId: string, newContent: string) => Promise<void>
	handleDeleteMessage: (messageId: string) => Promise<void>
	setReplyingTo: (
		reply: { messageId: string; senderName: string; preview: string } | null,
	) => void
	onFilesChanged?: () => void
	onReplacePackage?: () => void
}

function MessageBubble({
	message: msg,
	isOwnMessage,
	handleEditMessage,
	handleDeleteMessage,
	setReplyingTo,
	onFilesChanged,
	onReplacePackage,
}: MessageBubbleProps) {
	const [isEditing, setIsEditing] = useState(false)
	const [editContent, setEditContent] = useState(msg.content)
	const isDeleted = Boolean(msg.deletedAt)
	const isProvider = msg.senderRole === 'provider'
	const attachments = msg.attachments || []
	const hasDeliveryPackage = attachments.some(
		(att) => att.kind === 'preview_pages_card',
	)
	const canEditText = isOwnMessage && !hasDeliveryPackage && !isDeleted

	const handleSaveEdit = async () => {
		if (!editContent.trim()) return
		await handleEditMessage(msg.id, editContent)
		setIsEditing(false)
	}

	const handleCancelEdit = () => {
		setEditContent(msg.content)
		setIsEditing(false)
	}

	const handleReply = () => {
		const senderName = isProvider ? 'Provider' : 'Client'
		const preview =
			msg.content.length > 50 ? msg.content.slice(0, 50) + '...' : msg.content
		setReplyingTo({
			messageId: msg.id,
			senderName,
			preview,
		})
	}

	return (
		<div className={cn('flex', isProvider ? 'justify-end' : 'justify-start')}>
			<div
				className={cn(
					'max-w-[82%] rounded-2xl px-3 py-2 text-[13px]',
					isDeleted
						? 'border border-dashed border-slate-300 dark:border-border bg-slate-100 dark:bg-muted text-slate-500 dark:text-muted-foreground'
						: isProvider
							? 'rounded-br-sm bg-emerald-600 text-white'
							: 'rounded-bl-sm bg-slate-100 dark:bg-muted text-slate-900 dark:text-foreground',
				)}
			>
				{/* Reply indicator */}
				{msg.replyToMessage && !isDeleted && (
					<div
						className={cn(
							'mb-2 rounded-lg px-2 py-1 text-[11px] border-l-2',
							isProvider
								? 'bg-white dark:bg-card/10 border-white/30'
								: 'bg-slate-200 dark:bg-muted/50 border-slate-400 dark:border-border',
						)}
					>
						<p
							className={cn(
								'font-semibold',
								isProvider
									? 'text-white/70'
									: 'text-slate-600 dark:text-muted-foreground',
							)}
						>
							Replying to{' '}
							{msg.replyToMessage.senderRole === 'provider'
								? 'Provider'
								: 'Client'}
						</p>
						<p
							className={cn(
								'truncate',
								isProvider
									? 'text-white/60'
									: 'text-slate-500 dark:text-muted-foreground',
							)}
						>
							{msg.replyToMessage.content}
						</p>
					</div>
				)}

				{/* Message content or edit mode */}
				{isDeleted ? (
					<div className='flex items-center gap-2 py-1 italic leading-relaxed'>
						<Trash2 className='h-3.5 w-3.5 shrink-0' />
						<span>This message has been deleted</span>
					</div>
				) : isEditing ? (
					<div className='space-y-2'>
						<Textarea
							value={editContent}
							onChange={(e) => setEditContent(e.target.value)}
							className='min-h-20 resize-none border-0 bg-white dark:bg-card/10 text-white placeholder:text-white/50'
							autoFocus
						/>
						<div className='flex gap-1.5'>
							<Button
								size='sm'
								onClick={handleSaveEdit}
								className='h-7 gap-1 bg-white dark:bg-card text-emerald-600 hover:bg-white dark:bg-card/90'
							>
								<Pencil className='h-3 w-3' />
								Save
							</Button>
							<Button
								size='sm'
								variant='outline'
								onClick={handleCancelEdit}
								className='h-7 gap-1 bg-white dark:bg-card/10 border-white/20 text-white hover:bg-white dark:bg-card/20'
							>
								<X className='h-3 w-3' />
								Cancel
							</Button>
						</div>
					</div>
				) : (
					<>
						<p className='whitespace-pre-wrap break-words leading-relaxed'>
							{msg.content}
						</p>

						{msg.editedAt && (
							<p
								className={cn(
									'mt-1 text-[10px] italic',
									isProvider
										? 'text-white/50'
										: 'text-slate-400 dark:text-muted-foreground/70',
								)}
							>
								(edited)
							</p>
						)}
					</>
				)}

				{/* File attachments using FilePreview */}
				{attachments.length > 0 && !isEditing && !isDeleted && (
					<div className='mt-2 space-y-1.5'>
						{attachments.map((att, idx) => {
							const key = att.milestoneId ?? att.id ?? `${msg.id}-${idx}`
							if (att.kind === 'milestone_card') {
								return <MilestoneChatCard key={key} attachment={att} />
							}
							if (att.kind === 'payment_card') {
								return <PaymentChatCard key={key} attachment={att} />
							}
							if (att.kind === 'revision_card') {
								return <RevisionChatCard key={key} attachment={att} />
							}
							if (att.kind === 'delivery_card') {
								return <DeliveryChatCard key={key} attachment={att} />
							}
							if (att.kind === 'preview_pages_card') {
								return (
									<PreviewPagesChatCard
										key={key}
										attachment={att}
										onReplacePackage={onReplacePackage}
									/>
								)
							}
							if (att.kind === 'file_event') {
								return (
									<FileActivityCard
										key={key}
										attachment={att}
										isProvider={isProvider}
									/>
								)
							}
							// Regular file attachment - use FilePreview
							return (
								<ProviderManagedFileAttachment
									key={key}
									attachment={att}
									isProvider={isProvider}
									onChanged={onFilesChanged}
								/>
							)
						})}
					</div>
				)}

				{/* Reply is available for every message; edit/delete stay sender-owned. */}
				{!isEditing && !isDeleted && (
					<div className='mt-2 flex items-center gap-1'>
						<button
							onClick={handleReply}
							className={cn(
								'flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium transition',
								isProvider
									? 'text-white/70 hover:bg-white dark:bg-card/10 hover:text-white'
									: 'text-slate-500 dark:text-muted-foreground hover:bg-slate-200 hover:text-slate-900 dark:text-foreground',
							)}
							title='Reply'
						>
							<Reply className='h-3 w-3' />
							Reply
						</button>
						{canEditText && (
							<>
								<button
									onClick={() => setIsEditing(true)}
									className={cn(
										'flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium transition',
										isProvider
											? 'text-white/70 hover:bg-white dark:bg-card/10 hover:text-white'
											: 'text-slate-500 dark:text-muted-foreground hover:bg-slate-200 hover:text-slate-900 dark:text-foreground',
									)}
									title='Edit'
								>
									<Edit2 className='h-3 w-3' />
									Edit
								</button>
								<button
									onClick={() => handleDeleteMessage(msg.id)}
									className={cn(
										'flex h-6 items-center gap-1 rounded-md px-2 text-[10px] font-medium transition',
										isProvider
											? 'text-white/70 hover:bg-white dark:bg-card/10 hover:text-white'
											: 'text-slate-500 dark:text-muted-foreground hover:bg-slate-200 hover:text-slate-900 dark:text-foreground',
									)}
									title='Delete'
								>
									<Trash2 className='h-3 w-3' />
									Delete
								</button>
							</>
						)}
					</div>
				)}

				<p
					className={cn(
						'mt-1 text-[10px]',
						isDeleted
							? 'text-slate-400 dark:text-muted-foreground/70'
							: isProvider
								? 'text-white/60'
								: 'text-slate-400 dark:text-muted-foreground/70',
					)}
				>
					{formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true })}
					{isDeleted ? ' · Deleted' : null}
				</p>
			</div>
		</div>
	)
}

// ─── MilestoneChatCard (provider view – read-only) ─────────────────────────

function FileActivityCard({
	attachment,
	isProvider,
}: {
	attachment: Attachment
	isProvider: boolean
}) {
	const action = attachment.action === 'deleted' ? 'deleted' : 'edited'
	const fileName = attachment.name || attachment.label || 'Attachment'
	return (
		<div
			className={cn(
				'rounded-lg border px-2.5 py-2 text-[11px]',
				isProvider
					? 'border-white/20 bg-white dark:bg-card/10 text-white/80'
					: 'border-slate-200 dark:border-border bg-white dark:bg-card text-slate-600 dark:text-muted-foreground',
			)}
		>
			<p className='font-semibold'>
				{action === 'deleted' ? 'File deleted' : 'File edited'}
			</p>
			<p className='mt-0.5 truncate'>
				{action === 'edited' && attachment.previousName
					? `${attachment.previousName} -> ${fileName}`
					: fileName}
			</p>
		</div>
	)
}

function ProviderManagedFileAttachment({
	attachment,
	isProvider,
	onChanged,
}: {
	attachment: Attachment
	isProvider: boolean
	onChanged?: () => void
}) {
	const replacementInputRef = useRef<HTMLInputElement>(null)
	const [replacing, setReplacing] = useState(false)
	const [deleting, setDeleting] = useState(false)
	const fileId = String(attachment.fileId ?? attachment.id ?? '').trim()
	const fileName = attachment.name || attachment.label || 'Attachment'
	const deleted =
		attachment.status === 'deleted' || Boolean(attachment.deletedAt)
	const edited = attachment.status === 'edited' || Boolean(attachment.editedAt)

	const handleReplace = async (file: File | undefined) => {
		if (!fileId || !file) return
		setReplacing(true)
		try {
			const form = new FormData()
			form.append('file', file, file.name)
			const response = await fetch(`/api/files/${fileId}`, {
				method: 'PATCH',
				body: form,
			})
			const payload = await response.json().catch(() => ({}))
			if (!response.ok)
				throw new Error(payload?.error || 'Could not replace file')
			toast.success('File replaced and noted in chat')
			onChanged?.()
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Could not replace file',
			)
		} finally {
			setReplacing(false)
			if (replacementInputRef.current) replacementInputRef.current.value = ''
		}
	}

	const handleDelete = async () => {
		if (!fileId || deleted) return
		if (!confirm(`Delete "${fileName}" from this request?`)) return
		setDeleting(true)
		try {
			const response = await fetch(`/api/files/${fileId}`, {
				method: 'DELETE',
			})
			const payload = await response.json().catch(() => ({}))
			if (!response.ok)
				throw new Error(payload?.error || 'Could not delete file')
			toast.success('File deleted and noted in chat')
			onChanged?.()
		} catch (error) {
			toast.error(
				error instanceof Error ? error.message : 'Could not delete file',
			)
		} finally {
			setDeleting(false)
		}
	}

	if (deleted) {
		return (
			<div
				className={cn(
					'rounded-lg border px-3 py-2 text-[12px]',
					isProvider
						? 'border-white/20 bg-white dark:bg-card/10 text-white/75'
						: 'border-slate-200 dark:border-border bg-slate-50 dark:bg-muted text-slate-500 dark:text-muted-foreground',
				)}
			>
				<p className='font-medium line-through'>{fileName}</p>
				<p className='mt-0.5 text-[10px]'>
					This file was deleted by the provider.
				</p>
			</div>
		)
	}

	return (
		<div className='overflow-hidden rounded-lg'>
			<input
				ref={replacementInputRef}
				type='file'
				className='hidden'
				onChange={(event) => void handleReplace(event.target.files?.[0])}
			/>
			<FilePreview attachment={attachment} compact />
			<div
				className={cn(
					'mt-1 flex flex-wrap items-center gap-1 rounded-lg px-1.5 py-1',
					isProvider ? 'bg-white dark:bg-card/10' : 'bg-slate-50 dark:bg-muted',
				)}
			>
				{edited && (
					<span
						className={cn(
							'mr-auto text-[10px]',
							isProvider
								? 'text-white/65'
								: 'text-slate-500 dark:text-muted-foreground',
						)}
					>
						Edited
						{attachment.previousName ? ` from ${attachment.previousName}` : ''}
					</span>
				)}
				<Button
					type='button'
					size='sm'
					variant='ghost'
					disabled={!fileId || replacing || deleting}
					onClick={() => replacementInputRef.current?.click()}
					className={cn(
						'h-7 gap-1 px-2 text-[10px]',
						isProvider
							? 'text-white/80 hover:bg-white dark:bg-card/10 hover:text-white'
							: 'text-slate-600 dark:text-muted-foreground',
					)}
				>
					{replacing ? (
						<Loader2 className='h-3 w-3 animate-spin' />
					) : (
						<Upload className='h-3 w-3' />
					)}
					Replace
				</Button>
				<Button
					type='button'
					size='sm'
					variant='ghost'
					disabled={!fileId || replacing || deleting}
					onClick={() => void handleDelete()}
					className={cn(
						'h-7 gap-1 px-2 text-[10px]',
						isProvider
							? 'text-white/80 hover:bg-white dark:bg-card/10 hover:text-white'
							: 'text-red-600',
					)}
				>
					{deleting ? (
						<Loader2 className='h-3 w-3 animate-spin' />
					) : (
						<Trash2 className='h-3 w-3' />
					)}
					Delete
				</Button>
			</div>
		</div>
	)
}

function MilestoneChatCard({
	attachment,
}: {
	attachment: NonNullable<SupportMessage['attachments']>[number]
}) {
	const status = String(attachment.status ?? 'submitted')
	const revisionPending = status === 'revision_requested'
	const revisionMessage =
		attachment.latestRevisionMessage || attachment.userFeedback
	const files = Array.isArray(attachment.files) ? attachment.files : []

	return (
		<div
			className={cn(
				'mt-1.5 rounded-xl border bg-white dark:bg-card p-3 text-slate-900 dark:text-foreground shadow-sm',
				revisionPending
					? 'border-amber-200'
					: 'border-slate-200 dark:border-border',
			)}
		>
			<div className='flex items-start justify-between gap-2'>
				<div className='min-w-0'>
					<p className='flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blue-600'>
						<FileText className='h-3 w-3' /> Milestone
					</p>
					<p className='mt-0.5 truncate text-[13px] font-semibold'>
						{attachment.title || 'Milestone'}
					</p>
					{attachment.description && (
						<p className='mt-0.5 line-clamp-1 text-[11px] text-slate-500 dark:text-muted-foreground'>
							{attachment.description}
						</p>
					)}
				</div>
				<span
					className={cn(
						'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
						revisionPending
							? 'bg-amber-50 text-amber-700'
							: 'bg-blue-50 text-blue-700',
					)}
				>
					{fmtStatus(status)}
				</span>
			</div>
			<div className='mt-2 grid grid-cols-3 gap-1'>
				{[
					{ label: 'Submitted', active: true },
					{
						label: revisionPending ? 'Revision' : 'In review',
						active: true,
						warn: revisionPending,
					},
					{
						label: status === 'approved' ? 'Approved' : 'Pending',
						active: status === 'approved',
					},
				].map((step) => (
					<div key={step.label}>
						<div
							className={cn(
								'h-1 rounded-full',
								step.active
									? step.warn
										? 'bg-amber-400'
										: 'bg-blue-500'
									: 'bg-slate-200 dark:bg-muted',
							)}
						/>
						<p className='mt-0.5 truncate text-[10px] text-slate-400 dark:text-muted-foreground/70'>
							{step.label}
						</p>
					</div>
				))}
			</div>
			<div className='mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 dark:text-muted-foreground/70'>
				<span className='flex items-center gap-1'>
					<CalendarClock className='h-3 w-3' />
					{fmtDate(attachment.dueAt)}
				</span>
				<span>{files.length || attachment.fileCount || 0} files</span>
				<span>{attachment.revisionCount ?? 0} revisions</span>
			</div>
			{files.length > 0 && (
				<div className='mt-2 grid gap-1.5 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted p-2'>
					{files.map((file, index) => {
						const fileName =
							file.name ||
							file.label ||
							file.title ||
							`Milestone file ${index + 1}`
						const deleted = file.status === 'deleted' || Boolean(file.deletedAt)
						const edited = file.status === 'edited' || Boolean(file.editedAt)
						const locked = file.locked !== false || file.canDownload === false
						return (
							<div
								key={file.id || file.fileId || `${fileName}-${index}`}
								className='flex min-w-0 items-center gap-2 rounded-lg bg-white dark:bg-card px-2 py-1.5 text-[11px] text-slate-600 dark:text-muted-foreground'
							>
								{locked ? (
									<ClipboardCheck className='h-3.5 w-3.5 shrink-0 text-amber-600' />
								) : (
									<Paperclip className='h-3.5 w-3.5 shrink-0 text-blue-600' />
								)}
								<span
									className={cn(
										'truncate font-medium',
										deleted && 'line-through',
									)}
								>
									{fileName}
								</span>
								<span
									className={cn(
										'ml-auto shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold',
										deleted
											? 'bg-red-50 text-red-700'
											: locked
												? 'bg-amber-50 text-amber-700'
												: edited
													? 'bg-blue-50 text-blue-700'
													: 'bg-emerald-50 text-emerald-700',
									)}
								>
									{deleted
										? 'Deleted'
										: locked
											? 'Locked'
											: edited
												? 'Edited'
												: 'Ready'}
								</span>
							</div>
						)
					})}
				</div>
			)}
			{revisionMessage && (
				<div className='mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-800'>
					<p className='font-semibold'>
						{attachment.latestRevisionReason || 'Revision note'}
					</p>
					<p className='mt-0.5 whitespace-pre-wrap'>{revisionMessage}</p>
				</div>
			)}
			<div className='mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]'>
				<span className='flex h-7 items-center justify-center gap-1 rounded-lg bg-emerald-50 font-semibold text-emerald-700'>
					<CheckCircle className='h-3 w-3' /> Client can accept
				</span>
				<span className='flex h-7 items-center justify-center gap-1 rounded-lg bg-amber-50 font-semibold text-amber-700'>
					<RotateCcw className='h-3 w-3' /> Or revise
				</span>
			</div>
		</div>
	)
}

// ─── PaymentChatCard (provider view – status only) ────────────────────────

function PaymentChatCard({
	attachment,
}: {
	attachment: NonNullable<SupportMessage['attachments']>[number]
}) {
	const amt = Number(attachment.amount ?? 0)
	const currency = String(attachment.currency ?? 'GHS')
	const note = String(attachment.note ?? '')
	const paymentType = String(attachment.paymentType ?? 'payment')
	const paymentLabel =
		paymentType === 'deposit'
			? 'Deposit payment'
			: paymentType === 'final_balance'
				? 'Balance payment'
				: paymentType === 'partial_balance'
					? 'Milestone payment'
					: paymentType.replace(/_/g, ' ')

	return (
		<div className='mt-1.5 overflow-hidden rounded-xl border border-emerald-200 bg-white dark:bg-card shadow-sm'>
			<div className='bg-gradient-to-br from-emerald-600 to-teal-700 px-3 py-3 text-white'>
				<div className='flex items-center gap-2 mb-1.5'>
					<CreditCard className='h-4 w-4 opacity-80' />
					<p className='text-[11px] font-semibold opacity-80'>
						Payment Request
					</p>
				</div>
				<p className='text-[22px] font-bold tracking-tight'>
					{currency} {amt.toLocaleString()}
				</p>
				<p className='text-[11px] opacity-70 capitalize mt-0.5'>
					{paymentLabel}
				</p>
				{note && (
					<p className='text-[11px] opacity-60 mt-0.5 line-clamp-1'>{note}</p>
				)}
			</div>
			<div className='px-3 py-2 text-[11px] text-slate-500 dark:text-muted-foreground'>
				Awaiting client payment via Paystack
			</div>
		</div>
	)
}

// ─── RevisionChatCard (provider view) ────────────────────────────────────

function RevisionChatCard({
	attachment,
}: {
	attachment: NonNullable<SupportMessage['attachments']>[number]
}) {
	const title = String(attachment.title ?? 'Revision Update')
	const message = String(attachment.message ?? attachment.description ?? '')
	const expectedAt = attachment.expectedAt as string | undefined

	return (
		<div className='mt-1.5 overflow-hidden rounded-xl border border-amber-200 bg-white dark:bg-card shadow-sm'>
			<div className='bg-gradient-to-br from-amber-500 to-orange-600 px-3 py-3 text-white'>
				<div className='flex items-center gap-2 mb-1.5'>
					<RotateCcw className='h-4 w-4 opacity-80' />
					<p className='text-[11px] font-semibold opacity-80'>
						Revision Update
					</p>
				</div>
				<p className='text-[14px] font-bold'>{title}</p>
				{message && (
					<p className='text-[11px] opacity-75 mt-1 line-clamp-2 leading-relaxed'>
						{message}
					</p>
				)}
			</div>
			{expectedAt && (
				<div className='flex items-center gap-2 border-t border-amber-100 px-3 py-2 text-[11px] text-slate-500 dark:text-muted-foreground'>
					<CalendarClock className='h-3.5 w-3.5 text-amber-500' />
					Expected: {new Date(expectedAt).toLocaleDateString()}
				</div>
			)}
		</div>
	)
}

// ─── DeliveryChatCard (provider view) ────────────────────────────────────

function DeliveryChatCard({
	attachment,
}: {
	attachment: NonNullable<SupportMessage['attachments']>[number]
}) {
	const title = String(attachment.title ?? 'Work Delivered')
	const message = String(attachment.message ?? attachment.description ?? '')
	const locked = attachment.locked !== false

	return (
		<div className='mt-1.5 overflow-hidden rounded-xl border border-indigo-200 bg-white dark:bg-card shadow-sm'>
			<div className='bg-gradient-to-br from-indigo-600 to-purple-700 px-3 py-3 text-white'>
				<div className='flex items-center gap-2 mb-1.5'>
					<PackageCheck className='h-4 w-4 opacity-80' />
					<p className='text-[11px] font-semibold opacity-80'>Delivery Note</p>
				</div>
				<p className='text-[14px] font-bold'>{title}</p>
				{message && (
					<p className='text-[11px] opacity-75 mt-1 line-clamp-2 leading-relaxed'>
						{message}
					</p>
				)}
			</div>
			<div className='flex items-center gap-2 border-t border-indigo-100 px-3 py-2 text-[11px] text-slate-500 dark:text-muted-foreground'>
				<CheckCircle className='h-3.5 w-3.5 text-indigo-500' />
				{locked
					? 'Files locked — awaiting payment'
					: 'Files unlocked for download'}
			</div>
		</div>
	)
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function PreviewPagesChatCard({
	attachment,
	onReplacePackage,
}: {
	attachment: NonNullable<SupportMessage['attachments']>[number]
	onReplacePackage?: () => void
}) {
	const packageAttachment = attachment as typeof attachment & {
		pageCount?: number
		cleanFilesLocked?: boolean
		files?: Array<Record<string, unknown>>
	}
	const pageCount = Number(packageAttachment.pageCount ?? 0)
	const locked =
		packageAttachment.locked !== false ||
		packageAttachment.cleanFilesLocked !== false
	const files: Array<Record<string, unknown>> =
		Array.isArray(packageAttachment.files) && packageAttachment.files.length > 0
			? packageAttachment.files
			: [
					{
						name: 'Clean PDF file',
						fileName: 'Clean PDF file',
						fileType: 'application/pdf',
						locked: true,
					},
					{
						name: 'Editable DOCX file',
						fileName: 'Editable DOCX file',
						fileType:
							'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
						locked: true,
					},
				]
	return (
		<div className='mt-1.5 overflow-hidden rounded-xl border border-emerald-200 bg-white dark:bg-card shadow-sm'>
			<div className='bg-emerald-50 px-3 py-3 text-slate-900 dark:text-foreground'>
				<div className='mb-1.5 flex items-center gap-2'>
					<Images className='h-4 w-4 text-emerald-600' />
					<p className='text-[11px] font-semibold text-emerald-700'>
						Preview Pages Published
					</p>
				</div>
				<p className='text-[14px] font-bold'>
					{attachment.title || 'Preview pages ready'}
				</p>
				<p className='mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-muted-foreground'>
					{pageCount} page{pageCount === 1 ? '' : 's'} are visible to the client
					in chat. Clean PDF and DOCX stay locked until payment.
				</p>
			</div>
			<div className='space-y-2 border-t border-emerald-100 bg-white dark:bg-card p-2.5'>
				{files.slice(0, 2).map((file, index) => {
					const item = file
					const fileName = String(
						item.fileName ??
							item.name ??
							item.label ??
							(index === 0 ? 'Clean PDF file' : 'Editable DOCX file'),
					)
					const fileType = String(item.fileType ?? item.type ?? '')
					const isPdf =
						fileName.toLowerCase().endsWith('.pdf') || fileType.includes('pdf')
					const rawSize = Number(item.fileSize ?? item.size ?? 0)
					return (
						<div
							key={`${fileName}-${index}`}
							className='flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 dark:border-border bg-slate-50 dark:bg-muted p-2 text-slate-900 dark:text-foreground'
						>
							<div
								className={cn(
									'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
									isPdf ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600',
								)}
							>
								<FileText className='h-4 w-4' />
							</div>
							<div className='min-w-0 flex-1'>
								<p className='truncate text-[12px] font-semibold'>{fileName}</p>
								<p className='text-[10px] text-slate-500 dark:text-muted-foreground'>
									{isPdf ? 'PDF' : 'DOCX'}
									{rawSize > 0 ? ` - ${formatFileSize(rawSize)}` : ''} -{' '}
									{locked ? 'Locked for client' : 'Unlocked'}
								</p>
							</div>
							{locked ? (
								<ClipboardCheck className='h-4 w-4 shrink-0 text-amber-600' />
							) : (
								<CheckCircle className='h-4 w-4 shrink-0 text-emerald-600' />
							)}
						</div>
					)
				})}
				<div className='grid grid-cols-2 gap-1.5'>
					<Button
						type='button'
						size='sm'
						variant='outline'
						onClick={onReplacePackage}
						className='h-9 gap-1 text-[11px]'
					>
						<Upload className='h-3.5 w-3.5' />
						Replace package
					</Button>
					<Button
						type='button'
						size='sm'
						variant='outline'
						disabled
						className='h-9 gap-1 text-[11px]'
					>
						<Eye className='h-3.5 w-3.5' />
						Client preview
					</Button>
				</div>
			</div>
		</div>
	)
}

function formatFileSize(bytes: number) {
	if (!Number.isFinite(bytes) || bytes <= 0) return ''
	const units = ['B', 'KB', 'MB', 'GB']
	let value = bytes
	let unitIndex = 0
	while (value >= 1024 && unitIndex < units.length - 1) {
		value /= 1024
		unitIndex += 1
	}
	const rounded =
		unitIndex === 0 || value >= 10
			? Math.round(value).toString()
			: value.toFixed(1)
	return `${rounded} ${units[unitIndex]}`
}

function fmtStatus(v: string) {
	return v.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
function fmtDate(v?: string | null) {
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
