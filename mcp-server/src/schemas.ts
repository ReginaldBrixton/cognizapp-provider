/**
 * Shared Zod schemas and reusable shapes for the CognizApp Provider MCP server.
 *
 * The MCP TypeScript SDK's `registerTool` accepts a raw Zod shape
 * (`{ key: z.Schema }`) rather than `z.object(...)`. The shapes below are
 * exported as plain objects so they can be spread into a tool's `inputSchema`.
 */

import { z } from 'zod'
import {
	AVAILABILITY_STATUSES,
	DEADLINE_FILTERS,
	DISCOUNT_CODE_STATUSES,
	DISCOUNT_DECISION_STATUSES,
	FILE_PURPOSES,
	MILESTONE_STATUSES,
	ORDER_STATUSES,
	PAYMENT_STATUSES,
	PAYMENT_TYPES,
	PREVIEW_UNLOCK_OPTIONS,
	PRIORITY_FILTERS,
	QUOTE_STATUSES,
	QUOTE_TYPES,
	REQUEST_CARD_KINDS,
	REQUEST_STATUSES,
	WORK_START_REQUIREMENTS,
} from './constants.js'

// ─── Pagination ─────────────────────────────────────────────────────────────

export const paginationShape = {
	limit: z
		.number()
		.int()
		.min(1)
		.max(200)
		.default(50)
		.describe('Maximum number of items to return (1-200, default 50)'),
	offset: z
		.number()
		.int()
		.min(0)
		.default(0)
		.describe('Number of items to skip for pagination (default 0)'),
}

// ─── Common identifiers ─────────────────────────────────────────────────────

export const requestIdShape = {
	requestId: z.string().min(1).describe('The support request ID (UUID)'),
}

export const milestoneIdShape = {
	milestoneId: z.string().min(1).describe('The milestone ID (UUID)'),
}

export const threadIdShape = {
	threadId: z.string().min(1).describe('The support message thread ID (UUID)'),
}

export const fileIdShape = {
	fileId: z.string().min(1).describe('The support file ID (UUID)'),
}

// ─── Enums (reused across tools) ────────────────────────────────────────────

export const requestStatusSchema = z
	.enum(REQUEST_STATUSES)
	.describe('Filter by request status')
	.optional()

export const paymentStatusSchema = z
	.enum(PAYMENT_STATUSES)
	.describe('Filter by payment status')
	.optional()

export const deadlineFilterSchema = z
	.enum(DEADLINE_FILTERS)
	.describe('Filter by deadline window: overdue, 24h, 7d, or none')
	.optional()

export const priorityFilterSchema = z
	.enum(PRIORITY_FILTERS)
	.describe('Filter by priority: high (priority plan) or standard')
	.optional()

export const milestoneStatusSchema = z.enum(MILESTONE_STATUSES)

export const requestCardKindSchema = z
	.enum(REQUEST_CARD_KINDS)
	.describe('Card kind: payment_card, revision_card, or delivery_card')

export const paymentTypeSchema = z
	.enum(PAYMENT_TYPES)
	.describe('Payment type: deposit, final_balance, partial_balance, or full_payment')

export const previewUnlockSchema = z.enum(PREVIEW_UNLOCK_OPTIONS)

export const workStartRequirementSchema = z.enum(WORK_START_REQUIREMENTS)

export const filePurposeSchema = z.enum(FILE_PURPOSES).optional()

export const quoteTypeSchema = z.enum(QUOTE_TYPES).optional()

export const quoteStatusSchema = z.enum(QUOTE_STATUSES).optional()

export const orderStatusSchema = z.enum(ORDER_STATUSES)

export const discountCodeStatusSchema = z.enum(DISCOUNT_CODE_STATUSES).optional()

export const availabilityStatusSchema = z.enum(AVAILABILITY_STATUSES).optional()

export const discountDecisionStatusSchema = z.enum(DISCOUNT_DECISION_STATUSES)

// ─── File/attachment payloads ───────────────────────────────────────────────

export const base64FileShape = {
	fileName: z.string().min(1).describe('Name of the file (e.g. "report.pdf")'),
	fileContentBase64: z
		.string()
		.min(1)
		.describe(
			'Base64-encoded file content. May include a "data:<mime>;base64," prefix or be raw base64.',
		),
	contentType: z
		.string()
		.default('application/octet-stream')
		.describe('MIME type of the file (e.g. application/pdf, image/png)'),
}

export const attachmentShape = {
	attachments: z
		.array(
			z.object({
				id: z.string().optional().describe('Existing file ID to reference'),
				name: z.string().optional().describe('Display name of the file'),
				url: z.string().optional().describe('Public URL of the file'),
			}),
		)
		.optional()
		.describe('Optional file references to attach to the message'),
}

// ─── Quote ──────────────────────────────────────────────────────────────────

export const quoteLineItemShape = {
	lineItems: z
		.array(
			z.object({
				description: z.string().describe('What this line item covers'),
				quantity: z.number().min(0).default(1).optional(),
				unitPrice: z.number().min(0).optional().describe('Price per unit (GHS)'),
				total: z.number().min(0).optional().describe('Line total (GHS)'),
			}),
		)
		.optional()
		.describe('Itemised quote breakdown'),
}

export const revisionPolicyShape = {
	revisionPolicy: z
		.object({
			included: z.number().int().min(0).default(1).optional(),
			additionalCost: z.number().min(0).default(0).optional(),
			maxRevisions: z.number().int().min(0).default(1).optional(),
			revisionWindow: z.number().int().min(1).default(48).optional(),
		})
		.optional()
		.describe('Revision policy: included count, additional cost, max revisions, window (hours)'),
}

// ─── Provider settings ──────────────────────────────────────────────────────

export const providerSettingsShape = {
	displayName: z.string().min(1).max(120).optional().describe('Provider display name'),
	bio: z.string().max(1000).optional().describe('Provider bio (max 1000 chars)'),
	timezone: z.string().max(80).optional().describe('IANA timezone (e.g. Africa/Accra)'),
	availabilityStatus: availabilityStatusSchema.describe('Availability status'),
	weeklyCapacity: z
		.number()
		.int()
		.min(0)
		.max(168)
		.optional()
		.describe('Weekly capacity in hours (0-168)'),
	responseTargetHours: z
		.number()
		.int()
		.min(1)
		.max(168)
		.optional()
		.describe('Target response time in hours (1-168)'),
	notificationPreferences: z
		.record(z.string(), z.any())
		.optional()
		.describe('Notification preferences (key/value map)'),
	workloadPreferences: z
		.record(z.string(), z.any())
		.optional()
		.describe('Workload preferences (key/value map)'),
}
