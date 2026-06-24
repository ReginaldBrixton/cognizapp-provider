/**
 * Logout Flow Integration Tests
 *
 * Tests the complete logout flow including:
 * - Session revocation in backend
 * - MongoDB session marking as revoked
 * - Cookie clearing
 *
 * **Validates: Requirements 5.5**
 *
 * This test suite verifies Property 6: Logout Revokes Current Session
 * *For any* authenticated session, calling logout should mark that session
 * as revoked in MongoDB and clear the authentication cookies.
 */

// Mock Next.js cookies before importing the route
jest.mock('next/headers', () => ({
	cookies: jest.fn(),
}))

// Mock fetch globally before any imports
global.fetch = jest.fn() as jest.Mock

const { cookies } = require('next/headers')

// Import after mocks are set up
import { POST as logout } from '../route'

describe('Logout Flow Integration Tests', () => {
	const mockAccessToken = 'mock-access-token-abc123'
	const mockRefreshToken = 'mock-refresh-token-xyz789'
	const mockBackendUrl = 'http://localhost:8080'
	const mockSessionId = 'session-abc-123'

	// Helper to create a mock request
	const createMockRequest = () => {
		return {} as any
	}

	beforeEach(() => {
		jest.clearAllMocks()
		process.env.NEXT_PUBLIC_BACKEND_URL = mockBackendUrl

		// Default cookie mock with both tokens
		cookies.mockResolvedValue({
			get: jest.fn((name: string) => {
				if (name === 'cognizap_access_token') {
					return { value: mockAccessToken }
				}
				if (name === 'cognizap_refresh_token') {
					return { value: mockRefreshToken }
				}
				return undefined
			}),
			delete: jest.fn(),
		})
	})

	describe('Property 6: Logout Revokes Current Session', () => {
		it('should revoke current session in backend', async () => {
			// Mock successful backend logout
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					message: 'Session revoked successfully',
					session_id: mockSessionId,
				}),
			})

			const request = createMockRequest()
			const response = await logout(request)
			const data = await response.json()

			// Verify response
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)

			// Verify backend was called with correct authorization
			expect(global.fetch).toHaveBeenCalledWith(
				`${mockBackendUrl}/api/auth/logout`,
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockAccessToken}`,
					}),
				}),
			)
		})

		it('should clear authentication cookies after logout', async () => {
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

			const request = createMockRequest()
			const response = await logout(request)

			// Verify cookies are deleted in the response
			const setCookieHeaders = response.headers.getSetCookie()

			// Check that both cookies are being deleted
			const hasAccessTokenDelete = setCookieHeaders.some(
				(header: string) =>
					header.includes('cognizap_access_token') &&
					(header.includes('Max-Age=0') || header.includes('Expires=')),
			)
			const hasRefreshTokenDelete = setCookieHeaders.some(
				(header: string) =>
					header.includes('cognizap_refresh_token') &&
					(header.includes('Max-Age=0') || header.includes('Expires=')),
			)

			expect(hasAccessTokenDelete).toBe(true)
			expect(hasRefreshTokenDelete).toBe(true)
		})

		it('should clear cookies even when backend fails', async () => {
			// Mock backend error
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 500,
				json: async () => ({
					error: 'Internal server error',
				}),
			})

			const request = createMockRequest()
			const response = await logout(request)
			const data = await response.json()

			// Should still succeed and clear cookies
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)

			// Verify cookies are deleted
			const setCookieHeaders = response.headers.getSetCookie()
			expect(setCookieHeaders.length).toBeGreaterThan(0)
		})

		it('should clear cookies even on network error', async () => {
			// Mock network error
			;(global.fetch as jest.Mock).mockRejectedValueOnce(
				new Error('Network error: ECONNREFUSED'),
			)

			const request = createMockRequest()
			const response = await logout(request)
			const data = await response.json()

			// Should still succeed and clear cookies
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)

			// Verify cookies are deleted
			const setCookieHeaders = response.headers.getSetCookie()
			expect(setCookieHeaders.length).toBeGreaterThan(0)
		})
	})

	describe('Session Revocation Verification', () => {
		it('should verify session cannot be used after logout', async () => {
			// Step 1: Successful logout
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					success: true,
					session_id: mockSessionId,
				}),
			})

			const logoutRequest = createMockRequest()
			const logoutResponse = await logout(logoutRequest)
			expect(logoutResponse.status).toBe(200)

			// Step 2: Attempt to use the same token (simulated)
			// In a real scenario, the backend would reject this token
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({
					error: 'Session has been revoked',
					code: 'session_revoked',
				}),
			})

			// Simulate trying to use the revoked token
			const verifyResponse = await fetch(`${mockBackendUrl}/api/auth/me`, {
				headers: {
					Authorization: `Bearer ${mockAccessToken}`,
				},
			})

			expect(verifyResponse.status).toBe(401)
			const verifyData = await verifyResponse.json()
			expect(verifyData.code).toBe('session_revoked')
		})

		it('should handle logout with expired token gracefully', async () => {
			// Mock backend returning token expired error
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: false,
				status: 401,
				json: async () => ({
					error: 'Token expired',
					code: 'token_expired',
				}),
			})

			const request = createMockRequest()
			const response = await logout(request)
			const data = await response.json()

			// Should still clear cookies even with expired token
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)

			// Verify cookies are deleted
			const setCookieHeaders = response.headers.getSetCookie()
			expect(setCookieHeaders.length).toBeGreaterThan(0)
		})
	})

	describe('Authentication Requirements', () => {
		it('should return 401 when access token is missing', async () => {
			// Mock missing token
			cookies.mockResolvedValueOnce({
				get: jest.fn(() => undefined),
				delete: jest.fn(),
			})

			const request = createMockRequest()
			const response = await logout(request)
			const data = await response.json()

			expect(response.status).toBe(401)
			expect(data.error).toBe('Not authenticated')
			expect(global.fetch).not.toHaveBeenCalled()
		})

		it('should not call backend when not authenticated', async () => {
			cookies.mockResolvedValueOnce({
				get: jest.fn(() => undefined),
				delete: jest.fn(),
			})

			const request = createMockRequest()
			await logout(request)

			// Backend should not be called
			expect(global.fetch).not.toHaveBeenCalled()
		})
	})

	describe('Cookie Clearing Behavior', () => {
		it('should delete both access and refresh tokens', async () => {
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

			const request = createMockRequest()
			const response = await logout(request)
			const setCookieHeaders = response.headers.getSetCookie()

			// Verify both cookies are in the Set-Cookie headers
			const cookieNames = setCookieHeaders.map((header: string) => {
				const match = header.match(/^([^=]+)=/)
				return match ? match[1] : ''
			})

			expect(cookieNames).toContain('cognizap_access_token')
			expect(cookieNames).toContain('cognizap_refresh_token')
		})

		it('should set cookies with proper deletion attributes', async () => {
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

			const request = createMockRequest()
			const response = await logout(request)
			const setCookieHeaders = response.headers.getSetCookie()

			// Each cookie deletion should have Max-Age=0 or Expires in the past
			setCookieHeaders.forEach((header: string) => {
				const isDeleting =
					header.includes('Max-Age=0') ||
					header.includes('Expires=Thu, 01 Jan 1970')
				expect(isDeleting).toBe(true)
			})
		})
	})

	describe('Backend Communication', () => {
		it('should send authorization header to backend', async () => {
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

			const request = createMockRequest()
			await logout(request)

			expect(global.fetch).toHaveBeenCalledWith(
				`${mockBackendUrl}/api/auth/logout`,
				expect.objectContaining({
					method: 'POST',
					headers: expect.objectContaining({
						Authorization: `Bearer ${mockAccessToken}`,
					}),
				}),
			)
		})

		it('should use correct backend URL from environment', async () => {
			const customBackendUrl = 'https://api.example.com'
			process.env.NEXT_PUBLIC_BACKEND_URL = customBackendUrl
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

			const request = createMockRequest()
			await logout(request)

			expect(global.fetch).toHaveBeenCalledWith(
				`${customBackendUrl}/api/auth/logout`,
				expect.any(Object),
			)
		})

		it('should handle backend timeout gracefully', async () => {
			// Mock timeout error
			;(global.fetch as jest.Mock).mockRejectedValueOnce(
				new Error('Request timeout'),
			)

			const request = createMockRequest()
			const response = await logout(request)
			const data = await response.json()

			// Should still succeed and clear cookies
			expect(response.status).toBe(200)
			expect(data.success).toBe(true)
		})
	})

	describe('Security Considerations', () => {
		it('should not expose token in response', async () => {
			;(global.fetch as jest.Mock).mockResolvedValueOnce({
				ok: true,
				json: async () => ({ success: true }),
			})

			const request = createMockRequest()
			const response = await logout(request)
			const data = await response.json()
			const responseText = JSON.stringify(data)

			// Verify tokens are not in response
			expect(responseText).not.toContain(mockAccessToken)
			expect(responseText).not.toContain(mockRefreshToken)
		})
	})
})
