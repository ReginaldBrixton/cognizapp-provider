/**
 * provider_deliver_final_work_from_file_ids — download already-uploaded files
 * inside the MCP process and invoke the existing final-delivery endpoint.
 *
 * This removes the large Base64 payload from the model→tool request while
 * preserving the current backend contract (same multipart fields as
 * provider_deliver_final_work: pdfFile, docxFile, previewImages, deliveryNote).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { serializeResult } from '../../utils.js'
import type { EnhancementDeps } from '../types.js'

async function safe<T>(p: Promise<T>): Promise<[T | null, string | null]> {
	try {
		return [await p, null]
	} catch (e) {
		return [null, e instanceof Error ? e.message : String(e)]
	}
}

export function registerDeliverFromFileIdsTool(server: McpServer, deps: EnhancementDeps): void {
	server.registerTool(
		'provider_deliver_final_work_from_file_ids',
		{
			title: 'Deliver Final Work From File IDs',
			description: `Deliver final work by downloading already-uploaded files inside the MCP process and invoking the existing final-delivery endpoint. Preferred over provider_deliver_final_work for large files — avoids oversized Base64 arguments.

When to use: After provider_preflight_delivery passes. The PDF, DOCX, and preview images must already be uploaded to the request (via provider_upload_file). Clean final files remain locked until full payment.
Args:
  - requestId (string, required): The request ID (UUID)
  - pdfFileId (string, required): File ID of the already-uploaded clean PDF
  - docxFileId (string, required): File ID of the already-uploaded clean DOCX
  - previewImageFileIds (string[], required): File IDs of already-uploaded preview page images (ordered)
  - deliveryNote (string, optional): Delivery note for the client
Returns: The delivery result (preview pages published, final files locked). Read the result before claiming delivery succeeded.`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				pdfFileId: z.string().min(1).describe('File ID of the already-uploaded clean PDF'),
				docxFileId: z.string().min(1).describe('File ID of the already-uploaded clean DOCX'),
				previewImageFileIds: z
					.array(z.string().min(1))
					.min(1)
					.describe('File IDs of already-uploaded preview page images (ordered)'),
				deliveryNote: z.string().optional().describe('Delivery note for the client'),
			},
			annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
		},
		async ({ requestId, pdfFileId, docxFileId, previewImageFileIds, deliveryNote }) => {
			const result = await deliverFinalWorkFromFileIds(deps, {
				requestId: requestId as string,
				pdfFileId: pdfFileId as string,
				docxFileId: docxFileId as string,
				previewImageFileIds: previewImageFileIds as string[],
				deliveryNote: deliveryNote as string | undefined,
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}

interface DeliverFromFileIdsArgs {
	requestId: string
	pdfFileId: string
	docxFileId: string
	previewImageFileIds: string[]
	deliveryNote?: string
}

/** Core logic, exported for unit testing. */
export async function deliverFinalWorkFromFileIds(
	deps: EnhancementDeps,
	args: DeliverFromFileIdsArgs,
): Promise<unknown> {
	// Download all files in parallel inside the MCP process.
	const [pdf, pdfErr] = await safe(deps.downloadFile(args.pdfFileId))
	if (pdfErr || !pdf) {
		throw new Error(`Failed to download PDF ${args.pdfFileId}: ${pdfErr}`)
	}
	const [docx, docxErr] = await safe(deps.downloadFile(args.docxFileId))
	if (docxErr || !docx) {
		throw new Error(`Failed to download DOCX ${args.docxFileId}: ${docxErr}`)
	}

	const previews: Array<{ fileName: string; contentBase64: string; contentType?: string }> = []
	for (const fid of args.previewImageFileIds) {
		const [img, imgErr] = await safe(deps.downloadFile(fid))
		if (imgErr || !img) {
			throw new Error(`Failed to download preview ${fid}: ${imgErr}`)
		}
		previews.push({
			fileName: img.filename || `preview-${fid}.png`,
			contentBase64: img.contentBase64,
			contentType: img.contentType,
		})
	}

	// Delegate to the shared delivery adapter (same backend contract).
	return deps.deliverFinalWork({
		requestId: args.requestId,
		pdfFileName: pdf.filename || 'final.pdf',
		pdfContentBase64: pdf.contentBase64,
		docxFileName: docx.filename || 'final.docx',
		docxContentBase64: docx.contentBase64,
		previewImages: previews,
		deliveryNote: args.deliveryNote,
	})
}
