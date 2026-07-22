/**
 * Workflow / orchestration tools — composite, read-only tools that chain
 * multiple backend calls and return a single consolidated, prioritised
 * summary. These save the agent from making many round-trips for common
 * "what needs my attention?" questions.
 *
 * All workflow tools are best-effort: if one sub-call fails, the rest still
 * run and the output includes a `partial: true` flag with the error.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall } from '../api-client.js'
import { serializeResult } from '../utils.js'

/** Best-effort wrapper: returns [value, error]. Never throws. */
async function safe<T>(promise: Promise<T>): Promise<[T | null, string | null]> {
	try {
		return [await promise, null]
	} catch (e) {
		return [null, e instanceof Error ? e.message : String(e)]
	}
}

export function registerWorkflowTools(server: McpServer): void {
	server.registerTool(
		'provider_triage_inbox',
		{
			title: 'Triage Inbox',
			description: `Get a pre-prioritised triage summary of the provider inbox in one call. Chains dashboard stats, deadlines, recent activity, new submissions, and overdue/24h requests.

When to use: At the start of a session to see everything that needs attention, prioritised. Far more efficient than calling 5 separate tools.
Returns: {
  stats: { totalRequests, openRequests, convertedRequests, messageThreads, referrals },
  overdue: [...],          // requests past their deadline
  due24h: [...],           // requests due within 24 hours
  newSubmissions: [...],   // requests with status=submitted (awaiting review)
  recentActivity: [...],   // recent activity log entries
  partial: boolean,        // true if any sub-call failed
  errors: string[]         // sub-call errors (if any)
}
This is read-only — no state changes. Use the individual tools (provider_send_message, provider_create_quote, etc.) to act on the items.`,
			inputSchema: {},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async () => {
			const [stats, statsErr] = await safe(
				apiCall('/api/provider/dashboard/stats'),
			)
			const [overdue, overdueErr] = await safe(
				apiCall('/api/provider/requests', { query: { deadline: 'overdue' } }),
			)
			const [due24h, due24hErr] = await safe(
				apiCall('/api/provider/requests', { query: { deadline: '24h' } }),
			)
			const [newSubmissions, newErr] = await safe(
				apiCall('/api/provider/requests', { query: { status: 'submitted' } }),
			)
			const [recentActivity, activityErr] = await safe(
				apiCall('/api/provider/dashboard/activity', { query: { limit: '10' } }),
			)

			const errors = [statsErr, overdueErr, due24hErr, newErr, activityErr].filter(
				(e): e is string => e !== null,
			)
			const partial = errors.length > 0

			const summary = {
				stats,
				overdue,
				due24h,
				newSubmissions,
				recentActivity,
				partial,
				errors,
			}
			return { content: [{ type: 'text', text: serializeResult(summary) }] }
		},
	)

	server.registerTool(
		'provider_request_summary',
		{
			title: 'Request Summary',
			description: `Get a holistic, consolidated summary of a single request in one call — request details, milestones, and recent chat messages.

When to use: When you have a request ID and need the full picture before acting (quoting, messaging, delivering). Replaces calling provider_get_request + provider_list_milestones + provider_list_threads + provider_get_thread_messages separately.
IMPORTANT: Call before quoting, messaging, status changes, or delivery.
Args:
  - requestId (string, required): The request ID (UUID)
  - messageLimit (number, optional): Max recent messages to include (default 20)
Returns: {
  request: {...},          // full request object
  milestones: [...],       // all milestones for the request
  thread: {...} | null,    // the request's message thread (if any)
  messages: [...],         // recent messages (up to messageLimit)
  partial: boolean,
  errors: string[]
}`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				messageLimit: z
					.number()
					.int()
					.min(1)
					.max(100)
					.default(20)
					.describe('Max recent messages to include (1-100, default 20)'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async ({ requestId, messageLimit }) => {
			const [request, requestErr] = await safe(
				apiCall(`/api/provider/requests/${requestId}`),
			)
			const [milestones, milestonesErr] = await safe(
				apiCall(`/api/provider/requests/${requestId}/milestones`),
			)
			const [threads, threadsErr] = await safe(apiCall('/api/messages/threads'))

			let thread: unknown = null
			let messages: unknown[] = []
			let threadErr: string | null = null
			if (Array.isArray(threads)) {
				const match = (threads as Array<Record<string, unknown>>).find(
					(t) => String(t.requestId ?? '') === requestId,
				)
				if (match) {
					thread = match
					const threadId = String(match.id)
					const [msgs, e] = await safe(
						apiCall(`/api/messages/threads/${threadId}/messages`),
					)
					if (Array.isArray(msgs)) {
						messages = (msgs as unknown[]).slice(-Math.max(1, messageLimit))
					} else if (e) {
						threadErr = e
					}
				}
			} else if (threadsErr) {
				threadErr = threadsErr
			}

			const errors = [requestErr, milestonesErr, threadErr].filter(
				(e): e is string => e !== null,
			)
			const partial = errors.length > 0

			const summary = {
				request,
				milestones,
				thread,
				messages,
				partial,
				errors,
			}
			return { content: [{ type: 'text', text: serializeResult(summary) }] }
		},
	)

	server.registerTool(
		'provider_draft_quote',
		{
			title: 'Draft Quote',
			description: `Generate a suggested quote skeleton for a request based on its metadata. Read-only — returns a draft for the agent to refine before calling provider_create_quote.

When to use: After provider_get_request (or provider_request_summary), when you're ready to quote but want a starting point. The agent should review and adjust the draft, then call provider_create_quote with the refined values.
Args:
  - requestId (string, required): The request ID (UUID)
Returns: {
  request: {...},                  // the underlying request (for context)
  suggestedQuote: {
    quoteType: "fixed",
    lineItems: [{ description, quantity, unitPrice, total }],
    deliverables: [string],
    turnaroundHours: number,
    revisionPolicy: { included, additionalCost, maxRevisions, revisionWindow },
    totalAmount: number,           // suggested total (sum of line items)
    currency: "GHS",
    validUntil: string | null
  },
  notes: string,                   // guidance for the agent on what to verify
  partial: boolean,
  errors: string[]
}
Note: The suggested amounts are conservative defaults — the agent MUST review and adjust based on the actual scope, complexity, and client relationship.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async ({ requestId }) => {
			const [request, requestErr] = await safe(
				apiCall(`/api/provider/requests/${requestId}`),
			)

			const req = request as Record<string, unknown> | null
			const title = String(req?.title ?? req?.taskId ?? 'Support request')
			const description = String(req?.description ?? '')
			const serviceCategory = String(
				(req?.draftPayload as Record<string, unknown> | undefined)?.serviceCategory ??
					(req?.serviceCategory as string | undefined) ??
					'',
			)

			// Conservative default suggestion — agent must refine.
			const suggestedQuote = {
				quoteType: 'fixed' as const,
				lineItems: [
					{
						description: `${title}${serviceCategory ? ` (${serviceCategory})` : ''}`,
						quantity: 1,
						unitPrice: 0,
						total: 0,
					},
				],
				deliverables: [] as string[],
				turnaroundHours: 24,
				revisionPolicy: {
					included: 1,
					additionalCost: 0,
					maxRevisions: 1,
					revisionWindow: 48,
				},
				totalAmount: 0,
				currency: 'GHS',
				validUntil: null as string | null,
			}

			const notes = [
				'The suggested line items and total are placeholders (0 GHS).',
				'Inspect the request description, attachments, and any client messages to scope the work.',
				'Consider the client\'s subscription plan and any discount requests before finalising the total.',
				'Adjust turnaroundHours based on your current workload (see provider_get_settings for weeklyCapacity).',
				'Once refined, call provider_create_quote with the final values.',
				description ? `Request description (first 500 chars): ${description.slice(0, 500)}` : '',
			]
				.filter(Boolean)
				.join('\n')

			const summary = {
				request,
				suggestedQuote,
				notes,
				partial: requestErr !== null,
				errors: requestErr ? [requestErr] : [],
			}
			return { content: [{ type: 'text', text: serializeResult(summary) }] }
		},
	)

	server.registerTool(
		'provider_follow_up_overdue',
		{
			title: 'Follow Up Overdue',
			description: `List overdue and due-within-24h requests, and for each generate a draft follow-up message the agent can send via provider_send_message.

When to use: When you want to proactively follow up on requests that are late or due soon. Returns the list of urgent requests plus a ready-to-send (but editable) follow-up message per request.
Args:
  - deadlineFilter (string, optional): Which deadlines to include — "overdue" (default), "24h", or "both"
Returns: {
  items: [
    {
      request: {...},
      urgency: "overdue" | "due_24h",
      threadId: string | null,
      draftMessage: string     // suggested follow-up message
    }
  ],
  partial: boolean,
  errors: string[]
}
The draftMessage is a starting point — review and personalise before sending with provider_send_message.`,
			inputSchema: {
				deadlineFilter: z
					.enum(['overdue', '24h', 'both'])
					.default('overdue')
					.describe('Which deadlines to include: "overdue" (default), "24h", or "both"'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async ({ deadlineFilter }) => {
			const filters: Array<'overdue' | '24h'> =
				deadlineFilter === 'both' ? ['overdue', '24h'] : [deadlineFilter]

			const items: Array<Record<string, unknown>> = []
			const errors: string[] = []

			for (const filter of filters) {
				const [rows, err] = await safe(
					apiCall('/api/provider/requests', { query: { deadline: filter } }),
				)
				if (err) {
					errors.push(`${filter}: ${err}`)
					continue
				}
				if (!Array.isArray(rows)) continue

				const [threads, threadsErr] = await safe(apiCall('/api/messages/threads'))
				const threadList = Array.isArray(threads)
					? (threads as Array<Record<string, unknown>>)
					: []
				if (threadsErr) errors.push(`threads: ${threadsErr}`)

				for (const request of rows as Array<Record<string, unknown>>) {
					const requestId = String(request.id)
					const title = String(request.title ?? request.taskId ?? 'your request')
					const deadline = request.deadlineAt ?? request.deadline
					const thread = threadList.find(
						(t) => String(t.requestId ?? '') === requestId,
					)
					const urgency = filter === 'overdue' ? 'overdue' : 'due_24h'
					const draftMessage =
						urgency === 'overdue'
							? `Hi, just checking in on "${title}". The deadline has passed. Is there anything you need from me to keep things moving? Happy to help however I can.`
							: `Hi, a quick heads-up that "${title}" is due within 24 hours. Let me know if you have any questions or need an update — I'm here to help.`

					items.push({
						request,
						urgency,
						threadId: thread ? String(thread.id) : null,
						draftMessage,
					})
				}
			}

			const summary = {
				items,
				partial: errors.length > 0,
				errors,
			}
			return { content: [{ type: 'text', text: serializeResult(summary) }] }
		},
	)
}
