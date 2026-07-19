/**
 * Shared constants and enums for the CognizApp Provider MCP server.
 *
 * These mirror the values accepted by the backend's provider endpoints
 * (src/modules/support-inbox/routes.ts in cognizapp-backend-api). Keep this
 * file as the single source of truth so tool descriptions and Zod schemas
 * stay in sync.
 */

/** Maximum character count for a single MCP text response. */
export const CHARACTER_LIMIT = 25_000

/** Default backend URL when no env var is set. */
export const DEFAULT_PROVIDER_URL = 'http://localhost:3001'

// ─── Request lifecycle ──────────────────────────────────────────────────────

export const REQUEST_STATUSES = [
	'submitted',
	'under_review',
	'quoted',
	'accepted',
	'payment_pending',
	'in_progress',
	'work_ready',
	'completed',
	'cancelled',
	'closed',
	'refunded',
	'error_resend_required',
	'converted_to_order',
	'revision_in_progress',
	'revision_requested',
] as const
export type RequestStatus = (typeof REQUEST_STATUSES)[number]

export const PAYMENT_STATUSES = [
	'unpaid',
	'deposit_required',
	'deposit_paid',
	'final_payment_required',
	'paid',
	'partial_balance',
] as const
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number]

export const DEADLINE_FILTERS = ['overdue', '24h', '7d', 'none'] as const
export type DeadlineFilter = (typeof DEADLINE_FILTERS)[number]

export const PRIORITY_FILTERS = ['high', 'standard'] as const
export type PriorityFilter = (typeof PRIORITY_FILTERS)[number]

// ─── Milestones ─────────────────────────────────────────────────────────────

export const MILESTONE_STATUSES = [
	'pending',
	'active',
	'submitted',
	'revision_requested',
	'approved',
	'cancelled',
] as const
export type MilestoneStatus = (typeof MILESTONE_STATUSES)[number]

// ─── Cards ──────────────────────────────────────────────────────────────────

export const REQUEST_CARD_KINDS = ['payment_card', 'revision_card', 'delivery_card'] as const
export type RequestCardKind = (typeof REQUEST_CARD_KINDS)[number]

export const PAYMENT_TYPES = [
	'deposit',
	'final_balance',
	'partial_balance',
	'full_payment',
] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]

// ─── Payment policy ─────────────────────────────────────────────────────────

export const PREVIEW_UNLOCK_OPTIONS = ['deposit', 'full_payment'] as const
export type PreviewUnlockOption = (typeof PREVIEW_UNLOCK_OPTIONS)[number]

export const WORK_START_REQUIREMENTS = ['none', 'deposit', 'full_payment'] as const
export type WorkStartRequirement = (typeof WORK_START_REQUIREMENTS)[number]

// ─── Files ──────────────────────────────────────────────────────────────────

export const FILE_PURPOSES = [
	'request_attachment',
	'milestone_upload',
	'delivery',
	'preview',
	'revision',
] as const
export type FilePurpose = (typeof FILE_PURPOSES)[number]

// ─── Quotes ─────────────────────────────────────────────────────────────────

export const QUOTE_TYPES = ['fixed', 'hourly', 'per_word', 'per_page', 'milestone'] as const
export type QuoteType = (typeof QUOTE_TYPES)[number]

export const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected', 'expired'] as const
export type QuoteStatus = (typeof QUOTE_STATUSES)[number]

// ─── Orders ─────────────────────────────────────────────────────────────────

export const ORDER_STATUSES = [
	'pending',
	'confirmed',
	'in_progress',
	'completed',
	'cancelled',
	'refunded',
] as const
export type OrderStatus = (typeof ORDER_STATUSES)[number]

// ─── Discount codes ─────────────────────────────────────────────────────────

export const DISCOUNT_CODE_STATUSES = ['active', 'paused', 'expired', 'cancelled'] as const
export type DiscountCodeStatus = (typeof DISCOUNT_CODE_STATUSES)[number]

// ─── Provider settings ──────────────────────────────────────────────────────

export const AVAILABILITY_STATUSES = ['available', 'busy', 'unavailable', 'away'] as const
export type AvailabilityStatus = (typeof AVAILABILITY_STATUSES)[number]

// ─── Discount decision ──────────────────────────────────────────────────────

export const DISCOUNT_DECISION_STATUSES = ['approved', 'rejected'] as const
export type DiscountDecisionStatus = (typeof DISCOUNT_DECISION_STATUSES)[number]
