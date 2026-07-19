/**
 * Provider settings tools — read and update the provider's profile/settings.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall, apiCallJson } from '../api-client.js'
import { AVAILABILITY_STATUSES } from '../constants.js'
import { serializeResult } from '../utils.js'

export function registerSettingsTools(server: McpServer): void {
	server.registerTool(
		'provider_get_settings',
		{
			title: 'Get Provider Settings',
			description: `Get the current provider settings — display name, bio, timezone, availability status, weekly capacity, response target, notification preferences, and workload preferences.

When to use: At the start of a session to understand the provider's current configuration, or before updating settings.
Returns: The provider settings object.`,
			inputSchema: {},
			annotations: { readOnlyHint: true },
		},
		async () => {
			const result = await apiCallJson<{ data: unknown }>('/api/provider/settings')
			return { content: [{ type: 'text', text: serializeResult(result.data ?? result) }] }
		},
	)

	server.registerTool(
		'provider_update_settings',
		{
			title: 'Update Provider Settings',
			description: `Update the provider's settings. All fields are optional — only provided fields are updated. The settings are upserted (created if they don't exist).

When to use: To change display name, bio, timezone, availability (e.g. mark yourself "busy" or "unavailable"), weekly capacity, response target, or notification/workload preferences.
Args (all optional):
  - displayName (string): Provider display name (max 120 chars)
  - bio (string): Provider bio (max 1000 chars)
  - timezone (string): IANA timezone (e.g. "Africa/Accra")
  - availabilityStatus (string): available, busy, unavailable, away
  - weeklyCapacity (number): Weekly capacity in hours (0-168)
  - responseTargetHours (number): Target response time in hours (1-168)
  - notificationPreferences (object): Notification preferences key/value map
  - workloadPreferences (object): Workload preferences key/value map
Returns: The updated provider settings object.`,
			inputSchema: {
				displayName: z.string().min(1).max(120).optional().describe('Provider display name'),
				bio: z.string().max(1000).optional().describe('Provider bio (max 1000 chars)'),
				timezone: z.string().max(80).optional().describe('IANA timezone (e.g. "Africa/Accra")'),
				availabilityStatus: z
					.enum(AVAILABILITY_STATUSES)
					.optional()
					.describe('Availability status: available, busy, unavailable, away'),
				weeklyCapacity: z
					.number()
					.int()
					.min(0)
					.max(168)
					.optional()
					.describe('Weekly capacity in hours (0-168)'),
				responseTargetHours: z
					.number()
					.int()
					.min(1)
					.max(168)
					.optional()
					.describe('Target response time in hours (1-168)'),
				notificationPreferences: z
					.record(z.string(), z.any())
					.optional()
					.describe('Notification preferences (key/value map)'),
				workloadPreferences: z
					.record(z.string(), z.any())
					.optional()
					.describe('Workload preferences (key/value map)'),
			},
			annotations: { idempotentHint: true },
		},
		async (args) => {
			const data: Record<string, unknown> = {}
			for (const [key, value] of Object.entries(args)) {
				if (value !== undefined) data[key] = value
			}
			const result = await apiCallJson<{ data: unknown }>('/api/provider/settings', {
				method: 'PATCH',
				body: JSON.stringify(data),
			})
			return { content: [{ type: 'text', text: serializeResult(result.data ?? result) }] }
		},
	)
}
