/**
 * Message / chat thread tools — list threads, get/send/edit/delete messages,
 * create threads.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall, apiCallRaw } from '../api-client.js'
import { serializeResult } from '../utils.js'

export function registerMessageTools(server: McpServer): void {
	server.registerTool(
		'provider_list_threads',
		{
			title: 'List Message Threads',
			description: `List all support message threads for the provider. Each thread links to a request and includes participants, last message preview, and unread count.

When to use: To see all active conversations. Pair with provider_get_thread_messages to read a specific thread.
Returns: Array of thread objects with id, requestId, participants, lastMessage, lastMessageAt, unreadCount.`,
			inputSchema: {},
			annotations: { readOnlyHint: true },
		},
		async () => {
			const result = await apiCall('/api/messages/threads')
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_get_thread_messages',
		{
			title: 'Get Thread Messages',
			description: `Get all messages in a support chat thread, oldest first.

When to use: To read a conversation before replying. Returns sender info, content, attachments, reply threading, and edit/delete metadata.
Args:
  - threadId (string, required): The thread ID (UUID)
Returns: Array of message objects.`,
			inputSchema: {
				threadId: z.string().min(1).describe('The support message thread ID (UUID)'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ threadId }) => {
			const result = await apiCall(`/api/messages/threads/${threadId}/messages`)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_send_message',
		{
			title: 'Send Message',
			description: `Send a message in a support chat thread. This is how the AI replies to users through the support system.

When to use: To respond to a client. Always read the thread first (provider_get_thread_messages) so your reply is grounded in context.
Args:
  - threadId (string, required): The thread ID to send to
  - content (string, required): The message text
  - attachments (array, optional): File references to include — each { id?, name?, url? }
  - replyToMessageId (string, optional): ID of message to reply to (for threaded replies)
Returns: The created message object.`,
			inputSchema: {
				threadId: z.string().min(1).describe('The thread ID to send the message to'),
				content: z.string().min(1).describe('The message text'),
				attachments: z
					.array(
						z.object({
							id: z.string().optional().describe('Existing file ID to reference'),
							name: z.string().optional().describe('Display name of the file'),
							url: z.string().optional().describe('Public URL of the file'),
						}),
					)
					.optional()
					.describe('Optional file references to attach'),
				replyToMessageId: z
					.string()
					.optional()
					.describe('ID of message to reply to (for threaded replies)'),
			},
		},
		async ({ threadId, content, attachments, replyToMessageId }) => {
			const payload: Record<string, unknown> = { content }
			if (replyToMessageId) payload.replyToMessageId = replyToMessageId
			if (attachments) payload.attachments = attachments
			const result = await apiCall(`/api/messages/threads/${threadId}/messages`, {
				method: 'POST',
				body: JSON.stringify(payload),
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_edit_message',
		{
			title: 'Edit Message',
			description: `Edit an existing message in a support chat thread. Only the provider's own messages can typically be edited.

When to use: To correct a typo or update a sent message. The edit is recorded in the message metadata.
Args:
  - threadId (string, required): The thread ID
  - messageId (string, required): The message ID to edit
  - content (string, required): The new message content
Returns: The updated message object (raw response).`,
			inputSchema: {
				threadId: z.string().min(1).describe('The thread ID'),
				messageId: z.string().min(1).describe('The message ID to edit'),
				content: z.string().min(1).describe('The new message content'),
			},
		},
		async ({ threadId, messageId, content }) => {
			const result = await apiCallRaw(
				`/api/messages/threads/${threadId}/messages/${messageId}`,
				{ method: 'PATCH', body: JSON.stringify({ content }) },
			)
			return { content: [{ type: 'text', text: serializeResult(result.data) }] }
		},
	)

	server.registerTool(
		'provider_delete_message',
		{
			title: 'Delete Message',
			description: `Soft-delete a message in a support chat thread. The content is replaced with "This message has been deleted" — the message record is preserved for audit.

When to use: Rarely — only when a message was sent in error and should be hidden. Prefer provider_edit_message for corrections.
Args:
  - threadId (string, required): The thread ID
  - messageId (string, required): The message ID to delete
Returns: Raw response (typically a confirmation object).`,
			inputSchema: {
				threadId: z.string().min(1).describe('The thread ID'),
				messageId: z.string().min(1).describe('The message ID to delete'),
			},
			annotations: { destructiveHint: true },
		},
		async ({ threadId, messageId }) => {
			const result = await apiCallRaw(
				`/api/messages/threads/${threadId}/messages/${messageId}`,
				{ method: 'DELETE' },
			)
			return { content: [{ type: 'text', text: serializeResult(result.data) }] }
		},
	)

	server.registerTool(
		'provider_create_thread',
		{
			title: 'Create Message Thread',
			description: `Create a new support message thread for a request. Usually auto-created when a request is first opened — only use this if a thread does not already exist.

When to use: When provider_list_threads shows no thread for a request and you need to start a conversation.
Args:
  - requestId (string, required): The request ID to create a thread for
  - type (string, optional): Thread type (default "request")
Returns: The created thread object.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The request ID to create a thread for'),
				type: z.string().default('request').describe('Thread type (default "request")'),
			},
		},
		async ({ requestId, type }) => {
			const result = await apiCall('/api/messages/threads', {
				method: 'POST',
				body: JSON.stringify({ type: type ?? 'request', requestId }),
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}
