/**
 * Discount code tools — list, create, update, delete discount codes.
 * (Distinct from per-request discount decisions — see provider_discount_decision.)
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall, apiCallRaw } from '../api-client.js'
import { DISCOUNT_CODE_STATUSES } from '../constants.js'
import { serializeResult } from '../utils.js'

export function registerDiscountCodeTools(server: McpServer): void {
	server.registerTool(
		'provider_list_discount_codes',
		{
			title: 'List Discount Codes',
			description: `List all discount codes created by the provider (cancelled codes excluded). Includes redemption history per code.

When to use: To see active/promo codes, their redemption counts, and which clients have used them.
Returns: Array of discount code objects with id, code, label, discountPercent, maxRedemptions, minimumAmount, eligibleServiceTags, status, expiresAt, redemptions[].`,
			inputSchema: {},
			annotations: { readOnlyHint: true },
		},
		async () => {
			const result = await apiCall('/api/provider/discount-codes')
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_create_discount_code',
		{
			title: 'Create Discount Code',
			description: `Create a new discount code that clients can apply at request submission.

When to use: To create a promo code for marketing, a loyalty discount, or a one-off courtesy. Codes can be custom or auto-generated (COGNI-<percent>-<random>).
Args:
  - discountPercent (number, required): Discount percentage 1-100
  - code (string, optional): Custom code (uppercase A-Z0-9- only). If omitted, auto-generated.
  - label (string, optional): Human-readable label for the code
  - maxRedemptions (number, optional): Max times the code can be redeemed (1-500, default 1)
  - minimumAmount (number, optional): Minimum request amount required to apply the code (GHS)
  - eligibleServiceTags (array, optional): Service tags the code is valid for (empty = all)
  - expiresAt (string, optional): Expiry date (ISO 8601)
Returns: The created discount code object.`,
			inputSchema: {
				discountPercent: z
					.number()
					.min(1)
					.max(100)
					.describe('Discount percentage 1-100'),
				code: z
					.string()
					.optional()
					.describe('Custom code (uppercase A-Z0-9- only). If omitted, auto-generated.'),
				label: z.string().optional().describe('Human-readable label for the code'),
				maxRedemptions: z
					.number()
					.int()
					.min(1)
					.max(500)
					.optional()
					.describe('Max times the code can be redeemed (1-500, default 1)'),
				minimumAmount: z
					.number()
					.min(0)
					.optional()
					.describe('Minimum request amount required to apply the code (GHS)'),
				eligibleServiceTags: z
					.array(z.string())
					.optional()
					.describe('Service tags the code is valid for (empty = all)'),
				expiresAt: z.string().optional().describe('Expiry date (ISO 8601)'),
			},
		},
		async ({
			discountPercent,
			code,
			label,
			maxRedemptions,
			minimumAmount,
			eligibleServiceTags,
			expiresAt,
		}) => {
			const data: Record<string, unknown> = { discountPercent }
			if (code) data.code = code
			if (label) data.label = label
			if (maxRedemptions !== undefined) data.maxRedemptions = maxRedemptions
			if (minimumAmount !== undefined) data.minimumAmount = minimumAmount
			if (eligibleServiceTags) data.eligibleServiceTags = eligibleServiceTags
			if (expiresAt) data.expiresAt = expiresAt
			const result = await apiCall('/api/provider/discount-codes', {
				method: 'POST',
				body: JSON.stringify(data),
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_update_discount_code',
		{
			title: 'Update Discount Code',
			description: `Update an existing discount code. All fields are optional — only provided fields are updated.

When to use: To pause a code (status=paused), extend its expiry, adjust the discount percent, or change the max redemptions.
Args:
  - codeId (string, required): The discount code ID (UUID)
  - label (string, optional): New label
  - discountPercent (number, optional): New discount percentage 1-100
  - maxRedemptions (number, optional): New max redemptions
  - minimumAmount (number, optional): New minimum amount (GHS) — pass null to clear
  - eligibleServiceTags (array, optional): New eligible service tags
  - status (string, optional): New status — active, paused, expired, cancelled
  - expiresAt (string, optional): New expiry date (ISO 8601) — pass null to clear
Returns: The updated discount code object.`,
			inputSchema: {
				codeId: z.string().min(1).describe('The discount code ID (UUID)'),
				label: z.string().optional().describe('New label'),
				discountPercent: z
					.number()
					.min(1)
					.max(100)
					.optional()
					.describe('New discount percentage 1-100'),
				maxRedemptions: z
					.number()
					.int()
					.min(1)
					.max(500)
					.optional()
					.describe('New max redemptions (1-500)'),
				minimumAmount: z
					.number()
					.min(0)
					.nullable()
					.optional()
					.describe('New minimum amount (GHS) — pass null to clear'),
				eligibleServiceTags: z
					.array(z.string())
					.optional()
					.describe('New eligible service tags'),
				status: z
					.enum(DISCOUNT_CODE_STATUSES)
					.optional()
					.describe('New status: active, paused, expired, cancelled'),
				expiresAt: z
					.string()
					.nullable()
					.optional()
					.describe('New expiry date (ISO 8601) — pass null to clear'),
			},
			annotations: { idempotentHint: true },
		},
		async ({
			codeId,
			label,
			discountPercent,
			maxRedemptions,
			minimumAmount,
			eligibleServiceTags,
			status,
			expiresAt,
		}) => {
			const data: Record<string, unknown> = {}
			if (label !== undefined) data.label = label
			if (discountPercent !== undefined) data.discountPercent = discountPercent
			if (maxRedemptions !== undefined) data.maxRedemptions = maxRedemptions
			if (minimumAmount !== undefined) data.minimumAmount = minimumAmount
			if (eligibleServiceTags !== undefined) data.eligibleServiceTags = eligibleServiceTags
			if (status !== undefined) data.status = status
			if (expiresAt !== undefined) data.expiresAt = expiresAt
			const result = await apiCallRaw(`/api/provider/discount-codes/${codeId}`, {
				method: 'PUT',
				body: JSON.stringify(data),
			})
			return { content: [{ type: 'text', text: serializeResult(result.data) }] }
		},
	)

	server.registerTool(
		'provider_delete_discount_code',
		{
			title: 'Delete Discount Code',
			description: `Cancel/delete a discount code. The code is marked as cancelled (soft delete) so existing redemptions remain auditable.

When to use: When a code should no longer be redeemable. Prefer provider_update_discount_code with status=paused for a temporary stop.
Args:
  - codeId (string, required): The discount code ID (UUID)
Returns: Raw response (typically a confirmation object).`,
			inputSchema: {
				codeId: z.string().min(1).describe('The discount code ID (UUID)'),
			},
			annotations: { destructiveHint: true, idempotentHint: true },
		},
		async ({ codeId }) => {
			const result = await apiCallRaw(`/api/provider/discount-codes/${codeId}`, {
				method: 'DELETE',
			})
			return { content: [{ type: 'text', text: serializeResult(result.data) }] }
		},
	)
}
