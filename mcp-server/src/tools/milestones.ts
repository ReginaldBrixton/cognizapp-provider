/**
 * Milestone tools — list, get, create, update status, send card, history.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall, apiCallRaw } from '../api-client.js'
import { milestoneStatusSchema } from '../schemas.js'
import { serializeResult } from '../utils.js'

export function registerMilestoneTools(server: McpServer): void {
	server.registerTool(
		'provider_list_milestones',
		{
			title: 'List Milestones',
			description: `List all milestones for a support request.

When to use: To see the milestone breakdown of a request — titles, statuses, due dates, file/revision counts.
Args:
  - requestId (string, required): The request ID (UUID)
Returns: Array of milestone objects.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ requestId }) => {
			const result = await apiCall(`/api/provider/requests/${requestId}/milestones`)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_get_milestone',
		{
			title: 'Get Milestone',
			description: `Get detailed information about a single milestone, including files, revision history, and submission details.

When to use: When you need the full milestone state before submitting, requesting revision, or approving.
Args:
  - requestId (string, required): The request ID (UUID)
  - milestoneId (string, required): The milestone ID (UUID)
Returns: Full milestone object with files and revisions.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				milestoneId: z.string().min(1).describe('The milestone ID (UUID)'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ requestId, milestoneId }) => {
			const result = await apiCall(
				`/api/provider/requests/${requestId}/milestones/${milestoneId}`,
			)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_create_milestone',
		{
			title: 'Create Milestone',
			description: `Create a new milestone for a support request. Milestones break work into trackable deliverables with due dates.

When to use: After accepting a request, to plan the work into deliverable chunks. Each milestone gets its own submission/revision cycle.
Args:
  - requestId (string, required): The request ID (UUID)
  - title (string, required): Milestone title
  - description (string, optional): Milestone description
  - dueAt (string, optional): Due date (ISO 8601, e.g. 2025-01-15T23:59:59Z)
  - status (string, optional): Initial status (default "pending") — one of: pending, active, submitted, revision_requested, approved, cancelled
Returns: The created milestone object.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				title: z.string().min(1).max(200).describe('Milestone title'),
				description: z.string().optional().describe('Milestone description'),
				dueAt: z
					.string()
					.optional()
					.describe('Due date (ISO 8601, e.g. 2025-01-15T23:59:59Z)'),
				status: z
					.string()
					.default('pending')
					.describe('Initial status (default "pending")'),
			},
		},
		async ({ requestId, title, description, dueAt, status }) => {
			const data: Record<string, unknown> = { title, status: status ?? 'pending' }
			if (description) data.description = description
			if (dueAt) data.dueAt = dueAt
			const result = await apiCall(`/api/provider/requests/${requestId}/milestones`, {
				method: 'POST',
				body: JSON.stringify(data),
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_update_milestone_status',
		{
			title: 'Update Milestone Status',
			description: `Update the status of a milestone.

When to use: To progress a milestone through its lifecycle — pending → active → submitted → approved, or revision_requested.
Args:
  - requestId (string, required): The request ID (UUID)
  - milestoneId (string, required): The milestone ID (UUID)
  - status (string, required): New status — one of: pending, active, submitted, revision_requested, approved, cancelled
Returns: The updated milestone object (raw response).`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				milestoneId: z.string().min(1).describe('The milestone ID (UUID)'),
				status: milestoneStatusSchema.describe(
					'New status: pending, active, submitted, revision_requested, approved, cancelled',
				),
			},
		},
		async ({ requestId, milestoneId, status }) => {
			const result = await apiCallRaw(
				`/api/provider/requests/${requestId}/milestones/${milestoneId}`,
				{ method: 'PATCH', body: JSON.stringify({ status }) },
			)
			return { content: [{ type: 'text', text: serializeResult(result.data) }] }
		},
	)

	server.registerTool(
		'provider_send_milestone_card',
		{
			title: 'Send Milestone Card',
			description: `Send a milestone card to the chat thread. This notifies the client that a milestone is ready for review. Optionally updates the milestone status at the same time.

When to use: When a milestone deliverable is ready for the client to review. The card appears in the chat with a preview and review actions.
Args:
  - requestId (string, required): The request ID (UUID)
  - milestoneId (string, required): The milestone ID (UUID)
  - message (string, optional): Message to include with the card (default "Milestone submitted for your review.")
  - status (string, optional): Status to set when sending the card (default "submitted")
  - note (string, optional): Internal note (not shown to client)
Returns: The result of sending the card (typically the updated milestone + card message).`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				milestoneId: z.string().min(1).describe('The milestone ID (UUID)'),
				message: z
					.string()
					.optional()
					.describe('Message to include with the card'),
				status: z
					.string()
					.default('submitted')
					.describe('Status to set when sending card (default "submitted")'),
				note: z.string().optional().describe('Optional internal note (not shown to client)'),
			},
		},
		async ({ requestId, milestoneId, message, status, note }) => {
			const data: Record<string, unknown> = {
				status: status ?? 'submitted',
				message: message || 'Milestone submitted for your review.',
			}
			if (note) data.note = note
			const result = await apiCall(
				`/api/provider/requests/${requestId}/milestones/${milestoneId}/send-card`,
				{ method: 'POST', body: JSON.stringify(data) },
			)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_get_milestone_history',
		{
			title: 'Get Milestone History',
			description: `Get version history for a milestone — all submission rounds with files, events, and revision feedback.

When to use: To review how a milestone has evolved through revisions, or to see what feedback the client gave on a previous submission.
Args:
  - requestId (string, required): The request ID (UUID)
  - milestoneId (string, required): The milestone ID (UUID)
Returns: Array of submission rounds with files, events, and revision feedback.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				milestoneId: z.string().min(1).describe('The milestone ID (UUID)'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ requestId, milestoneId }) => {
			const result = await apiCall(
				`/api/provider/requests/${requestId}/milestones/${milestoneId}/history`,
			)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}
