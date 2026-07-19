/**
 * CognizApp Provider MCP Server
 *
 * API client that talks directly to the CognizApp backend API.
 * Auth is via COGNIZAPP_ACCESS_TOKEN env var (JWT access token).
 * Optionally COGNIZAPP_REFRESH_TOKEN for auto-refresh on 401.
 */

const BACKEND_URL =
	process.env.COGNIZAPP_BACKEND_URL ||
	process.env.BACKEND_URL ||
	'http://localhost:4040'

let accessToken = process.env.COGNIZAPP_ACCESS_TOKEN || ''
let refreshToken = process.env.COGNIZAPP_REFRESH_TOKEN || ''

export function setAccessToken(token: string) {
	accessToken = token
}
export function setRefreshToken(token: string) {
	refreshToken = token
}
export function getAccessToken() {
	return accessToken
}

async function refreshSession(): Promise<boolean> {
	if (!refreshToken) return false
	try {
		const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				refreshToken,
				refresh_token: refreshToken,
			}),
		})
		if (!res.ok) return false
		const json = await res.json()
		const data = json.data || json
		if (data.accessToken) {
			accessToken = data.accessToken
			if (data.refreshToken) refreshToken = data.refreshToken
			return true
		}
		return false
	} catch {
		return false
	}
}

export interface ApiOptions {
	method?: string
	body?: string | FormData
	headers?: Record<string, string>
	query?: Record<string, string | undefined>
}

export async function apiCall<T = any>(
	path: string,
	options: ApiOptions = {},
): Promise<T> {
	const url = new URL(`${BACKEND_URL}${path}`)
	if (options.query) {
		for (const [key, value] of Object.entries(options.query)) {
			if (value !== undefined && value !== '') {
				url.searchParams.set(key, value)
			}
		}
	}

	const headers: Record<string, string> = {
		Authorization: `Bearer ${accessToken}`,
		...options.headers,
	}
	if (options.body && !(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json'
	}

	const fetchOptions: RequestInit = {
		method: options.method || 'GET',
		headers,
	}
	if (options.body !== undefined) {
		fetchOptions.body = options.body
	}

	let response = await fetch(url.toString(), fetchOptions)

	// Auto-refresh on 401
	if (response.status === 401 && refreshToken) {
		const refreshed = await refreshSession()
		if (refreshed) {
			headers.Authorization = `Bearer ${accessToken}`
			response = await fetch(url.toString(), {
				...fetchOptions,
				headers,
			})
		}
	}

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

	// Non-JSON response (e.g., file download)
	const blob = await response.blob()
	return blob as unknown as T
}

export async function apiCallRaw(path: string, options: ApiOptions = {}): Promise<{ status: number; data: any }> {
	const url = new URL(`${BACKEND_URL}${path}`)
	if (options.query) {
		for (const [key, value] of Object.entries(options.query)) {
			if (value !== undefined && value !== '') {
				url.searchParams.set(key, value)
			}
		}
	}

	const headers: Record<string, string> = {
		Authorization: `Bearer ${accessToken}`,
		...options.headers,
	}
	if (options.body && !(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json'
	}

	const fetchOptions: RequestInit = {
		method: options.method || 'GET',
		headers,
	}
	if (options.body !== undefined) {
		fetchOptions.body = options.body
	}

	let response = await fetch(url.toString(), fetchOptions)

	if (response.status === 401 && refreshToken) {
		const refreshed = await refreshSession()
		if (refreshed) {
			headers.Authorization = `Bearer ${accessToken}`
			response = await fetch(url.toString(), { ...fetchOptions, headers })
		}
	}

	const contentType = response.headers.get('content-type') || ''
	let data: any
	if (contentType.includes('application/json')) {
		data = await response.json()
	} else {
		data = await response.text().catch(() => null)
	}

	return { status: response.status, data }
}

export { BACKEND_URL }
