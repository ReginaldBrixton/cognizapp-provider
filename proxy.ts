import { NextResponse, type NextRequest } from 'next/server'
import {
	ACCESS_TOKEN_COOKIE,
	REFRESH_TOKEN_COOKIE,
	refreshBackendSession,
	setAuthCookies,
} from '@/lib/server/auth-session'

const PUBLIC_EXACT_PATHS = new Set([
	'/',
	'/login',
	'/register',
])

const PUBLIC_PREFIXES: string[] = []
const SKIP_PREFIXES = ['/api/', '/_next/', '/static/', '/favicon.ico']

const PROVIDER_ROLES = new Set(['SUPPORT_PROVIDER_USER', 'DEV_USER'])

const PROVIDER_PREFIXES = ['/provider']

function isPublicPage(pathname: string) {
	return (
		PUBLIC_EXACT_PATHS.has(pathname) ||
		PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))
	)
}

function shouldSkipProxy(pathname: string) {
	return SKIP_PREFIXES.some((prefix) => pathname.startsWith(prefix))
}

function hasCognizAppSession(request: NextRequest) {
	return Boolean(
		request.cookies.get(ACCESS_TOKEN_COOKIE)?.value ||
		request.cookies.get(REFRESH_TOKEN_COOKIE)?.value,
	)
}

function decodeJwtPayload(token: string): Record<string, unknown> {
	try {
		const segment = token.split('.')[1]
		if (!segment) return {}
		const b64 = segment.replace(/-/g, '+').replace(/_/g, '/')
		const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=')
		return JSON.parse(atob(padded))
	} catch {
		return {}
	}
}

function getRoleFromToken(token: string | undefined): string {
	if (!token) return ''
	const payload = decodeJwtPayload(token)
	return (payload.role as string) || ''
}

// The single source of truth for where a signed-in account belongs.
// Provider accounts land in the provider portal; everyone else is redirected to login.
function homeForRole(role: string, requestUrl: string): URL {
	if (PROVIDER_ROLES.has(role)) {
		return new URL('/provider/dashboard', requestUrl)
	}
	return new URL('/login', requestUrl)
}

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

	if (shouldSkipProxy(pathname)) {
		return NextResponse.next({ request })
	}

	if (/\.[a-zA-Z0-9]+$/.test(pathname)) {
		return NextResponse.next({ request })
	}

	if (isPublicPage(pathname)) {
		return NextResponse.next({ request })
	}

	const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value
	const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value
	const role = getRoleFromToken(token)

	const isAuthenticated = hasCognizAppSession(request)
	const isProvider = PROVIDER_ROLES.has(role)

	// No tokens at all → redirect to login
	if (!isAuthenticated) {
		const url = request.nextUrl.clone()
		url.pathname = '/login'
		url.searchParams.set('redirectTo', `${pathname}${request.nextUrl.search}`)
		return NextResponse.redirect(url)
	}

	// Access token present → pass through
	if (token) {
		if (PROVIDER_PREFIXES.some((p) => pathname.startsWith(p))) {
			if (!isProvider) {
				return NextResponse.redirect(homeForRole(role, request.url))
			}
			return NextResponse.next({ request })
		}

		return NextResponse.next({ request })
	}

	// No access token but have refresh token → proactively refresh
	// This keeps users logged in for up to 30 days
	if (refreshToken && !pathname.startsWith('/api/')) {
		const refreshed = await refreshBackendSession(request)

		if (refreshed?.accessToken) {
			const response = NextResponse.next({ request })
			setAuthCookies(response, {
				accessToken: refreshed.accessToken,
				refreshToken: refreshed.refreshToken,
				expiresIn: refreshed.expiresIn,
			})
			return response
		}

		// Refresh failed → redirect to login
		const url = request.nextUrl.clone()
		url.pathname = '/login'
		url.searchParams.set('redirectTo', `${pathname}${request.nextUrl.search}`)
		const response = NextResponse.redirect(url)
		response.cookies.delete(ACCESS_TOKEN_COOKIE)
		response.cookies.delete(REFRESH_TOKEN_COOKIE)
		return response
	}

	return NextResponse.next({ request })
}

export const config = {
	matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.).*)'],
}
