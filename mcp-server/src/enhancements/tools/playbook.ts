/**
 * provider_get_agent_playbook — read-only fallback for hosts that do not
 * surface MCP server instructions or prompts. Returns the same mandatory
 * workflow string that is set as the server `instructions` field.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { serializeResult } from '../../utils.js'
import { PROVIDER_SERVER_INSTRUCTIONS } from '../instructions.js'

export function registerPlaybookTool(server: McpServer): void {
	server.registerTool(
		'provider_get_agent_playbook',
		{
			title: 'Get Agent Playbook',
			description: `Return the mandatory CognizApp provider workflow playbook. Use this when your host does not surface MCP server instructions or prompts.

Returns: The full playbook text (verification rules, image-safe document workflow, delivery sequence, revision handling). Key rules:
- Never claim upload/delivery/payment/unlock succeeded unless a tool result confirms it.
- Read the request and thread before quoting, messaging, changing status, or delivering.
- For DOCX/PPTX/XLSX/PDF work, follow provider_inspect_document_assets.
- Run provider_preflight_delivery before delivery; prefer provider_deliver_final_work_from_file_ids for large files.`,
			inputSchema: {},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async () => ({
			content: [
				{
					type: 'text',
					text: serializeResult({ playbook: PROVIDER_SERVER_INSTRUCTIONS }),
				},
			],
		}),
	)
}
