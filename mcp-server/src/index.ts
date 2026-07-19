#!/usr/bin/env node

/**
 * CognizApp Provider MCP Server
 *
 * Enables AI to control the CognizApp provider support system:
 * - View and manage support requests
 * - Send, edit, and delete messages in chat threads
 * - Manage milestones (create, update, submit, send cards)
 * - Upload, download, and manage files
 * - Approve/reject discounts
 * - Override payment policies
 * - Deliver final work (PDF, DOCX, preview images)
 * - View dashboard stats and activity
 * - Retry preview generation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	type Tool,
} from '@modelcontextprotocol/sdk/types.js'
import { apiCall, apiCallRaw, apiDownloadBinary, setAccessToken, setRefreshToken, getAccessToken } from './api-client.js'

// ─── Tool Definitions ───────────────────────────────────────────────────────

const tools: Tool[] = [
	// ── Dashboard ──
	{
		name: 'provider_get_dashboard_stats',
		description: 'Get provider dashboard statistics including total requests, pending, in progress, completed, and urgent counts.',
		inputSchema: { type: 'object', properties: {} },
		annotations: { readOnlyHint: true },
	},
	{
		name: 'provider_get_upcoming_deadlines',
		description: 'Get upcoming deadlines for support requests. Returns a list of requests sorted by deadline.',
		inputSchema: {
			type: 'object',
			properties: {
				limit: { type: 'number', description: 'Max number of deadlines to return (default 5)', default: 5 },
			},
		},
		annotations: { readOnlyHint: true },
	},
	{
		name: 'provider_get_recent_activity',
		description: 'Get recent provider activity log entries.',
		inputSchema: {
			type: 'object',
			properties: {
				limit: { type: 'number', description: 'Max number of activities to return (default 8)', default: 8 },
			},
		},
		annotations: { readOnlyHint: true },
	},

	// ── Requests ──
	{
		name: 'provider_list_requests',
		description: 'List support requests for the provider. Supports filtering by status, payment status, deadline, priority, and subscription. Returns request objects with id, title, status, paymentStatus, client info, deadlines, etc.',
		inputSchema: {
			type: 'object',
			properties: {
				status: { type: 'string', description: 'Filter by request status: submitted, payment_pending, in_progress, work_ready, quoted, accepted, completed, etc.' },
				paymentStatus: { type: 'string', description: 'Filter by payment status: deposit_required, deposit_paid, final_payment_required, paid, etc.' },
				deadline: { type: 'string', description: 'Filter by deadline: overdue, 24h, 7d, none' },
				priority: { type: 'string', description: 'Filter by priority: high, standard' },
				subscription: { type: 'string', description: 'Filter by subscription plan' },
			},
		},
		annotations: { readOnlyHint: true },
	},
	{
		name: 'provider_get_request',
		description: 'Get detailed information about a single support request by ID. Returns full request object including description, attachments, payment policy, milestones, AI review, etc.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
			},
			required: ['requestId'],
		},
		annotations: { readOnlyHint: true },
	},

	// ── Messages / Chat ──
	{
		name: 'provider_list_threads',
		description: 'List all support message threads for the provider. Each thread links to a request and includes participants, last message, and unread count.',
		inputSchema: { type: 'object', properties: {} },
		annotations: { readOnlyHint: true },
	},
	{
		name: 'provider_get_thread_messages',
		description: 'Get all messages in a support chat thread. Returns message objects with sender info, content, attachments, reply threading, and edit/delete metadata.',
		inputSchema: {
			type: 'object',
			properties: {
				threadId: { type: 'string', description: 'The thread ID' },
			},
			required: ['threadId'],
		},
		annotations: { readOnlyHint: true },
	},
	{
		name: 'provider_send_message',
		description: 'Send a message in a support chat thread. Include attachments by reference if needed. This is how the AI replies to users through the support system.',
		inputSchema: {
			type: 'object',
			properties: {
				threadId: { type: 'string', description: 'The thread ID to send the message to' },
				content: { type: 'string', description: 'The message text' },
				attachments: {
					type: 'array',
					description: 'Optional file references to include',
					items: {
						type: 'object',
						properties: {
							id: { type: 'string', description: 'File ID' },
							name: { type: 'string', description: 'File name' },
							url: { type: 'string', description: 'File URL' },
						},
					},
				},
				replyToMessageId: { type: 'string', description: 'Optional: ID of message to reply to' },
			},
			required: ['threadId', 'content'],
		},
	},
	{
		name: 'provider_edit_message',
		description: 'Edit an existing message in a support chat thread.',
		inputSchema: {
			type: 'object',
			properties: {
				threadId: { type: 'string', description: 'The thread ID' },
				messageId: { type: 'string', description: 'The message ID to edit' },
				content: { type: 'string', description: 'The new message content' },
			},
			required: ['threadId', 'messageId', 'content'],
		},
	},
	{
		name: 'provider_delete_message',
		description: 'Delete a message in a support chat thread. Soft-deletes the message (content replaced with "This message has been deleted").',
		inputSchema: {
			type: 'object',
			properties: {
				threadId: { type: 'string', description: 'The thread ID' },
				messageId: { type: 'string', description: 'The message ID to delete' },
			},
			required: ['threadId', 'messageId'],
		},
		annotations: { destructiveHint: true },
	},
	{
		name: 'provider_create_thread',
		description: 'Create a new support message thread for a request. Usually auto-created when a request is first opened, but can be used to create a thread if one does not exist.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID to create a thread for' },
				type: { type: 'string', description: 'Thread type (default: "request")', default: 'request' },
			},
			required: ['requestId'],
		},
	},

	// ── Milestones ──
	{
		name: 'provider_list_milestones',
		description: 'List all milestones for a support request. Returns milestone objects with title, description, status, due date, file count, revision count, and submission round.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
			},
			required: ['requestId'],
		},
		annotations: { readOnlyHint: true },
	},
	{
		name: 'provider_get_milestone',
		description: 'Get detailed information about a single milestone including files, revision history, and submission details.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
				milestoneId: { type: 'string', description: 'The milestone ID' },
			},
			required: ['requestId', 'milestoneId'],
		},
		annotations: { readOnlyHint: true },
	},
	{
		name: 'provider_create_milestone',
		description: 'Create a new milestone for a support request. Milestones break down work into trackable deliverables with due dates.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
				title: { type: 'string', description: 'Milestone title' },
				description: { type: 'string', description: 'Milestone description' },
				dueAt: { type: 'string', description: 'Due date (ISO 8601 format, e.g. 2025-01-15T23:59:59Z)' },
				status: { type: 'string', description: 'Initial status (default: "pending")', default: 'pending' },
			},
			required: ['requestId', 'title'],
		},
	},
	{
		name: 'provider_update_milestone_status',
		description: 'Update the status of a milestone. Valid statuses: pending, active, submitted, revision_requested, approved, cancelled.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
				milestoneId: { type: 'string', description: 'The milestone ID' },
				status: { type: 'string', description: 'New status: pending, active, submitted, revision_requested, approved, cancelled', enum: ['pending', 'active', 'submitted', 'revision_requested', 'approved', 'cancelled'] },
			},
			required: ['requestId', 'milestoneId', 'status'],
		},
	},
	{
		name: 'provider_send_milestone_card',
		description: 'Send a milestone card to the chat thread. This notifies the client that a milestone is ready for review. Includes a message and optionally updates the milestone status.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
				milestoneId: { type: 'string', description: 'The milestone ID' },
				message: { type: 'string', description: 'Message to include with the milestone card' },
				status: { type: 'string', description: 'Status to set when sending card (default: "submitted")', default: 'submitted' },
				note: { type: 'string', description: 'Optional internal note' },
			},
			required: ['requestId', 'milestoneId'],
		},
	},
	{
		name: 'provider_get_milestone_history',
		description: 'Get version history for a milestone, showing all submission rounds with files, events, and revision feedback.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
				milestoneId: { type: 'string', description: 'The milestone ID' },
			},
			required: ['requestId', 'milestoneId'],
		},
		annotations: { readOnlyHint: true },
	},

	// ── Files ──
	{
		name: 'provider_upload_file',
		description: 'Upload a file to a support request or milestone. File content is provided as base64-encoded data. Supports any file type (PDF, DOCX, images, etc.).',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
				milestoneId: { type: 'string', description: 'Optional: milestone ID to associate the file with' },
				purpose: { type: 'string', description: 'File purpose: milestone_upload, request_attachment, delivery, etc.' },
				fileName: { type: 'string', description: 'Name of the file' },
				fileContentBase64: { type: 'string', description: 'Base64-encoded file content' },
				contentType: { type: 'string', description: 'MIME type of the file (e.g. application/pdf, image/png)', default: 'application/octet-stream' },
			},
			required: ['requestId', 'fileName', 'fileContentBase64'],
		},
	},
	{
		name: 'provider_download_file',
		description: 'Download a file by its file ID. Returns base64-encoded file content with content type and filename.',
		inputSchema: {
			type: 'object',
			properties: {
				fileId: { type: 'string', description: 'The file ID to download' },
			},
			required: ['fileId'],
		},
		annotations: { readOnlyHint: true },
	},
	{
		name: 'provider_delete_file',
		description: 'Delete a file by its file ID.',
		inputSchema: {
			type: 'object',
			properties: {
				fileId: { type: 'string', description: 'The file ID to delete' },
			},
			required: ['fileId'],
		},
		annotations: { destructiveHint: true },
	},

	// ── Discount ──
	{
		name: 'provider_discount_decision',
		description: 'Approve or reject a discount for a support request. Can approve 1-100% discount. 100% means full discount (no payment required).',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
				status: { type: 'string', description: 'Decision: "approved" or "rejected"', enum: ['approved', 'rejected'] },
				requestedAmount: { type: 'number', description: 'Original requested amount' },
				approvedAmount: { type: 'number', description: 'Amount to approve (0 if rejected)' },
				discountPercent: { type: 'number', description: 'Discount percentage 1-100 (optional if approvedAmount is set)' },
				reason: { type: 'string', description: 'Reason or note for the user' },
			},
			required: ['requestId', 'status'],
		},
	},

	// ── Payment Policy ──
	{
		name: 'provider_override_payment_policy',
		description: 'Override the payment policy for a specific request. Sets deposit percentage, preview unlock conditions, work start requirements, editable document requirement, and revision limits.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
				depositPercent: { type: 'number', description: 'Required deposit percentage (0-100). Use 0 for no deposit, 100 for full payment upfront.' },
				previewUnlock: { type: 'string', description: 'When to unlock preview: "deposit" or "full_payment"', enum: ['deposit', 'full_payment'] },
				workStartRequirement: { type: 'string', description: 'Requirement to start work: "none", "deposit", or "full_payment"', enum: ['none', 'deposit', 'full_payment'] },
				editableDocumentRequired: { type: 'boolean', description: 'Whether an editable document (DOCX) is required for delivery' },
				revisionsAllowed: { type: 'number', description: 'Number of revisions allowed (0-10, optional)', minimum: 0, maximum: 10 },
				reason: { type: 'string', description: 'Reason for the override (shown in audit log, minimum 8 characters)', minLength: 8 },
			},
			required: ['requestId', 'depositPercent', 'previewUnlock', 'workStartRequirement', 'editableDocumentRequired', 'reason'],
		},
	},

	// ── Delivery ──
	{
		name: 'provider_deliver_final_work',
		description: 'Upload and publish final delivery for a support request. Requires a clean PDF, a clean DOCX, and ordered preview page images. Preview images are published to chat; clean final files remain locked until full payment.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
				pdfFileName: { type: 'string', description: 'Filename for the clean PDF' },
				pdfContentBase64: { type: 'string', description: 'Base64-encoded clean PDF content' },
				docxFileName: { type: 'string', description: 'Filename for the clean DOCX' },
				docxContentBase64: { type: 'string', description: 'Base64-encoded clean DOCX content' },
				previewImages: {
					type: 'array',
					description: 'Ordered preview page images',
					items: {
						type: 'object',
						properties: {
							fileName: { type: 'string', description: 'Image filename' },
							contentBase64: { type: 'string', description: 'Base64-encoded image content' },
							contentType: { type: 'string', description: 'MIME type (e.g. image/png)', default: 'image/png' },
						},
						required: ['fileName', 'contentBase64'],
					},
				},
				deliveryNote: { type: 'string', description: 'Optional delivery note for the client' },
			},
			required: ['requestId', 'pdfFileName', 'pdfContentBase64', 'docxFileName', 'docxContentBase64', 'previewImages'],
		},
	},

	// ── Preview Generation ──
	{
		name: 'provider_retry_preview',
		description: 'Retry preview generation for a support request. Use when preview status is "failed".',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
			},
			required: ['requestId'],
		},
	},

	// ── Send Card ──
	{
		name: 'provider_send_request_card',
		description: 'Send a structured card (payment, revision, or delivery) to the chat thread for a request. Use provider_send_milestone_card for milestone cards instead.',
		inputSchema: {
			type: 'object',
			properties: {
				requestId: { type: 'string', description: 'The request ID' },
				kind: { type: 'string', description: 'Card kind: "payment_card", "revision_card", or "delivery_card"', enum: ['payment_card', 'revision_card', 'delivery_card'] },
				message: { type: 'string', description: 'Message to include with the card' },
				note: { type: 'string', description: 'Optional note (alternative to message)' },
				title: { type: 'string', description: 'Optional card title (for revision/delivery cards)' },
				amount: { type: 'number', description: 'Payment amount (required for payment_card if not auto-derived)' },
				paymentType: { type: 'string', description: 'Payment type for payment cards: "deposit", "final", "full"' },
				expectedAt: { type: 'string', description: 'Expected delivery date for revision cards (ISO 8601)' },
				locked: { type: 'boolean', description: 'Whether delivery card files are locked (default true)' },
			},
			required: ['requestId', 'kind'],
		},
	},

	// ── Auth ──
	{
		name: 'provider_set_auth_token',
		description: 'Set or update the access token and refresh token for API authentication. Use this if the current token has expired and you have new credentials.',
		inputSchema: {
			type: 'object',
			properties: {
				accessToken: { type: 'string', description: 'The JWT access token' },
				refreshToken: { type: 'string', description: 'Optional: the refresh token for auto-renewal' },
			},
			required: ['accessToken'],
		},
	},
	{
		name: 'provider_check_auth',
		description: 'Check if the current access token is valid by making a simple API call. Returns the authentication status.',
		inputSchema: { type: 'object', properties: {} },
		annotations: { readOnlyHint: true },
	},
]

// ─── Tool Handlers ──────────────────────────────────────────────────────────

/** Safely decode a base64 string to a Buffer, throwing a clear error on invalid input. */
function decodeBase64(input: string, fieldName: string): Buffer {
	if (!input || typeof input !== 'string') {
		throw new Error(`${fieldName} is required and must be a base64 string`)
	}
	const trimmed = input.trim()
	// Basic base64 format check (allows optional data URI prefix)
	const b64Content = trimmed.startsWith('data:') ? trimmed.split(',')[1] ?? '' : trimmed
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64Content) || b64Content.length % 4 !== 0) {
		throw new Error(`${fieldName} is not valid base64 data`)
	}
	try {
		return Buffer.from(b64Content, 'base64')
	} catch {
		throw new Error(`Failed to decode ${fieldName} as base64`)
	}
}

async function handleToolCall(name: string, args: Record<string, any>): Promise<any> {
	switch (name) {
		// ── Dashboard ──
		case 'provider_get_dashboard_stats':
			return await apiCall('/api/support/provider/dashboard/stats')

		case 'provider_get_upcoming_deadlines':
			return await apiCall('/api/support/provider/dashboard/deadlines', {
				query: { limit: String(args.limit ?? 5) },
			})

		case 'provider_get_recent_activity':
			return await apiCall('/api/support/provider/dashboard/activity', {
				query: { limit: String(args.limit ?? 8) },
			})

		// ── Requests ──
		case 'provider_list_requests':
			return await apiCall('/api/support/provider/requests', {
				query: {
					status: args.status,
					paymentStatus: args.paymentStatus,
					deadline: args.deadline,
					priority: args.priority,
					subscription: args.subscription,
				},
			})

		case 'provider_get_request':
			return await apiCall(`/api/support/provider/requests/${args.requestId}`)

		// ── Messages ──
		case 'provider_list_threads':
			return await apiCall('/api/support/messages/threads')

		case 'provider_get_thread_messages':
			return await apiCall(`/api/support/messages/threads/${args.threadId}/messages`)

		case 'provider_send_message': {
			const payload: Record<string, any> = {
				content: args.content,
			}
			if (args.replyToMessageId) payload.replyToMessageId = args.replyToMessageId
			if (args.attachments) payload.attachments = args.attachments
			return await apiCall(`/api/support/messages/threads/${args.threadId}/messages`, {
				method: 'POST',
				body: JSON.stringify(payload),
			})
		}

		case 'provider_edit_message':
			return await apiCallRaw(
				`/api/support/messages/threads/${args.threadId}/messages/${args.messageId}`,
				{
					method: 'PATCH',
					body: JSON.stringify({ content: args.content }),
				},
			).then(r => r.data)

		case 'provider_delete_message':
			return await apiCallRaw(
				`/api/support/messages/threads/${args.threadId}/messages/${args.messageId}`,
				{ method: 'DELETE' },
			).then(r => r.data)

		case 'provider_create_thread':
			return await apiCall('/api/support/messages/threads', {
				method: 'POST',
				body: JSON.stringify({
					type: args.type ?? 'request',
					requestId: args.requestId,
				}),
			})

		// ── Milestones ──
		case 'provider_list_milestones':
			return await apiCall(`/api/support/provider/requests/${args.requestId}/milestones`)

		case 'provider_get_milestone':
			return await apiCall(`/api/support/provider/requests/${args.requestId}/milestones/${args.milestoneId}`)

		case 'provider_create_milestone': {
			const milestoneData: Record<string, any> = {
				title: args.title,
				status: args.status ?? 'pending',
			}
			if (args.description) milestoneData.description = args.description
			if (args.dueAt) milestoneData.dueAt = args.dueAt
			return await apiCall(`/api/support/provider/requests/${args.requestId}/milestones`, {
				method: 'POST',
				body: JSON.stringify(milestoneData),
			})
		}

		case 'provider_update_milestone_status':
			return await apiCallRaw(
				`/api/support/provider/requests/${args.requestId}/milestones/${args.milestoneId}`,
				{
					method: 'PATCH',
					body: JSON.stringify({ status: args.status }),
				},
			).then(r => r.data)

		case 'provider_send_milestone_card': {
			const cardData: Record<string, any> = {
				status: args.status ?? 'submitted',
				message: args.message || `Milestone submitted for your review.`,
			}
			if (args.note) cardData.note = args.note
			return await apiCall(
				`/api/support/provider/requests/${args.requestId}/milestones/${args.milestoneId}/send-card`,
				{
					method: 'POST',
					body: JSON.stringify(cardData),
				},
			)
		}

		case 'provider_get_milestone_history':
			return await apiCall(`/api/support/provider/requests/${args.requestId}/milestones/${args.milestoneId}/history`)

		// ── Files ──
		case 'provider_upload_file': {
			const fileBuffer = decodeBase64(args.fileContentBase64, 'fileContentBase64')
			const blob = new Blob([new Uint8Array(fileBuffer)], { type: args.contentType || 'application/octet-stream' })
			const formData = new FormData()
			formData.append('requestId', args.requestId)
			if (args.milestoneId) formData.append('milestoneId', args.milestoneId)
			formData.append('purpose', args.purpose || 'request_attachment')
			formData.append('files', blob, args.fileName)
			return await apiCall('/api/support/files/upload', {
				method: 'POST',
				body: formData,
			})
		}

		case 'provider_download_file': {
			const result = await apiDownloadBinary(`/api/support/files/${args.fileId}/download`)
			const base64 = result.buffer.toString('base64')
			return {
				fileId: args.fileId,
				contentType: result.contentType,
				size: result.buffer.length,
				filename: result.filename,
				contentBase64: base64,
			}
		}

		case 'provider_delete_file':
			return await apiCallRaw(`/api/support/files/${args.fileId}`, {
				method: 'DELETE',
			}).then(r => r.data)

		// ── Discount ──
		case 'provider_discount_decision': {
			const discountData: Record<string, any> = {
				status: args.status,
			}
			if (args.requestedAmount !== undefined) discountData.requestedAmount = args.requestedAmount
			if (args.approvedAmount !== undefined) discountData.approvedAmount = args.approvedAmount
			if (args.discountPercent !== undefined) discountData.discountPercent = args.discountPercent
			if (args.reason) discountData.reason = args.reason
			return await apiCall(`/api/support/provider/requests/${args.requestId}/discount-decision`, {
				method: 'POST',
				body: JSON.stringify(discountData),
			})
		}

		// ── Payment Policy ──
		case 'provider_override_payment_policy': {
			const reason = String(args.reason ?? '').trim()
			if (reason.length < 8) {
				throw new Error('reason must be at least 8 characters long (backend requirement)')
			}
			const depositPercent = Number(args.depositPercent)
			if (!Number.isFinite(depositPercent) || depositPercent < 0 || depositPercent > 100) {
				throw new Error('depositPercent must be a number between 0 and 100')
			}
			if (!['deposit', 'full_payment'].includes(args.previewUnlock)) {
				throw new Error('previewUnlock must be "deposit" or "full_payment"')
			}
			if (!['none', 'deposit', 'full_payment'].includes(args.workStartRequirement)) {
				throw new Error('workStartRequirement must be "none", "deposit", or "full_payment"')
			}
			const policyData: Record<string, any> = {
				depositPercent,
				previewUnlock: args.previewUnlock,
				workStartRequirement: args.workStartRequirement,
				editableDocumentRequired: Boolean(args.editableDocumentRequired),
				reason,
			}
			if (args.revisionsAllowed !== undefined) policyData.revisionsAllowed = args.revisionsAllowed
			return await apiCall(`/api/support/provider/requests/${args.requestId}/payment-policy-override`, {
				method: 'POST',
				body: JSON.stringify(policyData),
			})
		}

		// ── Delivery ──
		case 'provider_deliver_final_work': {
			const formData = new FormData()

			const pdfBuffer = decodeBase64(args.pdfContentBase64, 'pdfContentBase64')
			const pdfBlob = new Blob([new Uint8Array(pdfBuffer)], { type: 'application/pdf' })
			formData.append('pdfFile', pdfBlob, args.pdfFileName)

			const docxBuffer = decodeBase64(args.docxContentBase64, 'docxContentBase64')
			const docxBlob = new Blob([new Uint8Array(docxBuffer)], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
			formData.append('docxFile', docxBlob, args.docxFileName)

			for (const img of args.previewImages as Array<{ fileName: string; contentBase64: string; contentType?: string }>) {
				const imgBuffer = decodeBase64(img.contentBase64, 'previewImages[].contentBase64')
				const imgBlob = new Blob([new Uint8Array(imgBuffer)], { type: img.contentType || 'image/png' })
				formData.append('previewImages', imgBlob, img.fileName)
			}

			formData.append(
				'deliveryNote',
				args.deliveryNote || 'Preview page images are available in chat; clean final files stay locked until full payment.',
			)

			return await apiCall(`/api/support/provider/requests/${args.requestId}/deliver`, {
				method: 'POST',
				body: formData,
			})
		}

		// ── Preview Retry ──
		case 'provider_retry_preview':
			return await apiCallRaw(`/api/support/provider/requests/${args.requestId}/previews/retry`, {
				method: 'POST',
			}).then(r => r.data)

		// ── Send Card ──
		case 'provider_send_request_card': {
			const cardData: Record<string, any> = {
				kind: args.kind,
			}
			if (args.message) cardData.message = args.message
			if (args.note) cardData.note = args.note
			if (args.title) cardData.title = args.title
			if (args.amount !== undefined) cardData.amount = args.amount
			if (args.paymentType) cardData.paymentType = args.paymentType
			if (args.expectedAt) cardData.expectedAt = args.expectedAt
			if (args.locked !== undefined) cardData.locked = args.locked
			return await apiCall(`/api/support/provider/requests/${args.requestId}/send-card`, {
				method: 'POST',
				body: JSON.stringify(cardData),
			})
		}

		// ── Auth ──
		case 'provider_set_auth_token':
			setAccessToken(args.accessToken)
			if (args.refreshToken) setRefreshToken(args.refreshToken)
			return { success: true, message: 'Auth tokens updated' }

		case 'provider_check_auth':
			try {
				await apiCall('/api/support/provider/dashboard/stats')
				return { authenticated: true, hasToken: !!getAccessToken() }
			} catch {
				return { authenticated: false, hasToken: !!getAccessToken() }
			}

		default:
			throw new Error(`Unknown tool: ${name}`)
	}
}

// ─── Server Setup ───────────────────────────────────────────────────────────

const server = new Server(
	{
		name: 'cognizapp-provider-mcp',
		version: '1.0.0',
	},
	{
		capabilities: {
			tools: {},
		},
	},
)

server.setRequestHandler(ListToolsRequestSchema, async () => {
	return { tools }
})

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params
	try {
		const result = await handleToolCall(name, args || {})
		return {
			content: [
				{
					type: 'text',
					text: JSON.stringify(result, null, 2),
				},
			],
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		return {
			content: [
				{
					type: 'text',
					text: `Error: ${message}`,
				},
			],
			isError: true,
		}
	}
})

// ─── Start Server ───────────────────────────────────────────────────────────

async function main() {
	const transport = new StdioServerTransport()
	await server.connect(transport)
}

main().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
