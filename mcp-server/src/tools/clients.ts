/**
 * Client & referral tools — list clients with stats, list referrals.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiCall } from '../api-client.js'
import { serializeResult } from '../utils.js'

export function registerClientTools(server: McpServer): void {
	server.registerTool(
		'provider_list_clients',
		{
			title: 'List Clients',
			description: `List all clients (support clients + auth users with requests) with aggregated stats.

When to use: To see your client base — who has spent the most, who has the most requests, who was active recently. Useful for relationship management and identifying VIP clients.
Returns: Array of client objects with clientId, email, fullName, institution, requestCount, totalSpent, lastActivityAt, tags. Note: PII (email, whatsapp) is redacted for non-admin callers — the passkey account sees the redacted view unless it has admin role.`,
			inputSchema: {},
			annotations: { readOnlyHint: true },
		},
		async () => {
			const result = await apiCall('/api/provider/clients')
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_list_referrals',
		{
			title: 'List Referrals',
			description: `List all support referrals (clients referred by other clients), newest first.

When to use: To see referral activity — who is referring whom, and which requests came from referrals. Useful for tracking referral program impact.
Returns: Array of referral objects with id, requestId, taskId, requestStatus, requestCreatedAt, and referral details.`,
			inputSchema: {},
			annotations: { readOnlyHint: true },
		},
		async () => {
			const result = await apiCall('/api/provider/referrals')
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}
