/**
 * Shared utilities for the CognizApp Provider MCP server.
 */

import { CHARACTER_LIMIT } from './constants.js'

// ─── Base64 decoding ────────────────────────────────────────────────────────

/**
 * Safely decode a base64 string to a Buffer, throwing a clear error on
 * invalid input. Accepts raw base64 or a `data:<mime>;base64,...` URI.
 */
export function decodeBase64(input: string, fieldName: string): Buffer {
	if (!input || typeof input !== 'string') {
		throw new Error(`${fieldName} is required and must be a base64 string`)
	}
	const trimmed = input.trim()
	const b64Content = trimmed.startsWith('data:') ? (trimmed.split(',')[1] ?? '') : trimmed
	if (!/^[A-Za-z0-9+/]+={0,2}$/.test(b64Content) || b64Content.length % 4 !== 0) {
		throw new Error(`${fieldName} is not valid base64 data`)
	}
	try {
		return Buffer.from(b64Content, 'base64')
	} catch {
		throw new Error(`Failed to decode ${fieldName} as base64`)
	}
}

// ─── Error formatting ───────────────────────────────────────────────────────

/**
 * Map a thrown error (typically from the API client) to an actionable,
 * human-readable message. Inspects HTTP status codes embedded in the
 * message string and suggests next steps.
 */
export function formatApiError(error: unknown): string {
	const raw = error instanceof Error ? error.message : String(error)
	const statusMatch = raw.match(/HTTP (\d{3})/)
	const status = statusMatch ? Number(statusMatch[1]) : null

	if (status === 401) {
		return `${raw}\n\nAction: The MCP passkey is missing or invalid. Check COGNIZAPP_MCP_PASSKEY and run provider_check_auth.`
	}
	if (status === 403) {
		return `${raw}\n\nAction: The passkey account lacks permission for this operation. Confirm the cognizapp@gmail.com account has the provider role.`
	}
	if (status === 404) {
		return `${raw}\n\nAction: The resource was not found. Verify the ID is correct — call the relevant list tool (e.g. provider_list_requests) to see valid IDs.`
	}
	if (status === 409) {
		return `${raw}\n\nAction: The request conflicts with the current resource state. Re-fetch the resource and retry with the updated state.`
	}
	if (status === 429) {
		return `${raw}\n\nAction: Rate limit exceeded. Wait before retrying. The AI document endpoints are limited per hour.`
	}
	if (status === 502 || status === 504) {
		return `${raw}\n\nAction: Upstream service error (Gemini AI or backend). Retry after a brief wait.`
	}
	return raw
}

// ─── Response truncation ────────────────────────────────────────────────────

/**
 * Truncate a serialised response string to CHARACTER_LIMIT and append a
 * truncation notice if it was cut. Returns the (possibly truncated) string
 * and a boolean indicating whether truncation occurred.
 */
export function truncateForMcp(text: string): { text: string; truncated: boolean } {
	if (text.length <= CHARACTER_LIMIT) {
		return { text, truncated: false }
	}
	const cut = text.slice(0, CHARACTER_LIMIT - 200)
	return {
		text: `${cut}\n\n[truncated: response exceeded ${CHARACTER_LIMIT} chars. Add filters or reduce limit to see more.]`,
		truncated: true,
	}
}

/**
 * Serialise any value to pretty JSON, then truncate to CHARACTER_LIMIT.
 */
export function serializeResult(value: unknown): string {
	const json = JSON.stringify(value, null, 2)
	return truncateForMcp(json).text
}

// ─── Misc ───────────────────────────────────────────────────────────────────

/**
 * Build a Blob from a base64 string with the given MIME type.
 */
export function blobFromBase64(
	base64: string,
	fieldName: string,
	contentType: string,
): Blob {
	const buffer = decodeBase64(base64, fieldName)
	return new Blob([new Uint8Array(buffer)], { type: contentType })
}
