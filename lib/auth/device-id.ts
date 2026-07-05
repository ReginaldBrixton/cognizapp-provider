/**
 * Device ID helper for the provider portal.
 *
 * A stable `cognizap_provider_device_id` cookie identifies the physical device
 * across logins so the backend can correlate sessions and activity-log entries
 * from the same device. The cookie is set httpOnly by the /api/auth/pin/login
 * route (so it cannot be read by client-side JS), but we still send the device
 * id in the login request body so the very first login (before the cookie
 * exists) is already bound to a stable id.
 *
 * On the client we read a non-httpOnly mirror cookie
 * `cognizap_provider_device_id_client` to remember the id between sessions.
 * If neither exists we generate a fresh UUIDv4.
 */

export const DEVICE_ID_COOKIE_CLIENT = 'cognizap_provider_device_id_client'

function readCookie(name: string): string | null {
	if (typeof document === 'undefined' || !document.cookie) {
		return null
	}
	const match = document.cookie.match(
		new RegExp('(?:^|; )' + name.replace(/[.$?*|{}()[\]\\/+^]/g, '\\$&') + '=([^;]*)'),
	)
	return match ? decodeURIComponent(match[1]) : null
}

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function generateUuid(): string {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID()
	}
	// Fallback for older browsers.
	const bytes = new Uint8Array(16)
	if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
		crypto.getRandomValues(bytes)
	} else {
		for (let i = 0; i < 16; i += 1) bytes[i] = Math.floor(Math.random() * 256)
	}
	bytes[6] = (bytes[6] & 0x0f) | 0x40
	bytes[8] = (bytes[8] & 0x3f) | 0x80
	const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
	return `${hex.slice(0, 4).join('')}-${hex.slice(4, 5).join('')}-${hex
		.slice(5, 7)
		.join('')}-${hex.slice(7, 9).join('')}-${hex.slice(9, 16).join('')}`
}

/**
 * Returns a stable device id for the current browser. Reads the client-side
 * mirror cookie first; if absent, generates a new UUID and writes it back as a
 * non-httpOnly cookie (1 year) so it persists. The httpOnly canonical cookie is
 * managed by the login API route.
 */
export function getOrCreateDeviceId(): string {
	const existing = readCookie(DEVICE_ID_COOKIE_CLIENT)
	if (existing && UUID_V4.test(existing)) {
		return existing
	}
	const id = generateUuid()
	if (typeof document !== 'undefined') {
		const secure = window.location.protocol === 'https:' ? '; Secure' : ''
		document.cookie = `${DEVICE_ID_COOKIE_CLIENT}=${encodeURIComponent(
			id,
		)}; Max-Age=31536000; Path=/; SameSite=Lax${secure}`
	}
	return id
}
