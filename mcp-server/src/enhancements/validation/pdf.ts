/**
 * PDF structural validation.
 *
 * PDF embedded-image extraction is NOT treated as lossless — the manifest
 * directs the agent to render PDF pages when exact visual preservation is
 * required. Here we only validate that the file is a well-formed PDF the
 * backend's delivery endpoint will accept.
 */

export interface PdfValidationResult {
	ok: boolean
	detail: string
}

/** Validate a PDF buffer: signature, page object, and EOF marker. */
export function validatePdf(buf: Buffer): PdfValidationResult {
	if (buf.length < 8) {
		return { ok: false, detail: 'PDF too short (< 8 bytes)' }
	}
	const head = buf.subarray(0, 5).toString('latin1')
	if (head !== '%PDF-') {
		return { ok: false, detail: `Missing %PDF- signature (got "${head}")` }
	}

	// A page object must exist. Match `/Type /Page` (not `/Pages`).
	const text = buf.subarray(0, Math.min(buf.length, 5_000_000)).toString('latin1')
	if (!/\/Type\s*\/Page[^s]/.test(text) && !/\/Type\s*\/Pages\b/.test(text)) {
		return { ok: false, detail: 'No /Type /Page or /Type /Pages object found' }
	}

	// EOF marker: `%%EOF` within the last 1024 bytes (per PDF spec tolerance).
	const tail = buf.subarray(Math.max(0, buf.length - 1024)).toString('latin1')
	if (!/%%EOF/.test(tail)) {
		return { ok: false, detail: 'Missing %%EOF marker in the last 1024 bytes' }
	}

	return { ok: true, detail: `Valid PDF (${buf.length} bytes)` }
}
