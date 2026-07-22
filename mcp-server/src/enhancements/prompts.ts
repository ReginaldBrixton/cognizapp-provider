/**
 * Reusable MCP prompts for the image-safe provider workflow.
 *
 * Hosts that surface MCP prompts will offer these directly. Hosts that do not
 * can still reach the same guidance via the provider_get_agent_playbook tool
 * and the server instructions.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'

/** Text content helper for prompt messages. */
function textMsg(text: string) {
	return {
		messages: [
			{ role: 'user' as const, content: { type: 'text' as const, text } },
		],
	}
}

const PROMPTS = {
	requestHandling: `Handle this CognizApp support request end-to-end.

Mandatory sequence:
1. Call provider_request_summary (or provider_get_request) to read the request.
2. Call provider_get_thread_messages to read the conversation before replying.
3. Inspect every source document with provider_inspect_document_assets before quoting or producing work.
4. Quote, message, or change status only AFTER reading the request and thread.
5. NEVER claim an upload, delivery, payment, or unlock succeeded unless a tool result confirms it. Read every tool response.

Report status to the client only from tool results, never from assumptions.`,

	imagePreservingDocumentWork: `Produce an image-preserving deliverable for this CognizApp request.

1. provider_request_summary — read the request and thread.
2. provider_inspect_document_assets on every relevant source DOCX/PPTX/XLSX. The manifest gives ordered image assets and (when re-uploaded) asset file IDs.
3. PDF embedded-image extraction is NOT lossless — render PDF pages to images when exact visual preservation is required.
4. Generate/edit the DOCX preserving the extracted image order. Upload extracted images back to the request and reference asset file IDs instead of passing large Base64 through the model.
5. Generate a matching PDF and render review-size preview pages (PNG/JPEG).
6. Upload PDF, DOCX, and previews with provider_upload_file.
7. provider_preflight_delivery with the original source file IDs — this validates structure and checks source vs output image count. Set allowImageCountReduction=true ONLY if you intentionally removed source images.
8. provider_deliver_final_work_from_file_ids — downloads the already-uploaded files inside the MCP process (no large Base64 argument).
9. Send a completion message, then a payment card.
10. Re-read the request and verify final state.

Clean final files stay locked until full payment.`,

	finalDeliveryAndPayment: `Complete final delivery and payment for this CognizApp request.

1. provider_request_summary — confirm the request and current payment state from the tool result.
2. provider_preflight_delivery — MUST run before delivery. It validates PDF/DOCX/preview integrity and image parity.
3. provider_deliver_final_work_from_file_ids — deliver using already-uploaded file IDs (preferred for large files). Only use provider_deliver_final_work with inline Base64 for small files.
4. Read the delivery tool result. Do NOT claim delivery succeeded unless the result confirms it.
5. provider_send_request_card with kind=payment_card to request payment.
6. Clean final files remain locked until full payment — do not claim they are unlocked unless a tool result says so.
7. Re-read the request and verify the final state.`,

	revisions: `Handle a revision request for this CognizApp support request.

1. provider_request_summary — re-read the request and thread. Do NOT assume the previous delivery state; verify it from the tool result.
2. provider_inspect_document_assets — re-inspect the source assets (and the previously delivered output if needed).
3. Regenerate the DOCX preserving image order, then the PDF, then preview pages.
4. provider_preflight_delivery with the original source file IDs before re-delivering.
5. provider_deliver_final_work_from_file_ids — re-deliver.
6. Read the delivery tool result before reporting completion.
7. Send a revision update message; re-read the request and verify final state.`,
} as const

/** Register the four reusable prompts on the high-level McpServer. */
export function registerProviderPrompts(server: McpServer): void {
	server.registerPrompt(
		'provider_handle_request',
		{
			title: 'Handle a Support Request',
			description:
				'End-to-end guidance for handling a CognizApp support request: read request + thread, inspect assets, then act. Enforces verification-before-claiming.',
		},
		() => textMsg(PROMPTS.requestHandling),
	)

	server.registerPrompt(
		'provider_image_preserving_document_work',
		{
			title: 'Image-Preserving Document Work',
			description:
				'Step-by-step guidance for producing a DOCX/PDF deliverable that preserves source images, including asset inspection, preflight, and file-ID delivery.',
			argsSchema: {
				requestId: z
					.string()
					.min(1)
					.describe('The support request ID (UUID) to produce work for'),
			},
		},
		() => textMsg(PROMPTS.imagePreservingDocumentWork),
	)

	server.registerPrompt(
		'provider_final_delivery_and_payment',
		{
			title: 'Final Delivery & Payment',
			description:
				'Guidance for completing final delivery and requesting payment, including mandatory preflight and verification of the delivery result.',
			argsSchema: {
				requestId: z
					.string()
					.min(1)
					.describe('The support request ID (UUID) to deliver'),
			},
		},
		() => textMsg(PROMPTS.finalDeliveryAndPayment),
	)

	server.registerPrompt(
		'provider_handle_revision',
		{
			title: 'Handle a Revision',
			description:
				'Guidance for handling a revision request: re-read state, re-inspect assets, regenerate, preflight, re-deliver, verify.',
			argsSchema: {
				requestId: z
					.string()
					.min(1)
					.describe('The support request ID (UUID) under revision'),
			},
		},
		() => textMsg(PROMPTS.revisions),
	)
}

/** Exported for verification tests (mandatory-language assertions). */
export const PROVIDER_PROMPTS = PROMPTS
