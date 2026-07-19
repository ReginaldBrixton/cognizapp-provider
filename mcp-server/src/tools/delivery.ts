/**
 * Delivery tools — deliver final work, retry preview generation, send
 * structured request cards.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall, apiCallRaw, apiFormUpload } from '../api-client.js'
import { REQUEST_CARD_KINDS } from '../constants.js'
import { blobFromBase64, serializeResult } from '../utils.js'

export function registerDeliveryTools(server: McpServer): void {
	server.registerTool(
		'provider_deliver_final_work',
		{
			title: 'Deliver Final Work',
			description: `Upload and publish final delivery for a support request. Requires a clean PDF, a clean DOCX, and ordered preview page images. Preview images are published to chat; clean final files remain locked until full payment.

When to use: When the work is complete and ready for the client to preview. The client sees the preview images in chat and can request the clean files after paying the final balance.
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
			const formData = new FormData()
			const pdfBlob = blobFromBase64(
				pdfContentBase64,
				'pdfContentBase64',
				'application/pdf',
			)
			formData.append('pdfFile', pdfBlob, pdfFileName)
			const docxBlob = blobFromBase64(
				docxContentBase64,
				'docxContentBase64',
				'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
			)
			formData.append('docxFile', docxBlob, docxFileName)
			for (const img of previewImages as Array<{
				fileName: string
				contentBase64: string
				contentType?: string
			}>) {
				const imgBlob = blobFromBase64(
					img.contentBase64,
					'previewImages[].contentBase64',
					img.contentType || 'image/png',
				)
				formData.append('previewImages', imgBlob, img.fileName)
			}
			formData.append(
				'deliveryNote',
				deliveryNote ||
				'Preview page images are available in chat; clean final files stay locked until full payment.',
			)
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
