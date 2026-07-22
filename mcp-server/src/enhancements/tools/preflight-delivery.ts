/**
 * provider_preflight_delivery — validate file structure and image parity
 * before the final delivery call. Checks:
 *   - valid PDF signature, page object, and EOF marker;
 *   - valid DOCX package and required entries;
 *   - valid review-size PNG/JPEG previews;
 *   - source image count vs output DOCX image count (parity).
 *
 * Delivery is blocked when output image count < source image count unless
 * allowImageCountReduction is set.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { serializeResult } from '../../utils.js'
import type {
	EnhancementDeps,
	PreflightCheck,
	PreflightDeliveryResult,
} from '../types.js'
import { validatePdf } from '../validation/pdf.js'
import { validateDocx } from '../validation/docx.js'
import { validatePreviewImage } from '../validation/images.js'
import { readZip } from '../zip/zip-reader.js'
import { extractDocxAssets } from '../zip/docx-assets.js'
import { extractPptxAssets } from '../zip/pptx-assets.js'
import { extractXlsxAssets } from '../zip/xlsx-assets.js'

async function safe<T>(p: Promise<T>): Promise<[T | null, string | null]> {
	try {
		return [await p, null]
	} catch (e) {
		return [null, e instanceof Error ? e.message : String(e)]
	}
}

/** Count ordered images in an Office package buffer (0 for non-Office). */
function countOfficeImages(buf: Buffer, filename: string): number {
	const lower = filename.toLowerCase()
	try {
		const zip = readZip(buf)
		if (lower.endsWith('.docx') || zip.has('word/document.xml')) {
			return extractDocxAssets(zip, false).length
		}
		if (lower.endsWith('.pptx')) return extractPptxAssets(zip, false).length
		if (lower.endsWith('.xlsx')) return extractXlsxAssets(zip, false).length
	} catch {
		return 0
	}
	return 0
}

export function registerPreflightDeliveryTool(server: McpServer, deps: EnhancementDeps): void {
	server.registerTool(
		'provider_preflight_delivery',
		{
			title: 'Preflight Delivery',
			description: `Validate PDF/DOCX/preview integrity and compare source vs output image counts BEFORE final delivery. Run this before provider_deliver_final_work or provider_deliver_final_work_from_file_ids.

When to use: Immediately before delivery. Preflight downloads the file IDs inside the MCP process (no large Base64 argument) and returns a pass/fail report.
Args:
  - requestId (string, required): The request ID (UUID)
  - pdfFileId (string, optional): File ID of the clean PDF to validate
  - docxFileId (string, optional): File ID of the clean DOCX to validate
  - previewImageFileIds (string[], optional): File IDs of preview page images to validate
  - sourceFileIds (string[], optional): Original source file IDs used to compute source image count for parity
  - allowImageCountReduction (boolean, optional, default false): Set true ONLY when source images are intentionally removed from the output
Returns: { ok, checks: [{ name, ok, detail }], imageParity: { sourceImageCount, outputImageCount, matching, allowImageCountReduction }, errors[] }`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				pdfFileId: z.string().optional().describe('File ID of the clean PDF to validate'),
				docxFileId: z.string().optional().describe('File ID of the clean DOCX to validate'),
				previewImageFileIds: z
					.array(z.string().min(1))
					.optional()
					.describe('File IDs of preview page images to validate'),
				sourceFileIds: z
					.array(z.string().min(1))
					.optional()
					.describe('Original source file IDs used to compute source image count for parity'),
				allowImageCountReduction: z
					.boolean()
					.default(false)
					.describe('Set true ONLY when source images are intentionally removed from the output'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async (args) => {
			const result = await preflightDelivery(deps, {
				requestId: args.requestId as string,
				pdfFileId: args.pdfFileId as string | undefined,
				docxFileId: args.docxFileId as string | undefined,
				previewImageFileIds: args.previewImageFileIds as string[] | undefined,
				sourceFileIds: args.sourceFileIds as string[] | undefined,
				allowImageCountReduction: Boolean(args.allowImageCountReduction),
			})
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}

interface PreflightArgs {
	requestId: string
	pdfFileId?: string
	docxFileId?: string
	previewImageFileIds?: string[]
	sourceFileIds?: string[]
	allowImageCountReduction: boolean
}

/** Core logic, exported for unit testing. */
export async function preflightDelivery(
	deps: EnhancementDeps,
	args: PreflightArgs,
): Promise<PreflightDeliveryResult> {
	const checks: PreflightCheck[] = []
	const errors: string[] = []

	// PDF validation
	if (args.pdfFileId) {
		const [file, err] = await safe(deps.downloadFile(args.pdfFileId))
		if (err || !file) {
			checks.push({ name: 'pdf', ok: false, detail: `download failed: ${err}` })
			errors.push(`pdf download: ${err}`)
		} else {
			const r = validatePdf(Buffer.from(file.contentBase64, 'base64'))
			checks.push({ name: 'pdf', ok: r.ok, detail: r.detail })
			if (!r.ok) errors.push(`pdf: ${r.detail}`)
		}
	}

	// DOCX validation + output image count
	let outputImageCount = 0
	if (args.docxFileId) {
		const [file, err] = await safe(deps.downloadFile(args.docxFileId))
		if (err || !file) {
			checks.push({ name: 'docx', ok: false, detail: `download failed: ${err}` })
			errors.push(`docx download: ${err}`)
		} else {
			const buf = Buffer.from(file.contentBase64, 'base64')
			const r = validateDocx(buf)
			outputImageCount = r.mediaCount
			// Prefer the structural count from validateDocx; fall back to ordered extraction.
			if (r.ok && outputImageCount === 0) {
				outputImageCount = countOfficeImages(buf, file.filename)
			}
			checks.push({
				name: 'docx',
				ok: r.ok,
				detail: r.ok ? `${r.detail}; ordered image count: ${outputImageCount}` : r.detail,
			})
			if (!r.ok) errors.push(`docx: ${r.detail}`)
		}
	}

	// Preview validation
	if (args.previewImageFileIds && args.previewImageFileIds.length > 0) {
		let allOk = true
		const details: string[] = []
		for (const fid of args.previewImageFileIds) {
			const [file, err] = await safe(deps.downloadFile(fid))
			if (err || !file) {
				allOk = false
				details.push(`${fid}: download failed (${err})`)
				errors.push(`preview ${fid}: ${err}`)
				continue
			}
			const r = validatePreviewImage(Buffer.from(file.contentBase64, 'base64'))
			if (!r.ok) {
				allOk = false
				errors.push(`preview ${fid}: ${r.detail}`)
			}
			details.push(`${file.filename || fid}: ${r.detail}`)
		}
		checks.push({
			name: 'previews',
			ok: allOk,
			detail: `${args.previewImageFileIds.length} preview(s): ${details.join('; ')}`,
		})
	}

	// Source image count (sum across source Office documents)
	let sourceImageCount = 0
	if (args.sourceFileIds && args.sourceFileIds.length > 0) {
		for (const fid of args.sourceFileIds) {
			const [file, err] = await safe(deps.downloadFile(fid))
			if (err || !file) {
				errors.push(`source ${fid}: ${err}`)
				continue
			}
			sourceImageCount += countOfficeImages(
				Buffer.from(file.contentBase64, 'base64'),
				file.filename,
			)
		}
	}

	// Image parity
	const parityCheckPerformed =
		(args.sourceFileIds && args.sourceFileIds.length > 0 && !!args.docxFileId) || false
	let matching = true
	if (parityCheckPerformed) {
		matching =
			outputImageCount >= sourceImageCount || args.allowImageCountReduction
		checks.push({
			name: 'image_parity',
			ok: matching,
			detail:
				`source=${sourceImageCount} output=${outputImageCount} ` +
				`allowReduction=${args.allowImageCountReduction}`,
		})
		if (!matching) {
			errors.push(
				`Image parity failed: output has ${outputImageCount} image(s) but source has ${sourceImageCount}. ` +
					`Set allowImageCountReduction=true ONLY if you intentionally removed source images.`,
			)
		}
	}

	const ok = checks.length > 0 && checks.every((c) => c.ok) && errors.length === 0
	return {
		ok,
		checks,
		imageParity: {
			sourceImageCount,
			outputImageCount,
			matching,
			allowImageCountReduction: args.allowImageCountReduction,
		},
		errors,
	}
}
