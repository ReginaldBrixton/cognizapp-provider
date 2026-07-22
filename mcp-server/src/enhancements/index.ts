/**
 * Barrel + registration entrypoint for the image-safe provider enhancement
 * tools, prompts, and server instructions.
 *
 * Integration (see src/index.ts):
 *   new McpServer(
 *     { name, version },
 *     { capabilities: { tools: {}, prompts: {} }, instructions: PROVIDER_SERVER_INSTRUCTIONS },
 *   )
 *   registerProviderPrompts(server)
 *   registerProviderEnhancementTools(server, deps)
 *
 * `deps` is built from the existing standalone API client functions
 * (apiDownloadBinary / apiFormUpload / the shared delivery helper) — auth and
 * refresh logic stays inside api-client.ts.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { EnhancementDeps } from './types.js'
import { PROVIDER_SERVER_INSTRUCTIONS } from './instructions.js'
import { registerProviderPrompts } from './prompts.js'
import { registerPlaybookTool } from './tools/playbook.js'
import { registerInspectAssetsTool } from './tools/inspect-assets.js'
import { registerPreflightDeliveryTool } from './tools/preflight-delivery.js'
import { registerDeliverFromFileIdsTool } from './tools/deliver-from-file-ids.js'

export { PROVIDER_SERVER_INSTRUCTIONS } from './instructions.js'
export { registerProviderPrompts } from './prompts.js'
export type { EnhancementDeps, DownloadedProviderFile } from './types.js'

/**
 * Register the four enhancement tools on the high-level McpServer.
 * Adds: provider_get_agent_playbook, provider_inspect_document_assets,
 *       provider_preflight_delivery, provider_deliver_final_work_from_file_ids.
 */
export function registerProviderEnhancementTools(server: McpServer, deps: EnhancementDeps): void {
	registerPlaybookTool(server)
	registerInspectAssetsTool(server, deps)
	registerPreflightDeliveryTool(server, deps)
	registerDeliverFromFileIdsTool(server, deps)
}

/** Re-export for callers that want the instructions string directly. */
export const PROVIDER_AGENT_PLAYBOOK = PROVIDER_SERVER_INSTRUCTIONS
