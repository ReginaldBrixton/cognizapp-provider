/**
 * Request tools — list, get, and update the status of support requests.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall, apiCallRaw } from '../api-client.js'
import {
	deadlineFilterSchema,
	paymentStatusSchema,
	priorityFilterSchema,
	requestStatusSchema,
} from '../schemas.js'
import { serializeResult } from '../utils.js'

export function registerRequestTools(server: McpServer): void {
	server.registerTool(
		'provider_list_requests',
		{
			title: 'List Support Requests',
			description: `List support requests for the provider with optional filters. Returns up to 200 requests sorted by priority then deadline then recency.

When to use: To browse the request queue. Combine filters to narrow down — e.g. status=submitted to see new submissions, or deadline=overdue to see what's late.
Args (all optional):
  - status: submitted, under_review, quoted, accepted, payment_pending, in_progress, work_ready, completed, cancelled, closed, refunded, etc.
  - paymentStatus: unpaid, deposit_required, deposit_paid, final_payment_required, paid, partial_balance
  - deadline: overdue, 24h, 7d, none
  - priority: high (priority plan clients) or standard
  - subscription: subscription plan id (e.g. free, pro)
Returns: Array of request objects with id, title, status, paymentStatus, client info, deadlines, file/message counts.
Tip: Use provider_triage_inbox for a pre-prioritised summary instead of calling this with multiple filters.`,
			inputSchema: {
				status: requestStatusSchema,
				paymentStatus: paymentStatusSchema,
				deadline: deadlineFilterSchema,
				priority: priorityFilterSchema,
				subscription: z
					.string()
					.optional()
					.describe('Filter by subscription plan id (e.g. "free", "pro")'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async (args) => {
			const result = await apiCall('/api/provider/requests', {
				query: {
					status: args.status,
					paymentStatus: args.paymentStatus,
					deadline: args.deadline,
					priority: args.priority,
					subscription: args.subscription,
				},
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_get_request',
		{
			title: 'Get Support Request',
			description: `Get detailed information about a single support request by ID.

When to use: When you have a request ID and need the full picture — description, attachments, payment policy, milestones, AI review, client info.
Args:
  - requestId (string, required): The request ID (UUID)
Returns: Full request object.
Don't use when: You want a holistic view including milestones + messages + files in one call — use provider_request_summary instead.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async ({ requestId }) => {
			const result = await apiCall(`/api/provider/requests/${requestId}`)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_update_request_status',
		{
			title: 'Update Request Status',
			description: `Update the status of a support request (timeline update). Optionally include a note.

When to use: To move a request through its lifecycle (e.g. under_review → in_progress). The backend validates allowed transitions.
Args:
  - requestId (string, required): The request ID (UUID)
  - status (string, required): New status — one of: submitted, under_review, quoted, accepted, payment_pending, in_progress, work_ready, completed, cancelled, closed, refunded, converted_to_order, revision_in_progress
  - note (string, optional): Internal note for the timeline
Returns: The updated request object.
Note: This calls POST /api/provider/requests/:id/timeline. For starting work specifically, the backend's start-work endpoint is admin-only — use this with status=in_progress once payment requirements are met.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				status: z
					.string()
					.min(1)
					.describe('New status (e.g. "in_progress", "under_review", "completed")'),
				note: z.string().optional().describe('Optional internal note for the timeline'),
			},
			annotations: {
				readOnlyHint: false,
				openWorldHint: false,
				destructiveHint: false,
				idempotentHint: false,
			},
		},
		async ({ requestId, status, note }) => {
			const body: Record<string, unknown> = { status }
			if (note) body.note = note
			const result = await apiCallRaw(
				`/api/provider/requests/${requestId}/timeline`,
				{ method: 'POST', body: JSON.stringify(body) },
			)
			return { content: [{ type: 'text', text: serializeResult(result.data) }] }
		},
	)
}
