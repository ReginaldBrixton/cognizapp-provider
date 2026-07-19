/**
 * Auth tool — check that the MCP passkey is configured and the backend is
 * reachable + authenticating correctly.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { apiCall, hasPasskey } from '../api-client.js'
import { serializeResult } from '../utils.js'

export function registerAuthTools(server: McpServer): void {
	server.registerTool(
		'provider_check_auth',
		{
			title: 'Check Auth',
			description: `Check if the MCP passkey is configured and the provider server is reachable + authenticating correctly.

When to use: At the start of a session or when troubleshooting auth errors. Confirms the COGNIZAPP_MCP_PASSKEY env var is set and the backend accepts it.
Returns:
  - { authenticated: true, hasPasskey: true } on success
  - { authenticated: false, hasPasskey: false, error: "..." } if passkey not set
  - { authenticated: false, hasPasskey: true, error: "..." } if passkey set but provider rejected it`,
			inputSchema: {},
			annotations: { readOnlyHint: true },
		},
		async () => {
			const passkeyConfigured = hasPasskey()
			if (!passkeyConfigured) {
				const result = {
					authenticated: false,
					hasPasskey: false,
					error: 'COGNIZAPP_MCP_PASSKEY env var is not set',
				}
				return { content: [{ type: 'text', text: serializeResult(result) }] }
			}
			try {
				await apiCall('/api/provider/dashboard/stats')
				const result = { authenticated: true, hasPasskey: true }
				return { content: [{ type: 'text', text: serializeResult(result) }] }
			} catch (e) {
				const result = {
					authenticated: false,
					hasPasskey: true,
					error: e instanceof Error ? e.message : String(e),
				}
				return { content: [{ type: 'text', text: serializeResult(result) }] }
			}
		},
	)
}
