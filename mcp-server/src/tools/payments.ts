/**
 * Payment tools — discount decisions and payment policy overrides.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall } from '../api-client.js'
import {
	DISCOUNT_DECISION_STATUSES,
	PREVIEW_UNLOCK_OPTIONS,
	WORK_START_REQUIREMENTS,
} from '../constants.js'
import { serializeResult } from '../utils.js'

export function registerPaymentTools(server: McpServer): void {
	server.registerTool(
		'provider_discount_decision',
		{
			title: 'Discount Decision',
			description: `Approve or reject a discount for a support request. Can approve 1-100% discount (100% = full discount, no payment required).

When to use: When a client has requested a discount and you've decided. The backend records the decision and updates the request's payment amount accordingly.
Args:
  - requestId (string, required): The request ID (UUID)
  - status (string, required): "approved" or "rejected"
  - requestedAmount (number, optional): Original requested amount (GHS)
  - approvedAmount (number, optional): Amount to approve (0 if rejected)
  - discountPercent (number, optional): Discount percentage 1-100 (optional if approvedAmount is set)
  - reason (string, optional): Reason or note for the user
Returns: The updated request with the discount applied.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				status: z
					.enum(DISCOUNT_DECISION_STATUSES)
					.describe('Decision: "approved" or "rejected"'),
				requestedAmount: z.number().min(0).optional().describe('Original requested amount (GHS)'),
				approvedAmount: z
					.number()
					.min(0)
					.optional()
					.describe('Amount to approve (0 if rejected)'),
				discountPercent: z
					.number()
					.min(0)
					.max(100)
					.optional()
					.describe('Discount percentage 1-100 (optional if approvedAmount is set)'),
				reason: z.string().optional().describe('Reason or note for the user'),
			},
		},
		async ({ requestId, status, requestedAmount, approvedAmount, discountPercent, reason }) => {
			const data: Record<string, unknown> = { status }
			if (requestedAmount !== undefined) data.requestedAmount = requestedAmount
			if (approvedAmount !== undefined) data.approvedAmount = approvedAmount
			if (discountPercent !== undefined) data.discountPercent = discountPercent
			if (reason) data.reason = reason
			const result = await apiCall(
				`/api/provider/requests/${requestId}/discount-decision`,
				{ method: 'POST', body: JSON.stringify(data) },
			)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_override_payment_policy',
		{
			title: 'Override Payment Policy',
			description: `Override the payment policy for a specific request. Sets deposit percentage, preview unlock conditions, work start requirements, editable document requirement, and revision limits.

When to use: When the default payment policy doesn't fit a particular request — e.g. waiving the deposit for a trusted client, or requiring full payment upfront for a high-value project. The override is recorded in the audit log with the reason.
Args:
  - requestId (string, required): The request ID (UUID)
  - depositPercent (number, required): Required deposit percentage (0-100). 0 = no deposit, 100 = full payment upfront.
  - previewUnlock (string, required): When to unlock preview — "deposit" or "full_payment"
  - workStartRequirement (string, required): Requirement to start work — "none", "deposit", or "full_payment"
  - editableDocumentRequired (boolean, required): Whether an editable document (DOCX) is required for delivery
  - revisionsAllowed (number, optional): Number of revisions allowed (0-10)
  - reason (string, required): Reason for the override (shown in audit log, MIN 8 CHARACTERS)
Returns: The updated request with the new payment policy.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				depositPercent: z
					.number()
					.min(0)
					.max(100)
					.describe('Required deposit percentage (0-100). 0 = no deposit, 100 = full upfront.'),
				previewUnlock: z
					.enum(PREVIEW_UNLOCK_OPTIONS)
					.describe('When to unlock preview: "deposit" or "full_payment"'),
				workStartRequirement: z
					.enum(WORK_START_REQUIREMENTS)
					.describe('Requirement to start work: "none", "deposit", or "full_payment"'),
				editableDocumentRequired: z
					.boolean()
					.describe('Whether an editable document (DOCX) is required for delivery'),
				revisionsAllowed: z
					.number()
					.int()
					.min(0)
					.max(10)
					.optional()
					.describe('Number of revisions allowed (0-10)'),
				reason: z
					.string()
					.min(8)
					.describe('Reason for the override (shown in audit log, minimum 8 characters)'),
			},
		},
		async ({
			requestId,
			depositPercent,
			previewUnlock,
			workStartRequirement,
			editableDocumentRequired,
			revisionsAllowed,
			reason,
		}) => {
			const data: Record<string, unknown> = {
				depositPercent,
				previewUnlock,
				workStartRequirement,
				editableDocumentRequired: Boolean(editableDocumentRequired),
				reason,
			}
			if (revisionsAllowed !== undefined) data.revisionsAllowed = revisionsAllowed
			const result = await apiCall(
				`/api/provider/requests/${requestId}/payment-policy-override`,
				{ method: 'POST', body: JSON.stringify(data) },
			)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}
