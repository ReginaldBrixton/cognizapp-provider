/**
 * Dashboard tools — provider dashboard stats, deadlines, and activity log.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall } from '../api-client.js'
import { serializeResult } from '../utils.js'

export function registerDashboardTools(server: McpServer): void {
	server.registerTool(
		'provider_get_dashboard_stats',
		{
			title: 'Get Provider Dashboard Stats',
			description: `Get provider dashboard statistics: total requests, open requests, converted requests, message threads, and referrals.

When to use: At the start of a session to get a quick overview of the provider workload.
Returns: { totalRequests, openRequests, convertedRequests, messageThreads, referrals }
Don't use when: You need detailed request lists — use provider_list_requests instead.`,
			inputSchema: {},
			annotations: { readOnlyHint: true },
		},
		async () => {
			const result = await apiCall('/api/provider/dashboard/stats')
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_get_upcoming_deadlines',
		{
			title: 'Get Upcoming Deadlines',
			description: `Get upcoming deadlines for support requests, sorted by deadline (soonest first). Excludes completed/cancelled/refunded requests.

When to use: To prioritise work and identify urgent requests.
Args:
  - limit (number, optional): Max deadlines to return, 1-50 (default 5)
Returns: Array of { id, title, type, deadline, status }
Don't use when: You want all requests regardless of deadline — use provider_list_requests with deadline filter.`,
			inputSchema: {
				limit: z
					.number()
					.int()
					.min(1)
					.max(50)
					.default(5)
					.describe('Max number of deadlines to return (1-50, default 5)'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ limit }) => {
			const result = await apiCall('/api/provider/dashboard/deadlines', {
				query: { limit: String(limit ?? 5) },
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_get_recent_activity',
		{
			title: 'Get Recent Activity',
			description: `Get recent provider activity log entries (newest first).

When to use: To see what has happened recently — new submissions, status changes, payments, deliveries.
Args:
  - limit (number, optional): Max activities to return, 1-50 (default 8)
Returns: Array of activity log entries with timestamp, actor, event type, and details.`,
			inputSchema: {
				limit: z
					.number()
					.int()
					.min(1)
					.max(50)
					.default(8)
					.describe('Max number of activities to return (1-50, default 8)'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ limit }) => {
			const result = await apiCall('/api/provider/dashboard/activity', {
				query: { limit: String(limit ?? 8) },
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}
