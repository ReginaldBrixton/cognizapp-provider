/**
 * CognizApp Provider MCP Server
 *
 * API client that talks to the CognizApp Provider frontend API (which proxies to the backend).
 * Auth is via a single static passkey (COGNIZAPP_MCP_PASSKEY env var).
 * No JWT tokens, no refresh tokens, no email — just the passkey.
 * The passkey is sent via the X-MCP-Passkey header on every request.
 */

const PROVIDER_URL =
	process.env.COGNIZAPP_PROVIDER_URL ||
	process.env.PROVIDER_URL ||
	// Legacy aliases (prefer provider URL; these remain for older configs only)
	process.env.COGNIZAPP_BACKEND_URL ||
	process.env.BACKEND_URL ||
	'http://localhost:3001'

const MCP_PASSKEY = process.env.COGNIZAPP_MCP_PASSKEY || ''

export function hasPasskey(): boolean {
	return MCP_PASSKEY.length > 0
}

export interface ApiOptions {
	method?: string
	body?: string | FormData
	headers?: Record<string, string>
	query?: Record<string, string | undefined>
}

/** Build auth headers — just the passkey, nothing else. */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
	const headers: Record<string, string> = {}
	if (MCP_PASSKEY) {
		headers['X-MCP-Passkey'] = MCP_PASSKEY
	}
	return { ...headers, ...extra }
}

export async function apiCall<T = any>(
	path: string,
	options: ApiOptions = {},
): Promise<T> {
	const url = new URL(`${PROVIDER_URL}${path}`)
	if (options.query) {
		for (const [key, value] of Object.entries(options.query)) {
			if (value !== undefined && value !== '') {
				url.searchParams.set(key, value)
			}
		}
	}

	const headers = authHeaders(options.headers)
	if (options.body && !(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json'
	}

	const response = await fetch(url.toString(), {
		method: options.method || 'GET',
		headers,
		body: options.body,
	})

	if (!response.ok) {
		const text = await response.text().catch(() => '')
		let errorMsg = `HTTP ${response.status}`
		try {
			const json = JSON.parse(text)
			errorMsg = json.error || json.message || errorMsg
		} catch {
			if (text) errorMsg = text
		}
		throw new Error(`${errorMsg} (path: ${path})`)
	}

	const contentType = response.headers.get('content-type') || ''
	if (contentType.includes('application/json')) {
		const json = await response.json()
		return (json.data ?? json) as T
	}

	const blob = await response.blob()
	return blob as unknown as T
}

/**
 * Like {@link apiCall} but returns the raw response body (without unwrapping
 * a `data` field). Useful for endpoints that return `{ data, message }` where
 * you want both fields, or for non-JSON responses.
 */
export async function apiCallJson<T = any>(
	path: string,
	options: ApiOptions = {},
): Promise<T> {
	const url = new URL(`${PROVIDER_URL}${path}`)
	if (options.query) {
		for (const [key, value] of Object.entries(options.query)) {
			if (value !== undefined && value !== '') {
				url.searchParams.set(key, value)
			}
		}
	}

	const headers = authHeaders(options.headers)
	if (options.body && !(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json'
	}

	const response = await fetch(url.toString(), {
		method: options.method || 'GET',
		headers,
		body: options.body,
	})

	if (!response.ok) {
		const text = await response.text().catch(() => '')
		let errorMsg = `HTTP ${response.status}`
		try {
			const json = JSON.parse(text)
			errorMsg = json.error || json.message || errorMsg
		} catch {
			if (text) errorMsg = text
		}
		throw new Error(`${errorMsg} (path: ${path})`)
	}

	const contentType = response.headers.get('content-type') || ''
	if (contentType.includes('application/json')) {
		return (await response.json()) as T
	}
	const text = await response.text().catch(() => '')
	return text as unknown as T
}

/**
 * Upload a file via multipart form data. The form is built by the caller and
 * passed through unchanged. Returns the parsed JSON body (or raw text).
 */
export async function apiFormUpload<T = any>(
	path: string,
	formData: FormData,
	method: string = 'POST',
): Promise<T> {
	const url = new URL(`${PROVIDER_URL}${path}`)
	const headers = authHeaders()
	const response = await fetch(url.toString(), {
		method,
		headers,
		body: formData,
	})
	if (!response.ok) {
		const text = await response.text().catch(() => '')
		let errorMsg = `HTTP ${response.status}`
		try {
			const json = JSON.parse(text)
			errorMsg = json.error || json.message || errorMsg
		} catch {
			if (text) errorMsg = text
		}
		throw new Error(`${errorMsg} (path: ${path})`)
	}
	const contentType = response.headers.get('content-type') || ''
	if (contentType.includes('application/json')) {
		const json = await response.json()
		return (json.data ?? json) as T
	}
	const text = await response.text().catch(() => '')
	return text as unknown as T
}

export async function apiCallRaw(path: string, options: ApiOptions = {}): Promise<{ status: number; data: any }> {
	const url = new URL(`${PROVIDER_URL}${path}`)
	if (options.query) {
		for (const [key, value] of Object.entries(options.query)) {
			if (value !== undefined && value !== '') {
				url.searchParams.set(key, value)
			}
		}
	}

	const headers = authHeaders(options.headers)
	if (options.body && !(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json'
	}

	const response = await fetch(url.toString(), {
		method: options.method || 'GET',
		headers,
		body: options.body,
	})

	const contentType = response.headers.get('content-type') || ''
	let data: any
	if (contentType.includes('application/json')) {
		data = await response.json()
	} else {
		data = await response.text().catch(() => null)
	}

	return { status: response.status, data }
}

/**
 * Download a binary file from the backend.
 * Returns the raw bytes as a Buffer along with content-type and filename.
 */
export async function apiDownloadBinary(
	path: string,
	options: ApiOptions = {},
): Promise<{ status: number; buffer: Buffer; contentType: string; filename: string | null }> {
	const url = new URL(`${PROVIDER_URL}${path}`)
	if (options.query) {
		for (const [key, value] of Object.entries(options.query)) {
			if (value !== undefined && value !== '') {
				url.searchParams.set(key, value)
			}
		}
	}

	const headers = authHeaders(options.headers)

	const response = await fetch(url.toString(), {
		method: options.method || 'GET',
		headers,
	})

	if (!response.ok) {
		const text = await response.text().catch(() => '')
		let errorMsg = `HTTP ${response.status}`
		try {
			const json = JSON.parse(text)
			errorMsg = json.error || json.message || errorMsg
		} catch {
			if (text) errorMsg = text
		}
		throw new Error(`${errorMsg} (path: ${path})`)
	}

	const contentType = response.headers.get('content-type') || 'application/octet-stream'
	const disposition = response.headers.get('content-disposition') || ''
	const filenameMatch = disposition.match(/filename="?([^"]+)"?/)
	const filename = filenameMatch ? filenameMatch[1] : null
	const arrayBuffer = await response.arrayBuffer()

	return {
		status: response.status,
		buffer: Buffer.from(arrayBuffer),
		contentType,
		filename,
	}
}

export { PROVIDER_URL }

