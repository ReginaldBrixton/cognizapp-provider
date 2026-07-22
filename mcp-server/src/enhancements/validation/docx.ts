/**
 * DOCX package validation.
 *
 * Confirms the buffer is a valid OOXML (WordprocessingML) package with the
 * required entries the backend's delivery endpoint expects. Also exposes a
 * media counter used by the image-parity check.
 */

import { readZip } from '../zip/zip-reader.js'

export interface DocxValidationResult {
	ok: boolean
	detail: string
	/** Number of media entries under word/media/. */
	mediaCount: number
}

const REQUIRED_ENTRIES = ['[Content_Types].xml', 'word/document.xml']

/** Validate a DOCX buffer and count its media entries. */
export function validateDocx(buf: Buffer): DocxValidationResult {
	if (buf.length < 4 || buf.subarray(0, 2).toString('latin1') !== 'PK') {
		return { ok: false, detail: 'Not a ZIP/OOXML package (missing PK signature)', mediaCount: 0 }
	}

	let zip
	try {
		zip = readZip(buf)
	} catch (e) {
		return {
			ok: false,
			detail: `Invalid ZIP package: ${e instanceof Error ? e.message : String(e)}`,
			mediaCount: 0,
		}
	}

	const missing = REQUIRED_ENTRIES.filter((p) => !zip.has(p))
	if (missing.length > 0) {
		return {
			ok: false,
			detail: `Missing required DOCX entries: ${missing.join(', ')}`,
			mediaCount: 0,
		}
	}

	const mediaCount = zip.entries.filter((e) => /^word\/media\//i.test(e.name)).length
	return { ok: true, detail: `Valid DOCX (${buf.length} bytes, ${mediaCount} media entries)`, mediaCount }
}
