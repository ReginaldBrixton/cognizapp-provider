/**
 * Shared types for the image-safe provider enhancement tools.
 *
 * These tools never move large Base64 payloads through the model→tool request.
 * Instead they download already-uploaded files inside the MCP process via the
 * adapter in {@link EnhancementDeps}, so the only values the agent passes are
 * file IDs and small options.
 */

/** A file downloaded from CognizApp, ready for in-process inspection. */
export interface DownloadedProviderFile {
	fileId: string
	filename: string
	contentType: string
	/** Byte length, if known. */
	size?: number
	/** Raw file bytes, Base64-encoded (kept here for parity with provider_download_file). */
	contentBase64: string
}

/**
 * Adapter the enhancement handlers use to reach the existing API client.
 * Auth/refresh logic stays inside `api-client.ts`; these are thin wrappers.
 */
export interface EnhancementDeps {
	/** Download a file by ID. Must use `response.arrayBuffer()` before Base64. */
	downloadFile: (fileId: string) => Promise<DownloadedProviderFile>

	/** Upload a file to a request. Returns backend upload result (file metadata). */
	uploadFile: (input: {
		requestId: string
		fileName: string
		contentBase64: string
		contentType: string
		milestoneId?: string
		purpose?: string
	}) => Promise<unknown>

	/** Invoke the existing final-delivery endpoint with normalized parts. */
	deliverFinalWork: (input: {
		requestId: string
		pdfFileName: string
		pdfContentBase64: string
		docxFileName: string
		docxContentBase64: string
		previewImages: Array<{ fileName: string; contentBase64: string; contentType?: string }>
		deliveryNote?: string
	}) => Promise<unknown>
}

/** A single extracted image asset, in document order. */
export interface ImageAsset {
	/** 1-based position in document order. */
	order: number
	/** Relationship ID (rId…) when resolvable, else the ZIP entry name. */
	relId: string
	/** ZIP entry path, e.g. `word/media/image1.png`. */
	entryPath: string
	/** Suggested filename for re-upload, e.g. `image1.png`. */
	filename: string
	contentType: string
	/** Byte length of the extracted image. */
	size: number
	/** Base64 of the extracted image bytes (only populated when requested). */
	contentBase64?: string
	/** File ID returned by CognizApp after re-upload, when requested. */
	uploadedFileId?: string
}

/** Manifest for one inspected document. */
export interface DocumentAssetManifest {
	fileId: string
	filename: string
	/** `docx` | `pptx` | `xlsx` | `pdf` | `other`. */
	documentType: string
	/** Ordered image assets (empty for PDF/other). */
	images: ImageAsset[]
	/** Notes for the agent (e.g. PDF render-pages guidance). */
	notes: string[]
}

/** Result of {@link provider_inspect_document_assets}. */
export interface InspectDocumentAssetsResult {
	requestId?: string
	documents: DocumentAssetManifest[]
	/** Total images across all documents. */
	totalImages: number
	/** True if any image was re-uploaded to the request. */
	uploaded: boolean
	partial: boolean
	errors: string[]
}

/** One check run by {@link provider_preflight_delivery}. */
export interface PreflightCheck {
	name: string
	ok: boolean
	detail: string
}

/** Result of {@link provider_preflight_delivery}. */
export interface PreflightDeliveryResult {
	ok: boolean
	checks: PreflightCheck[]
	imageParity: {
		sourceImageCount: number
		outputImageCount: number
		matching: boolean
		allowImageCountReduction: boolean
	}
	errors: string[]
}
