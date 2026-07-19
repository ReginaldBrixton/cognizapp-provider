/**
 * Quote tools — list and create quotes for support requests.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall } from '../api-client.js'
import { QUOTE_STATUSES, QUOTE_TYPES } from '../constants.js'
import { serializeResult } from '../utils.js'

export function registerQuoteTools(server: McpServer): void {
	server.registerTool(
		'provider_list_quotes',
		{
			title: 'List Quotes',
			description: `List all quotes created by the provider, newest first. Optionally filter by status.

When to use: To see which quotes are pending, accepted, or rejected. Pair with provider_get_request to inspect the underlying request.
Args:
  - status (string, optional): Filter by quote status — draft, sent, accepted, rejected, expired
Returns: Array of quote objects with id, requestId, requestTitle, taskId, quoteType, lineItems, totalAmount, currency, status, validUntil.`,
			inputSchema: {
				status: z
					.enum(QUOTE_STATUSES)
					.optional()
					.describe('Filter by quote status: draft, sent, accepted, rejected, expired'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async ({ status }) => {
			const result = await apiCall('/api/provider/quotes', {
				query: { status },
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_create_quote',
		{
			title: 'Create Quote',
			description: `Create and send a quote for a support request. The request status is updated to "quoted" automatically.

When to use: After reviewing a new submission (provider_get_request), send a quote with line items, deliverables, turnaround time, and revision policy. The client receives the quote and can accept or reject it.
Args:
  - requestId (string, required): The request ID (UUID) to quote for
  - quoteType (string, optional): Quote type — fixed, hourly, per_word, per_page, milestone (default fixed)
  - lineItems (array, optional): Itemised breakdown — each { description, quantity?, unitPrice?, total? }
  - deliverables (array, optional): List of deliverable descriptions
  - turnaroundHours (number, optional): Turnaround time in hours (default 24)
  - revisionPolicy (object, optional): { included, additionalCost, maxRevisions, revisionWindow } (defaults: 1 included, 0 cost, 1 max, 48h window)
  - terms (string, optional): Terms and conditions text
  - totalAmount (number, optional): Total amount in GHS (default 0)
  - currency (string, optional): Currency code (default "GHS")
  - status (string, optional): Initial quote status (default "sent")
  - validUntil (string, optional): Quote validity date (ISO 8601)
Returns: The created quote object.
Tip: Use provider_draft_quote to generate a suggested quote skeleton first, then refine and call this tool.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The request ID (UUID) to quote for'),
				quoteType: z
					.enum(QUOTE_TYPES)
					.optional()
					.describe('Quote type: fixed, hourly, per_word, per_page, milestone (default fixed)'),
				lineItems: z
					.array(
						z.object({
							description: z.string().describe('What this line item covers'),
							quantity: z.number().min(0).optional().describe('Quantity (default 1)'),
							unitPrice: z.number().min(0).optional().describe('Price per unit (GHS)'),
							total: z.number().min(0).optional().describe('Line total (GHS)'),
						}),
					)
					.optional()
					.describe('Itemised quote breakdown'),
				deliverables: z
					.array(z.string())
					.optional()
					.describe('List of deliverable descriptions'),
				turnaroundHours: z
					.number()
					.int()
					.min(1)
					.optional()
					.describe('Turnaround time in hours (default 24)'),
				revisionPolicy: z
					.object({
						included: z.number().int().min(0).optional().describe('Revisions included (default 1)'),
						additionalCost: z.number().min(0).optional().describe('Cost per additional revision (default 0)'),
						maxRevisions: z.number().int().min(0).optional().describe('Max revisions (default 1)'),
						revisionWindow: z.number().int().min(1).optional().describe('Revision window in hours (default 48)'),
					})
					.optional()
					.describe('Revision policy'),
				terms: z.string().optional().describe('Terms and conditions text'),
				totalAmount: z.number().min(0).optional().describe('Total amount in GHS (default 0)'),
				currency: z.string().optional().describe('Currency code (default "GHS")'),
				status: z.string().optional().describe('Initial quote status (default "sent")'),
				validUntil: z
					.string()
					.optional()
					.describe('Quote validity date (ISO 8601)'),
			},
			annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
		},
		async ({
			requestId,
			quoteType,
			lineItems,
			deliverables,
			turnaroundHours,
			revisionPolicy,
			terms,
			totalAmount,
			currency,
			status,
			validUntil,
		}) => {
			const data: Record<string, unknown> = { requestId }
			if (quoteType) data.quoteType = quoteType
			if (lineItems) data.lineItems = lineItems
			if (deliverables) data.deliverables = deliverables
			if (turnaroundHours !== undefined) data.turnaroundHours = turnaroundHours
			if (revisionPolicy) data.revisionPolicy = revisionPolicy
			if (terms) data.terms = terms
			if (totalAmount !== undefined) data.totalAmount = totalAmount
			if (currency) data.currency = currency
			if (status) data.status = status
			if (validUntil) data.validUntil = validUntil
			const result = await apiCall('/api/provider/quotes', {
				method: 'POST',
				body: JSON.stringify(data),
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}
