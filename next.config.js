/** @type {import('next').NextConfig} */

const withPWA = require('next-pwa')({
	dest: 'public',
	register: true,
	skipWaiting: true,
	disable: process.env.NODE_ENV === 'development' || process.env.VERCEL === '1',
})

const FALLBACK_DEVELOPMENT_BACKEND_URL = 'http://localhost:4040'
const FALLBACK_DEVELOPMENT_USERS_API_URL = 'http://localhost:4040'

function resolveBackendUrl() {
	const privateBackendUrl = process.env.BACKEND_URL?.trim()
	const usersServiceUrl = process.env.USERS_URL?.trim()
	const publicBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
	const publicBackendProductionUrl =
		process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL?.trim()
	const deploymentUsersUrl = process.env.VERCEL_URL
		? `https://${process.env.VERCEL_URL}/users-api`
		: undefined
	const configuredBackendUrl =
		process.env.NODE_ENV === 'production'
			? privateBackendUrl ||
				usersServiceUrl ||
				publicBackendProductionUrl ||
				deploymentUsersUrl
			: privateBackendUrl || usersServiceUrl || publicBackendUrl

	const isLocalBackendUrl = Boolean(
		configuredBackendUrl?.match(
			/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i,
		),
	)

	return configuredBackendUrl &&
		!(process.env.NODE_ENV === 'production' && isLocalBackendUrl)
		? configuredBackendUrl
		: process.env.NODE_ENV === 'production'
			? publicBackendProductionUrl ||
				deploymentUsersUrl ||
				usersServiceUrl ||
				FALLBACK_DEVELOPMENT_BACKEND_URL
			: FALLBACK_DEVELOPMENT_BACKEND_URL
}

const backendUrl = resolveBackendUrl()
const usersApiUrl =
	process.env.USERS_API_ORIGIN?.trim() ||
	process.env.USERS_URL?.trim() ||
	process.env.NEXT_PUBLIC_USERS_API_URL?.trim() ||
	process.env.NEXT_PUBLIC_USERS_URL?.trim() ||
	process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL?.trim() ||
	(process.env.NODE_ENV === 'production'
		? '/users-api'
		: FALLBACK_DEVELOPMENT_USERS_API_URL)

const shouldProxyUsersApi = /^https?:\/\//i.test(usersApiUrl)

// Security headers for production
const securityHeaders = [
	{
		key: 'X-Content-Type-Options',
		value: 'nosniff',
	},
	{
		key: 'X-Frame-Options',
		value: 'DENY',
	},
	{
		key: 'X-DNS-Prefetch-Control',
		value: 'off',
	},
	{
		key: 'Strict-Transport-Security',
		value: 'max-age=63072000; includeSubDomains; preload',
	},
	{
		key: 'Referrer-Policy',
		value: 'strict-origin-when-cross-origin',
	},
	{
		key: 'Permissions-Policy',
		value: 'camera=(), microphone=(), geolocation=()',
	},
	{
		key: 'Content-Security-Policy',
		value: [
			"default-src 'self'",
			"script-src 'self' 'unsafe-inline' https://cognizapp.xyz https://www.cognizapp.xyz https://cognizap-users.vercel.app https://js.paystack.co",
			"style-src 'self' 'unsafe-inline' https:",
			"img-src 'self' data: blob: https:",
			"font-src 'self' data:",
			"connect-src 'self' https://cognizap-users.vercel.app https://api.paystack.co https://*.paystack.co https://*.paystack.com wss:",
			"frame-src https://checkout.paystack.com https://*.paystack.co https://*.paystack.com",
			"media-src 'self' blob:",
			"frame-ancestors 'none'",
			"base-uri 'self'",
			"form-action 'self'",
		].join('; '),
	},
]

module.exports = withPWA({
	reactStrictMode: true,
	allowedDevOrigins: ['127.0.0.1', 'localhost'],

	images: {
		remotePatterns: [
			{
				protocol: 'https',
				hostname: 'images.unsplash.com',
			},
			{
				protocol: 'https',
				hostname: '*.supabase.co',
			},
		],
	},

	// Minimal headers for faster dev
	async headers() {
		if (process.env.NODE_ENV === 'production') {
			return [
				{
					source: '/:path*',
					headers: securityHeaders,
				},
			]
		}
		return []
	},

	// PROXY: Rewrite /api calls to backend to allow First-Party Cookies
	// BUT exclude frontend API routes (like /api/workspaces/*/dashboard)
	async rewrites() {
		return [
			{
				// Proxy backend API routes (starts with /api/user/ or /api/v1/)
				source: '/api/user/:path*',
				destination: `${backendUrl}/api/user/:path*`,
			},
			{
				source: '/api/v1/:path*',
				destination: `${backendUrl}/api/v1/:path*`,
			},
			...(shouldProxyUsersApi
				? [
					{
						source: '/users-api/:path*',
						destination: `${usersApiUrl}/:path*`,
					},
				]
				: []),
		]
	},
})
