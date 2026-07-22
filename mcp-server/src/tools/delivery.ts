/**
 * Delivery tools — deliver final work, retry preview generation, send
 * structured request cards.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall, apiCallRaw, apiFormUpload } from '../api-client.js'
import { REQUEST_CARD_KINDS } from '../constants.js'
import { blobFromBase64, serializeResult } from '../utils.js'

const DOCX_MIME =
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

/**
 * Build the multipart FormData for the final-delivery endpoint
 * (`POST /api/provider/requests/:id/deliver`). Shared by
 * provider_deliver_final_work and provider_deliver_final_work_from_file_ids so
 * both use the exact same backend contract (pdfFile, docxFile, previewImages,
 * deliveryNote).
 */
export function buildDeliveryFormData(input: {
	requestId: string
	pdfFileName: string
	pdfContentBase64: string
	docxFileName: string
	docxContentBase64: string
	previewImages: Array<{ fileName: string; contentBase64: string; contentType?: string }>
	deliveryNote?: string
}): FormData {
	const formData = new FormData()
	const pdfBlob = blobFromBase64(input.pdfContentBase64, 'pdfContentBase64', 'application/pdf')
	formData.append('pdfFile', pdfBlob, input.pdfFileName)
	const docxBlob = blobFromBase64(input.docxContentBase64, 'docxContentBase64', DOCX_MIME)
	formData.append('docxFile', docxBlob, input.docxFileName)
	for (const img of input.previewImages) {
		const imgBlob = blobFromBase64(
			img.contentBase64,
			'previewImages[].contentBase64',
			img.contentType || 'image/png',
		)
		formData.append('previewImages', imgBlob, img.fileName)
	}
	formData.append(
		'deliveryNote',
		input.deliveryNote ||
			'Preview page images are available in chat; clean final files stay locked until full payment.',
	)
	return formData
}

export function registerDeliveryTools(server: McpServer): void {
	server.registerTool(
		'provider_deliver_final_work',
		{
			title: 'Deliver Final Work',
			description: `Upload and publish final delivery for a support request. Requires a clean PDF, a clean DOCX, and ordered preview page images. Preview images are published to chat; clean final files remain locked until full payment.

When to use: When the work is complete and ready for the client to preview. The client sees the preview images in chat and can request the clean files after paying the final balance.
IMPORTANT: Run provider_preflight_delivery first. Prefer provider_deliver_final_work_from_file_ids for large files (it avoids oversized Base64 arguments by downloading already-uploaded files inside the MCP process).
Args:
  - requestId (string, required): The request ID (UUID)
  - pdfFileName (string, required): Filename for the clean PDF
  - pdfContentBase64 (string, required): Base64-encoded clean PDF content
  - docxFileName (string, required): Filename for the clean DOCX
  - docxContentBase64 (string, required): Base64-encoded clean DOCX content
  - previewImages (array, required): Ordered preview page images — each { fileName, contentBase64, contentType? }
  - deliveryNote (string, optional): Delivery note for the client
Returns: The delivery result (preview pages published, final files locked).`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				pdfFileName: z.string().min(1).describe('Filename for the clean PDF'),
				pdfContentBase64: z
					.string()
					.min(1)
					.describe('Base64-encoded clean PDF content'),
				docxFileName: z.string().min(1).describe('Filename for the clean DOCX'),
				docxContentBase64: z
					.string()
					.min(1)
					.describe('Base64-encoded clean DOCX content'),
				previewImages: z
					.array(
						z.object({
							fileName: z.string().min(1).describe('Image filename'),
							contentBase64: z.string().min(1).describe('Base64-encoded image content'),
							contentType: z
								.string()
								.default('image/png')
								.describe('MIME type (e.g. image/png)'),
						}),
					)
					.min(1)
					.describe('Ordered preview page images (at least one)'),
				deliveryNote: z.string().optional().describe('Optional delivery note for the client'),
			},
			annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
		},
		async ({
			requestId,
			pdfFileName,
			pdfContentBase64,
			docxFileName,
			docxContentBase64,
			previewImages,
			deliveryNote,
		}) => {
			const formData = buildDeliveryFormData({
				requestId,
				pdfFileName,
				pdfContentBase64,
				docxFileName,
				docxContentBase64,
				previewImages: previewImages as Array<{
					fileName: string
					contentBase64: string
					contentType?: string
				}>,
				deliveryNote,
			})
			const result = await apiFormUpload(
				`/api/provider/requests/${requestId}/deliver`,
				formData,
			)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_retry_preview',
		{
			title: 'Retry Preview Generation',
			description: `Retry preview generation for a support request. Use when preview status is "failed".

When to use: After a delivery when the preview generation failed. The backend will re-attempt generating preview page images from the delivered PDF.
Args:
  - requestId (string, required): The request ID (UUID)
Returns: Raw response (typically a job status object).`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
			},
			annotations: {
				readOnlyHint: false,
				openWorldHint: false,
				destructiveHint: false,
				idempotentHint: true,
			},
		},
		async ({ requestId }) => {
			const result = await apiCallRaw(
				`/api/provider/requests/${requestId}/previews/retry`,
				{ method: 'POST' },
			)
			return { content: [{ type: 'text', text: serializeResult(result.data) }] }
		},
	)

	server.registerTool(
		'provider_send_request_card',
		{
			title: 'Send Request Card',
			description: `Send a structured card (payment, revision, or delivery) to the chat thread for a request. Use provider_send_milestone_card for milestone cards instead.

When to use: To send a payment request, a revision update, or a delivery notification to the client via a structured card in chat.
IMPORTANT: Send only after the relevant delivery/payment state has been verified (re-read the request first). Never claim work was delivered, paid, or unlocked unless a tool result confirms it.
Args:
  - requestId (string, required): The request ID (UUID)
  - kind (string, required): Card kind — "payment_card", "revision_card", or "delivery_card"
  - message (string, optional): Message to include with the card
  - note (string, optional): Internal note (not shown to client)
  - title (string, optional): Card title
  - amount (number, optional): Amount (for payment cards, in GHS)
  - paymentType (string, optional): Payment type — deposit, final_balance, partial_balance, full_payment
  - expectedAt (string, optional): Expected delivery/payment date (ISO 8601)
  - locked (boolean, optional): Whether the card is locked (default false)
Returns: The result of sending the card.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				kind: z
					.enum(REQUEST_CARD_KINDS)
					.describe('Card kind: payment_card, revision_card, or delivery_card'),
				message: z.string().optional().describe('Message to include with the card'),
				note: z.string().optional().describe('Internal note (not shown to client)'),
				title: z.string().optional().describe('Card title'),
				amount: z.number().min(0).optional().describe('Amount (for payment cards, in GHS)'),
				paymentType: z
					.string()
					.optional()
					.describe('Payment type: deposit, final_balance, partial_balance, full_payment'),
				expectedAt: z
					.string()
					.optional()
					.describe('Expected delivery/payment date (ISO 8601)'),
				locked: z.boolean().optional().describe('Whether the card is locked (default false)'),
			},
			annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
		},
		async ({
			requestId,
			kind,
			message,
			note,
			title,
			amount,
			paymentType,
			expectedAt,
			locked,
		}) => {
			const data: Record<string, unknown> = { kind }
			if (message) data.message = message
			if (note) data.note = note
			if (title) data.title = title
			if (amount !== undefined) data.amount = amount
			if (paymentType) data.paymentType = paymentType
			if (expectedAt) data.expectedAt = expectedAt
			if (locked !== undefined) data.locked = locked
			const result = await apiCall(`/api/provider/requests/${requestId}/send-card`, {
				method: 'POST',
				body: JSON.stringify(data),
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}
