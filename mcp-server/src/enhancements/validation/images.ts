/**
 * Preview image validation.
 *
 * Delivery preview pages must be review-size PNG or JPEG images. We check the
 * magic bytes and a generous upper bound so the backend isn't asked to publish
 * oversized previews to chat.
 */

export interface ImageValidationResult {
	ok: boolean
	detail: string
	format: 'png' | 'jpeg' | 'unknown'
}

/** Max preview size: 8 MB per image — review-size, not full-resolution. */
export const MAX_PREVIEW_BYTES = 8 * 1024 * 1024

/** Validate a single preview image buffer. */
export function validatePreviewImage(buf: Buffer): ImageValidationResult {
	if (buf.length < 8) {
		return { ok: false, detail: 'Preview image too short (< 8 bytes)', format: 'unknown' }
	}

	// PNG: 89 50 4E 47 0D 0A 1A 0A
	const isPng =
		buf[0] === 0x89 &&
		buf[1] === 0x50 &&
		buf[2] === 0x4e &&
		buf[3] === 0x47 &&
		buf[4] === 0x0d &&
		buf[5] === 0x0a &&
		buf[6] === 0x1a &&
		buf[7] === 0x0a

	// JPEG: FF D8 FF
	const isJpeg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff

	if (!isPng && !isJpeg) {
		return { ok: false, detail: 'Preview is neither PNG nor JPEG (bad magic bytes)', format: 'unknown' }
	}

	if (buf.length > MAX_PREVIEW_BYTES) {
		return {
			ok: false,
			detail: `Preview image exceeds ${MAX_PREVIEW_BYTES} bytes (got ${buf.length})`,
			format: isPng ? 'png' : 'jpeg',
		}
	}

	return {
		ok: true,
		detail: `Valid ${isPng ? 'PNG' : 'JPEG'} preview (${buf.length} bytes)`,
		format: isPng ? 'png' : 'jpeg',
	}
}
