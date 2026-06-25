/**
 * Support system types for requests, orders, quotes, and messaging
 */

// Request types
export type RequestStatus =
	| 'draft'
	| 'submitted'
	| 'payment_pending'
	| 'payment_failed'
	| 'ai_reviewed'
	| 'admin_review'
	| 'needs_user_info'
	| 'quote_sent'
	| 'awaiting_deposit'
	| 'in_progress'
	| 'error_resend_required'
	| 'work_ready'
	| 'revision_requested'
	| 'revision_in_progress'
	| 'completed'
	| 'under_review'
	| 'quoted'
	| 'accepted'
	| 'rejected'
	| 'cancelled'
	| 'needs_info'
	| 'converted_to_order'
	| 'closed'

export interface SupportRequest {
	id: string
	userId: string
	workspaceId?: string | null
	projectId?: string | null
	collectionId?: string | null
	title: string
	description: string
	subject?: string
	category?: string
	priority?: 'low' | 'medium' | 'high' | 'urgent'
	status: RequestStatus
	currency?: string
	paymentStatus?: PaymentStatus
	deliveryStatus?: DeliveryStatus
	paymentMode?: PaymentMode
	paymentAmount?: number
	quotedAmount?: number
	depositPercent?: number
	depositAmount?: number
	balanceAmount?: number
	paymentTransactionId?: string
	paymentProofFileId?: string
	paymentProofFileUrl?: string
	paymentProofFileName?: string
	paymentVerifiedAt?: string
	paymentVerifiedBy?: string
	paymentNotes?: string
	tags?: string[]
	serviceTags?: string[]
	attachments?: Attachment[]
	deadline?: string
	budgetMin?: number
	budgetMax?: number
	wordCount?: number
	pages?: number
	academicLevel?: string
	outputExpectation?: string
	adminNotes?: string
	userNotes?: string
	aiReview?: AiRequestReview
	scopeLockedAt?: string
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
	createdAt: string
	updatedAt: string
}

export interface SupportPreviewPage {
	id: string
	requestId: string
	pageNumber: number
	generationStatus: 'pending' | 'processing' | 'ready' | 'failed'
	accessTier: 'free'
	fileName?: string
	fileType?: string
	fileSize?: number | string
	publishedAt?: string | null
	createdAt?: string | null
	canView: boolean
	contentUrl?: string | null
}

export interface SupportFile {
	id: string
	requestId?: string
	orderId?: string | null
	userKeyId?: string
	fileName: string
	fileUrl: string
	fileType?: string
	fileSize?: number | string
	purpose?: string
	storageProvider?: string
	externalFileId?: string | null
	externalFileUrl?: string | null
	externalFolderId?: string | null
	externalUploadStatus?: 'stored_locally' | 'pending' | 'uploaded' | 'failed' | string
	externalUploadError?: string | null
	externalUploadedAt?: string | null
	createdAt: string
}

export interface SupportDelivery {
	id: string
	requestId: string
	fileId: string
	fileName?: string
	fileUrl?: string
	fileType?: string
	fileSize?: number | string
	deliveryNote?: string
	isLocked?: boolean
	uploadedByAdminId?: string
	downloadedAt?: string | null
	unlockedAt?: string | null
	storageProvider?: string
	externalFileId?: string | null
	externalFileUrl?: string | null
	externalUploadStatus?: string | null
	createdAt: string
}

export type SupportMilestoneStatus =
	| 'pending'
	| 'active'
	| 'submitted'
	| 'revision_requested'
	| 'approved'
	| 'auto_approved'
	| 'disputed'
	| 'cancelled'

export interface SupportMilestone {
	id: string
	requestId: string
	title: string
	description?: string
	dueAt?: string | null
	status: SupportMilestoneStatus
	providerNotes?: string
	userFeedback?: string
	revisionCount?: number
	revisionRequestCount?: number
	latestRevisionReason?: string
	latestRevisionMessage?: string
	latestRevisionStatus?: string
	latestRevisionAt?: string | null
	submittedAt?: string | null
	approvedAt?: string | null
	autoApprovedAt?: string | null
	cancelledAt?: string | null
	fileCount?: number
	files?: Attachment[]
	createdAt: string
	updatedAt?: string
}

export interface DriveFile {
	id: string
	name: string
	mimeType?: string
	webViewLink?: string
	thumbnailLink?: string
	shared?: boolean
	trashed?: boolean
}

export type PaymentMode =
	| 'before_work'
	| 'after_completion'
	| 'deposit_then_balance'

export type DeliveryStatus =
	| 'not_started'
	| 'working'
	| 'uploaded_locked'
	| 'download_unlocked'
	| 'downloaded'
	| 'revision_requested'
	| 'accepted'

export type AiRequestReview = {
	ok: boolean
	requestType:
	| 'assignment'
	| 'research_paper'
	| 'data_analysis'
	| 'presentation'
	| 'web_app'
	| 'document_editing'
	| 'other'
	complexity: 'low' | 'medium' | 'high' | 'very_high'
	budgetReview: {
		submittedBudget: number
		currency: 'GHS'
		rating: 'too_low' | 'fair' | 'high' | 'needs_admin_review'
		reason: string
		suggestedMinimum: number | null
		suggestedMaximum: number | null
	}
	deadlineReview: {
		rating:
		| 'comfortable'
		| 'tight'
		| 'risky'
		| 'impossible'
		| 'unknown'
		| 'needs_admin_review'
		reason: string
	}
	paymentRecommendation: {
		mode: PaymentMode
		depositRequired: boolean
		depositPercent: 0 | 50 | 60 | 70 | number
		depositAmount: number
		balanceAmount: number
		reason: string
	}
	scopeReview: {
		scopeStatus: 'clear' | 'unclear' | 'missing_info' | 'new_ticket_required'
		summary: string
		missingItems: string[]
	}
	adminRecommendation: {
		action:
		| 'accept'
		| 'request_more_info'
		| 'send_quote'
		| 'require_deposit'
		| 'reject'
		| 'mark_as_new_ticket_required'
		priority: 'low' | 'normal' | 'high' | 'urgent'
		messageToAdmin: string
	}
	suggestedUserMessage: {
		title: string
		message: string
	}
	uiBadges: string[]
}

// Order types
export type OrderStatus =
	| 'pending'
	| 'in_progress'
	| 'review'
	| 'revision'
	| 'completed'
	| 'cancelled'
	| 'disputed'
	| 'active'
	| 'waiting_on_client'
	| 'delivered'
	| 'revision_requested'

export type PaymentStatus =
	| 'unpaid'
	| 'pending'
	| 'deposit_required'
	| 'deposit_pending_verification'
	| 'deposit_paid'
	| 'final_payment_required'
	| 'final_payment_pending_verification'
	| 'paystack_pending'
	| 'paid'
	| 'refunded'
	| 'failed'
	| 'cancelled'

export interface SupportOrder {
	id: string
	requestId: string
	clientId: string
	providerId: string
	quoteId: string
	status: OrderStatus
	paymentStatus: PaymentStatus
	amount: number
	totalAmount: number
	currency: string
	deliverables?: SupportDeliverable[]
	dueDate?: string
	deadline?: string
	revisionCount?: number
	maxRevisions?: number
	scope?: OrderScope
	createdAt: string
	updatedAt: string
}

export interface OrderScope {
	description?: string
	deliverables: string[]
}

export interface SupportDeliverable {
	id: string
	name: string
	description?: string
	status: 'pending' | 'in_progress' | 'submitted' | 'approved' | 'rejected'
	feedback?: string
	submittedAt?: string
	files?: Attachment[]
}

// Alias for backward compatibility
export type Deliverable = SupportDeliverable

// Quote types
export type QuoteType = 'fixed' | 'hourly' | 'milestone'

export interface QuoteLineItem {
	id: string
	description: string
	serviceName?: string
	quantity: number
	unitPrice: number
	amount: number
}

export interface RevisionPolicy {
	included: number
	additionalCost: number
	maxRevisions: number
	revisionWindow: number
}

export interface Quote {
	id: string
	requestId: string
	providerId: string
	type: QuoteType
	lineItems: QuoteLineItem[]
	deliverables: string[]
	turnaroundHours: number
	revisionPolicy: RevisionPolicy
	terms?: string
	totalAmount: number
	currency: string
	status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
	validUntil?: string
	createdAt: string
	updatedAt: string
}

// Alias for components using SupportQuote
export type SupportQuote = Quote

// Messaging types
export interface SupportThread {
	id: string
	requestId?: string
	requestTitle?: string | null
	requestTaskId?: string | null
	requestStatus?: RequestStatus | string | null
	orderId?: string
	type?: 'general' | 'request' | 'order' | 'ai' | string
	status?: 'active' | 'completed' | 'archived' | string
	completedAt?: string | null
	participants: ThreadParticipant[]
	lastMessage?: ThreadMessage
	lastMessageAt?: string
	unreadCount?: number
	createdAt: string
	updatedAt: string
}

export interface ThreadParticipant {
	userId: string
	name: string
	avatar?: string
	role: 'client' | 'provider'
}

export interface ThreadMessage {
	id: string
	threadId: string
	senderId?: string
	senderKeyId?: string
	senderName: string
	senderRole: 'client' | 'provider' | 'ai'
	content: string
	attachments?: Attachment[]
	mentions?: Array<Record<string, unknown>>
	fileReferences?: Array<Record<string, unknown>>
	aiReasoning?: string
	promptHash?: string
	structuredOutput?: Record<string, unknown>
	// Reply, edit, delete functionality
	replyToMessageId?: string | null
	replyToMessage?: Partial<ThreadMessage> | null
	editedAt?: string | null
	deletedAt?: string | null
	deletedBy?: string | null
	canEdit?: boolean
	canDelete?: boolean
	editHistory?: Array<{
		content: string
		editedAt: string
		editedBy: string
	}>
	createdAt: string
	readBy?: string[]
}

// Alias for components using SupportMessage
export type SupportMessage = ThreadMessage

export interface Attachment {
	id?: string
	fileId?: string
	kind?: string
	action?: string
	milestoneId?: string
	requestId?: string
	name?: string
	label?: string
	previousName?: string
	title?: string
	description?: string
	status?: string
	editedAt?: string | null
	deletedAt?: string | null
	dueAt?: string | null
	revisionCount?: number
	fileCount?: number
	userFeedback?: string
	latestRevisionReason?: string
	latestRevisionMessage?: string
	latestRevisionStatus?: string
	latestRevisionAt?: string | null
	amount?: number
	currency?: string
	note?: string
	paymentType?: string
	message?: string
	expectedAt?: string | null
	locked?: boolean
	canPreview?: boolean
	canDownload?: boolean
	url?: string
	externalUrl?: string | null
	type?: string
	size?: number
	files?: Attachment[]
	pageCount?: number
	cleanFilesLocked?: boolean
	deliveredAt?: string
	pages?: SupportPreviewPage[]
}

// Activity types
export interface TimelineEvent {
	id: string
	type: string
	action?: string
	description: string
	userId?: string
	userName?: string
	metadata?: Record<string, unknown>
	createdAt: string
}

// Alias for components using TimelineEntry
export type TimelineEntry = TimelineEvent

// Provider notes
export interface ProviderNote {
	id: string
	requestId: string
	providerId: string
	content: string
	isPrivate: boolean
	createdAt: string
	updatedAt: string
}

// Order with next action for provider dashboard
export interface OrderWithNextAction extends SupportOrder {
	nextAction?: {
		label: string
		action: () => void
	}
}
