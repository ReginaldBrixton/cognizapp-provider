/**
 * Order tools — list, get, and update order status.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall, apiCallRaw } from '../api-client.js'
import { ORDER_STATUSES } from '../constants.js'
import { serializeResult } from '../utils.js'

export function registerOrderTools(server: McpServer): void {
	server.registerTool(
		'provider_list_orders',
		{
			title: 'List Orders',
			description: `List all orders, newest first. Optionally filter by status.

When to use: To see orders that have been created from accepted quotes. Orders track the commercial side of a request separately from the work side.
Args:
  - status (string, optional): Filter by order status — pending, confirmed, in_progress, completed, cancelled, refunded
Returns: Array of order objects with id, requestId, requestTitle, taskId, status, totalAmount, etc.`,
			inputSchema: {
				status: z
					.enum(ORDER_STATUSES)
					.optional()
					.describe('Filter by order status: pending, confirmed, in_progress, completed, cancelled, refunded'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ status }) => {
			const result = await apiCall('/api/provider/orders', {
				query: { status },
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_get_order',
		{
			title: 'Get Order',
			description: `Get detailed information about a single order by ID.

When to use: When you have an order ID and need the full order record.
Args:
  - orderId (string, required): The order ID (UUID)
Returns: The order object with all fields.`,
			inputSchema: {
				orderId: z.string().min(1).describe('The order ID (UUID)'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ orderId }) => {
			const result = await apiCall(`/api/provider/orders/${orderId}`)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_update_order_status',
		{
			title: 'Update Order Status',
			description: `Update the status of an order.

When to use: To progress an order through its lifecycle — pending → confirmed → in_progress → completed, or cancelled/refunded.
Args:
  - orderId (string, required): The order ID (UUID)
  - status (string, required): New status — pending, confirmed, in_progress, completed, cancelled, refunded
  - notes (string, optional): Optional notes for the status change
Returns: The updated order object.`,
			inputSchema: {
				orderId: z.string().min(1).describe('The order ID (UUID)'),
				status: z
					.enum(ORDER_STATUSES)
					.describe('New status: pending, confirmed, in_progress, completed, cancelled, refunded'),
				notes: z.string().optional().describe('Optional notes for the status change'),
			},
			annotations: { idempotentHint: false },
		},
		async ({ orderId, status, notes }) => {
			const data: Record<string, unknown> = { status }
			if (notes) data.notes = notes
			const result = await apiCallRaw(`/api/provider/orders/${orderId}/status`, {
				method: 'PUT',
				body: JSON.stringify(data),
			})
			return { content: [{ type: 'text', text: serializeResult(result.data) }] }
		},
	)
}
