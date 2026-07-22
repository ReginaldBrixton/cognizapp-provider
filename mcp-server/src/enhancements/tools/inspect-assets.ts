/**
 * provider_inspect_document_assets — extract ordered image assets from
 * DOCX/PPTX/XLSX packages and optionally upload those images back to the
 * request so the agent can reference asset file IDs instead of large Base64.
 *
 * PDF embedded-image extraction is NOT lossless; the manifest directs the
 * agent to render PDF pages when exact visual preservation is required.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { serializeResult } from '../../utils.js'
import type {
	DocumentAssetManifest,
	EnhancementDeps,
	ImageAsset,
	InspectDocumentAssetsResult,
} from '../types.js'
import { readZip } from '../zip/zip-reader.js'
import { extractDocxAssets } from '../zip/docx-assets.js'
import { extractPptxAssets } from '../zip/pptx-assets.js'
import { extractXlsxAssets } from '../zip/xlsx-assets.js'

/** Best-effort wrapper: returns [value, error]. Never throws. */
async function safe<T>(p: Promise<T>): Promise<[T | null, string | null]> {
	try {
		return [await p, null]
	} catch (e) {
		return [null, e instanceof Error ? e.message : String(e)]
	}
}

function detectType(filename: string, contentType: string, bytes: Buffer): string {
	const lower = filename.toLowerCase()
	if (lower.endsWith('.docx')) return 'docx'
	if (lower.endsWith('.pptx')) return 'pptx'
	if (lower.endsWith('.xlsx')) return 'xlsx'
	if (lower.endsWith('.pdf') || contentType === 'application/pdf') return 'pdf'
	if (bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b) {
		// ZIP but not a known Office extension — sniff content types.
		return 'zip'
	}
	return 'other'
}

export function registerInspectAssetsTool(server: McpServer, deps: EnhancementDeps): void {
	server.registerTool(
		'provider_inspect_document_assets',
		{
			title: 'Inspect Document Assets',
			description: `Extract ordered image assets from DOCX/PPTX/XLSX source documents and optionally upload them back to the request. Returns a deterministic manifest in document/slide order.

When to use: BEFORE generating or editing any DOCX/PPTX/XLSX/PDF deliverable. The manifest gives you image order and (when uploadImagesBack=true) asset file IDs to reference instead of large Base64 strings.
PDF note: embedded-image extraction is NOT lossless. For PDFs this returns a render-pages guidance note, not extracted images.
Args:
  - fileIds (string[], required): One or more source file IDs to inspect
  - requestId (string, optional): Required when uploadImagesBack=true (re-uploads attach to this request)
  - uploadImagesBack (boolean, optional, default false): Re-upload extracted images to the request and return their file IDs
Returns: { documents: [{ fileId, filename, documentType, images: [{ order, relId, filename, contentType, size, uploadedFileId? }], notes[] }], totalImages, uploaded, partial, errors[] }`,
			inputSchema: {
				fileIds: z
					.array(z.string().min(1))
					.min(1)
					.describe('One or more source file IDs to inspect (UUIDs)'),
				requestId: z
					.string()
					.optional()
					.describe('Required when uploadImagesBack=true (re-uploads attach to this request)'),
				uploadImagesBack: z
					.boolean()
					.default(false)
					.describe('Re-upload extracted images to the request and return their file IDs'),
			},
			annotations: { readOnlyHint: false, openWorldHint: false, destructiveHint: false },
		},
		async ({ fileIds, requestId, uploadImagesBack }) => {
			const result = await inspectDocumentAssets(
				deps,
				fileIds as string[],
				requestId as string | undefined,
				Boolean(uploadImagesBack),
			)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}

/** Core logic, exported for unit testing. */
export async function inspectDocumentAssets(
	deps: EnhancementDeps,
	fileIds: string[],
	requestId?: string,
	uploadImagesBack = false,
): Promise<InspectDocumentAssetsResult> {
	if (uploadImagesBack && !requestId) {
		return {
			documents: [],
			totalImages: 0,
			uploaded: false,
			partial: true,
			errors: ['requestId is required when uploadImagesBack=true'],
		}
	}

	const documents: DocumentAssetManifest[] = []
	const errors: string[] = []
	let totalImages = 0
	let uploaded = false

	for (const fileId of fileIds) {
		const [file, fileErr] = await safe(deps.downloadFile(fileId))
		if (fileErr || !file) {
			errors.push(`download ${fileId}: ${fileErr}`)
			continue
		}

		const bytes = Buffer.from(file.contentBase64, 'base64')
		const documentType = detectType(file.filename, file.contentType, bytes)
		const notes: string[] = []
		let images: ImageAsset[] = []

		if (documentType === 'docx' || documentType === 'zip') {
			try {
				const zip = readZip(bytes)
				if (zip.has('word/document.xml')) {
					images = extractDocxAssets(zip, uploadImagesBack)
				} else {
					notes.push('ZIP package is not a DOCX (no word/document.xml)')
				}
			} catch (e) {
				errors.push(`docx parse ${fileId}: ${e instanceof Error ? e.message : String(e)}`)
			}
		} else if (documentType === 'pptx') {
			try {
				images = extractPptxAssets(readZip(bytes), uploadImagesBack)
			} catch (e) {
				errors.push(`pptx parse ${fileId}: ${e instanceof Error ? e.message : String(e)}`)
			}
		} else if (documentType === 'xlsx') {
			try {
				images = extractXlsxAssets(readZip(bytes), uploadImagesBack)
			} catch (e) {
				errors.push(`xlsx parse ${fileId}: ${e instanceof Error ? e.message : String(e)}`)
			}
		} else if (documentType === 'pdf') {
			notes.push(
				'PDF embedded-image extraction is not lossless. Render PDF pages to images when exact visual preservation is required.',
			)
		} else {
			notes.push(`Unsupported document type for asset extraction: ${documentType}`)
		}

		// Re-upload extracted images if requested.
		if (uploadImagesBack && requestId && images.length > 0) {
			for (const img of images) {
				const [uploadRes, uploadErr] = await safe(
					deps.uploadFile({
						requestId,
						fileName: img.filename,
						contentBase64: img.contentBase64 ?? '',
						contentType: img.contentType,
						purpose: 'request_attachment',
					}),
				)
				if (uploadErr) {
					errors.push(`re-upload ${img.filename}: ${uploadErr}`)
					continue
				}
				const uploadedId = extractFileId(uploadRes)
				if (uploadedId) {
					img.uploadedFileId = uploadedId
					uploaded = true
				}
			}
		}

		totalImages += images.length
		documents.push({
			fileId,
			filename: file.filename,
			documentType,
			images,
			notes,
		})
	}

	return {
		requestId,
		documents,
		totalImages,
		uploaded,
		partial: errors.length > 0,
		errors,
	}
}

/** Best-effort extraction of a file ID from an upload response. */
function extractFileId(res: unknown): string | undefined {
	if (!res || typeof res !== 'object') return undefined
	const r = res as Record<string, unknown>
	// Common shapes: { id }, { fileId }, { file: { id } }, { files: [{ id }] }
	if (typeof r.id === 'string') return r.id
	if (typeof r.fileId === 'string') return r.fileId
	if (r.file && typeof (r.file as Record<string, unknown>).id === 'string') {
		return (r.file as Record<string, unknown>).id as string
	}
	if (Array.isArray(r.files) && r.files[0] && typeof (r.files[0] as Record<string, unknown>).id === 'string') {
		return (r.files[0] as Record<string, unknown>).id as string
	}
	return undefined
}
