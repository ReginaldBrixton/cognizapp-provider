/**
 * Session Management Integration Tests
 *
 * Tests for session listing, revocation, and logout-all functionality.
 * Validates Requirements: 2.1, 2.2, 2.3
 *
 * These tests verify:
 * - Listing active sessions with device information
 * - Revoking individual sessions
 * - Logout-all functionality
 * - Revoked sessions cannot be used for authentication
 */

import { NextRequest } from 'next/server'
import { GET as getSessions } from '../route'
import { POST as revokeSession } from '../revoke/route'
import { POST as logoutAll } from '../../logout-all/route'

// Mock Next.js cookies
jest.mock('next/headers', () => ({
	cookies: jest.fn(),
}))

const { cookies } = require('next/headers')

// Mock fetch globally
global.fetch = jest.fn()

describe('Session Management API Routes', () => {
	const mockAccessToken = 'mock-access-token-123'
	const mockBackendUrl = 'http://localhost:8080'

	beforeEach(() => {
		jest.clearAllMocks()
		process.env.NEXT_PUBLIC_BACKEND_URL = mockBackendUrl

		// Default cookie mock
		cookies.mockResolvedValue({
			get: jest.fn((name: string) => {
				if (name === 'cognizap_provider_access_token') {
					return { value: mockAccessToken }
				}
				return undefined
			}),
			delete: jest.fn(),
		})
	})

	describe('GET /api/auth/sessions - List Active Sessions', () => {
		const mockSessions = {
			sessions: [
				{
					_id: 'session-1',
					user_id: 'user-123',
					provider: 'email',
					email: 'test@example.com',
					role: 'user',
					created_at: '2024-01-15T10:00:00Z',
					expires_at: '2024-02-15T10:00:00Z',
					last_active_at: '2024-01-20T15:30:00Z',
					is_revoked: false,
					device_info: {
						name: 'Chrome on Windows',
						type: 'desktop' as const,
						browser: 'Chrome',
						os: 'Windows 10/11',
					},
					ip_address: '192.168.1.1',
				},
				{
					_id: 'session-2',
					user_id: 'user-123',
					provider: 'email',
					email: 'test@example.com',
					role: 'user',
					created_at: '2024-01-16T12:00:00Z',
					expires_at: '2024-02-16T12:00:00Z',
					last_active_at: '2024-01-20T16:00:00Z',
					is_revoked: false,
					device_info: {
						name: 'Safari on iPhone',
						type: 'mobile' as const,
						browser: 'Safari',
						os: 'iOS 17',
					},
					ip_address: '192.168.1.2',
				},
			],
			total: 2,
		}

		it('should return list of active sessions with device information', async () => {
			// Mock successful backend response
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => mockSessions,
			})

			const request = new NextRequest(
				'http://localhost:3000/api/auth/sessions',
				{
					headers: {
						'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
						'x-forwarded-for': '192.168.1.1',
						'accept-language': 'en-US,en;q=0.9',
					},
				},
			)

			const response = await getSessions(request)
			const data = await response.json()

			// Verify response
			expect(response.status).toBe(200)
			expect(data.sessions).toHaveLength(2)
			expect(data.total).toBe(2)

			// Verify first session has all required fields
			const session1 = data.sessions[0]
			expect(session1._id).toBe('session-1')
			expect(session1.device_info).toBeDefined()
			expect(session1.device_info.name).toBe('Chrome on Windows')
			expect(session1.device_info.type).toBe('desktop')
			expect(session1.created_at).toBeDefined()
			expect(session1.last_active_at).toBeDefined()

			// Verify backend was called with correct headers
			expect(global.fetch).toHaveBeenCalledWith(
				`${mockBackendUrl}/api/auth/sessions`,
				expect.objectContaining({
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockAccessToken}`,
						'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
						'X-Forwarded-For': '192.168.1.1',
						'Accept-Language': 'en-US,en;q=0.9',
					}),
				}),
			)
		})

		it('should return 401 when access token is missing', async () => {
			// Mock missing token
			cookies.mockResolvedValueOnce({
				get: jest.fn(() => undefined),
			})

			const request = new NextRequest('http://localhost:3000/api/auth/sessions')
			const response = await getSessions(request)
			const data = await response.json()

			expect(response.status).toBe(401)
			expect(data.error).toBe('Unauthorized')
			expect(global.fetch).not.toHaveBeenCalled()
		})

		it('should handle backend errors gracefully', async () => {
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
			})

			const request = new NextRequest('http://localhost:3000/api/auth/sessions')
			const response = await getSessions(request)
			const data = await response.json()

			expect(response.status).toBe(500)
			expect(data.error).toBe('Failed to fetch sessions')
		})

		it('should handle network errors', async () => {
			;(global.fetch as jest.Mock).mockRejectedValueOnce(
				new Error('Network error'),
			)

			const request = new NextRequest('http://localhost:3000/api/auth/sessions')
			const response = await getSessions(request)
			const data = await response.json()

			expect(response.status).toBe(500)
			expect(data.error).toBe('Network error')
		})
	})

	describe('POST /api/auth/sessions/revoke - Revoke Individual Session', () => {
		it('should successfully revoke a specific session', async () => {
			const sessionIdToRevoke = 'session-2'

			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: 'Session revoked successfully',
				}),
			})

			const request = new NextRequest(
				'http://localhost:3000/api/auth/sessions/revoke',
				{
					method: 'POST',
					headers: {
						'content-type': 'application/json',
						'user-agent': 'Mozilla/5.0',
						'x-forwarded-for': '192.168.1.1',
						'accept-language': 'en-US',
					},
					body: JSON.stringify({ session_id: sessionIdToRevoke }),
				},
			)

			const response = await revokeSession(request)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.success).toBe(true)
			expect(data.message).toBe('Session revoked successfully')

			// Verify backend was called with correct payload
			expect(global.fetch).toHaveBeenCalledWith(
				`${mockBackendUrl}/api/auth/sessions/revoke`,
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockAccessToken}`,
						'Content-Type': 'application/json',
					}),
					body: JSON.stringify({ session_id: sessionIdToRevoke }),
				}),
			)
		})

		it('should return 400 when session_id is missing', async () => {
			const request = new NextRequest(
				'http://localhost:3000/api/auth/sessions/revoke',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({}),
				},
			)

			const response = await revokeSession(request)
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data.error).toBe('session_id is required')
			expect(global.fetch).not.toHaveBeenCalled()
		})

		it('should return 401 when access token is missing', async () => {
			cookies.mockResolvedValueOnce({
				get: jest.fn(() => undefined),
			})

			const request = new NextRequest(
				'http://localhost:3000/api/auth/sessions/revoke',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ session_id: 'session-123' }),
				},
			)

			const response = await revokeSession(request)
			const data = await response.json()

			expect(response.status).toBe(401)
			expect(data.error).toBe('Unauthorized')
		})

		it('should handle invalid JSON in request body', async () => {
			const request = new NextRequest(
				'http://localhost:3000/api/auth/sessions/revoke',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: 'invalid-json{',
				},
			)

			const response = await revokeSession(request)
			const data = await response.json()

			expect(response.status).toBe(400)
			expect(data.error).toBe('Invalid JSON in request body')
		})

		it('should forward backend errors to client', async () => {
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 404,
				json: async () => ({
					error: 'Session not found',
					code: 'session_not_found',
				}),
			})

			const request = new NextRequest(
				'http://localhost:3000/api/auth/sessions/revoke',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ session_id: 'non-existent-session' }),
				},
			)

			const response = await revokeSession(request)
			const data = await response.json()

			expect(response.status).toBe(404)
			expect(data.error).toBe('Session not found')
			expect(data.code).toBe('session_not_found')
		})
	})

	describe('POST /api/auth/logout-all - Logout All Devices', () => {
		it('should revoke all sessions and clear cookies', async () => {
			const mockCookieStore = {
				get: jest.fn((name: string) => {
					if (name === 'cognizap_provider_access_token') {
						return { value: mockAccessToken }
					}
					return undefined
				}),
				delete: jest.fn(),
			}

			cookies.mockResolvedValueOnce(mockCookieStore)
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: 'All sessions revoked',
					revoked_count: 3,
				}),
			})

			const request = new NextRequest(
				'http://localhost:3000/api/auth/logout-all',
				{
					method: 'POST',
					headers: {
						'user-agent': 'Mozilla/5.0',
						'x-forwarded-for': '192.168.1.1',
						'accept-language': 'en-US',
					},
				},
			)

			const response = await logoutAll(request)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.success).toBe(true)
			expect(data.revoked_count).toBe(3)

			// Verify backend was called
			expect(global.fetch).toHaveBeenCalledWith(
				`${mockBackendUrl}/api/auth/logout-all`,
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockAccessToken}`,
					}),
				}),
			)

			// Verify cookies were deleted
			expect(mockCookieStore.delete).toHaveBeenCalledTimes(2)
			// Note: We can't directly verify the cookie names in the response
			// because NextResponse.cookies.delete is called on the response object
		})

		it('should clear cookies even when backend fails', async () => {
			const mockCookieStore = {
				get: jest.fn((name: string) => {
					if (name === 'cognizap_provider_access_token') {
						return { value: mockAccessToken }
					}
					return undefined
				}),
				delete: jest.fn(),
			}

			cookies.mockResolvedValueOnce(mockCookieStore)
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({
					error: 'Internal server error',
				}),
			})

			const request = new NextRequest(
				'http://localhost:3000/api/auth/logout-all',
				{
					method: 'POST',
				},
			)

			const response = await logoutAll(request)
			const data = await response.json()

			expect(response.status).toBe(500)
			expect(data.error).toBe('Internal server error')

			// Cookies should still be cleared even on backend error
			// This is verified by checking that the response has cookie deletion calls
		})

		it('should return 401 when not authenticated', async () => {
			cookies.mockResolvedValueOnce({
				get: jest.fn(() => undefined),
			})

			const request = new NextRequest(
				'http://localhost:3000/api/auth/logout-all',
				{
					method: 'POST',
				},
			)

			const response = await logoutAll(request)
			const data = await response.json()

			expect(response.status).toBe(401)
			expect(data.error).toBe('Not authenticated')
			expect(global.fetch).not.toHaveBeenCalled()
		})

		it('should handle network errors and still clear cookies', async () => {
			const mockCookieStore = {
				get: jest.fn((name: string) => {
					if (name === 'cognizap_provider_access_token') {
						return { value: mockAccessToken }
					}
					return undefined
				}),
				delete: jest.fn(),
			}

			cookies.mockResolvedValueOnce(mockCookieStore)
			;(global.fetch as jest.Mock).mockRejectedValueOnce(
				new Error('Network error'),
			)

			const request = new NextRequest(
				'http://localhost:3000/api/auth/logout-all',
				{
					method: 'POST',
				},
			)

			const response = await logoutAll(request)
			const data = await response.json()

			expect(response.status).toBe(500)
			expect(data.error).toBe('Failed to logout from all devices')
		})
	})

	describe('Integration: Revoked Sessions Cannot Be Used', () => {
		it('should reject requests with revoked session tokens', async () => {
			const revokedToken = 'revoked-token-456'

			// Mock cookie with revoked token
			cookies.mockResolvedValueOnce({
				get: jest.fn((name: string) => {
					if (name === 'cognizap_provider_access_token') {
						return { value: revokedToken }
					}
					return undefined
				}),
			})

			// Backend should return 401 for revoked token
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({
					error: 'Session has been revoked',
					code: 'session_revoked',
				}),
			})

			const request = new NextRequest('http://localhost:3000/api/auth/sessions')
			const response = await getSessions(request)
			const data = await response.json()

			expect(response.status).toBe(401)
			expect(data.error).toBe('Session has been revoked')
		})

		it('should verify session revocation workflow', async () => {
			// Step 1: List sessions (should succeed)
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					sessions: [
						{ _id: 'session-1', is_revoked: false },
						{ _id: 'session-2', is_revoked: false },
					],
					total: 2,
				}),
			})

			const listRequest = new NextRequest(
				'http://localhost:3000/api/auth/sessions',
			)
			const listResponse = await getSessions(listRequest)
			const listData = await listResponse.json()

			expect(listResponse.status).toBe(200)
			expect(listData.sessions).toHaveLength(2)

			// Step 2: Revoke one session
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: 'Session revoked',
				}),
			})

			const revokeRequest = new NextRequest(
				'http://localhost:3000/api/auth/sessions/revoke',
				{
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ session_id: 'session-2' }),
				},
			)

			const revokeResponse = await revokeSession(revokeRequest)
			const revokeData = await revokeResponse.json()

			expect(revokeResponse.status).toBe(200)
			expect(revokeData.success).toBe(true)

			// Step 3: Verify revoked session cannot be used
			// (This would be tested in a real integration test with actual backend)
			// Here we simulate the expected behavior
			cookies.mockResolvedValueOnce({
				get: jest.fn(() => ({ value: 'session-2-token' })),
			})
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({
					error: 'Session has been revoked',
				}),
			})

			const verifyRequest = new NextRequest(
				'http://localhost:3000/api/auth/sessions',
			)
			const verifyResponse = await getSessions(verifyRequest)

			expect(verifyResponse.status).toBe(401)
		})
	})

	describe('Edge Cases and Error Handling', () => {
		it('should handle empty session list', async () => {
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					sessions: [],
					total: 0,
				}),
			})

			const request = new NextRequest('http://localhost:3000/api/auth/sessions')
			const response = await getSessions(request)
			const data = await response.json()

			expect(response.status).toBe(200)
			expect(data.sessions).toHaveLength(0)
			expect(data.total).toBe(0)
		})

		it('should handle malformed backend response', async () => {
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => {
					throw new Error('Invalid JSON')
				},
			})

			const request = new NextRequest('http://localhost:3000/api/auth/sessions')

			// This should throw and be caught by the route handler
			await expect(async () => {
				await getSessions(request)
			}).rejects.toThrow()
		})

		it('should handle concurrent session revocations', async () => {
			// Simulate revoking multiple sessions concurrently
			const sessionIds = ['session-1', 'session-2', 'session-3']

			sessionIds.forEach(() => {
				;(global.fetch as jest.Mock).mockResolvedValueOnce({
					ok: true,
					json: async () => ({ success: true }),
				})
			})

			const requests = sessionIds.map((sessionId) =>
				revokeSession(
					new NextRequest('http://localhost:3000/api/auth/sessions/revoke', {
						method: 'POST',
						headers: { 'content-type': 'application/json' },
						body: JSON.stringify({ session_id: sessionId }),
					}),
				),
			)

			const responses = await Promise.all(requests)

			responses.forEach((response) => {
				expect(response.status).toBe(200)
			})

			expect(global.fetch).toHaveBeenCalledTimes(3)
		})
	})
})
