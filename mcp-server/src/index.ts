#!/usr/bin/env node

/**
 * CognizApp Provider MCP Server
 *
 * Enables AI to act as a CognizApp provider — managing the full support
 * desk lifecycle: dashboard, requests, messages, milestones, files,
 * payments, delivery, quotes, orders, clients, referrals, discount codes,
 * provider settings, AI document analysis, and composite workflow tools.
 *
 * Auth: Single static passkey via COGNIZAPP_MCP_PASSKEY env var.
 * No JWT tokens needed. The passkey is sent via the X-MCP-Passkey header
 * to the provider frontend, which proxies to the backend.
 *
 * Transport:
 *   - stdio (default) — for local MCP clients launched as a child process
 *   - http  (MCP_TRANSPORT=http) — Streamable HTTP server for Windsurf UI
 *     installation via "Server URL" with "Open" authentication. The passkey
 *     lives in the server's env; Windsurf itself sends no auth headers.
 *
 * Tool surface: ~48 tools across 15 domains. See README.md for the full list.
 */

import http from 'node:http'
import { randomUUID } from 'node:crypto'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import { registerAiTools } from './tools/ai.js'
import { registerAuthTools } from './tools/auth.js'
import { registerClientTools } from './tools/clients.js'
import { registerDashboardTools } from './tools/dashboard.js'
import { registerDeliveryTools } from './tools/delivery.js'
import { registerDiscountCodeTools } from './tools/discount-codes.js'
import { registerFileTools } from './tools/files.js'
import { registerMessageTools } from './tools/messages.js'
import { registerMilestoneTools } from './tools/milestones.js'
import { registerOrderTools } from './tools/orders.js'
import { registerPaymentTools } from './tools/payments.js'
import { registerQuoteTools } from './tools/quotes.js'
import { registerRequestTools } from './tools/requests.js'
import { registerSettingsTools } from './tools/settings.js'
import { registerWorkflowTools } from './tools/workflows.js'
import { apiDownloadBinary, apiFormUpload } from './api-client.js'
import { buildDeliveryFormData } from './tools/delivery.js'
import {
	PROVIDER_SERVER_INSTRUCTIONS,
	registerProviderPrompts,
	registerProviderEnhancementTools,
	type EnhancementDeps,
} from './enhancements/index.js'
import { blobFromBase64 } from './utils.js'

const SERVER_NAME = 'cognizapp-provider-mcp'
const SERVER_VERSION = '1.3.0'

/**
 * Build the enhancement dependency adapter from the existing standalone API
 * client functions. Auth/refresh logic stays inside api-client.ts; these are
 * thin wrappers that normalize the shapes the enhancement handlers expect.
 */
function createEnhancementDeps(): EnhancementDeps {
	return {
		downloadFile: async (fileId) => {
			const r = await apiDownloadBinary(`/api/files/${fileId}/download`)
			return {
				fileId,
				filename: r.filename || fileId,
				contentType: r.contentType,
				size: r.buffer.length,
				contentBase64: r.buffer.toString('base64'),
			}
		},
		uploadFile: async (input) => {
			// Same upload contract as provider_upload_file.
			const formData = new FormData()
			formData.append('requestId', input.requestId)
			if (input.milestoneId) formData.append('milestoneId', input.milestoneId)
			formData.append('purpose', input.purpose || 'request_attachment')
			const blob = blobFromBase64(input.contentBase64, 'contentBase64', input.contentType)
			formData.append('files', blob, input.fileName)
			return apiFormUpload('/api/files/upload', formData)
		},
		deliverFinalWork: async (input) => {
			const formData = buildDeliveryFormData(input)
			return apiFormUpload(`/api/provider/requests/${input.requestId}/deliver`, formData)
		},
	}
}

/** Factory: create a fresh McpServer with all tools registered. */
function createServer(): McpServer {
	const server = new McpServer(
		{ name: SERVER_NAME, version: SERVER_VERSION },
		{
			capabilities: { tools: {}, prompts: {} },
			instructions: PROVIDER_SERVER_INSTRUCTIONS,
		},
	)

	registerDashboardTools(server)
	registerRequestTools(server)
	registerMessageTools(server)
	registerMilestoneTools(server)
	registerFileTools(server)
	registerPaymentTools(server)
	registerDeliveryTools(server)
	registerQuoteTools(server)
	registerOrderTools(server)
	registerClientTools(server)
	registerDiscountCodeTools(server)
	registerSettingsTools(server)
	registerAiTools(server)
	registerWorkflowTools(server)
	registerAuthTools(server)

	// Image-safe provider enhancement tools + prompts.
	registerProviderPrompts(server)
	registerProviderEnhancementTools(server, createEnhancementDeps())

	return server
}

// ─── stdio transport ─────────────────────────────────────────────────────────

async function startStdio(): Promise<void> {
	const server = createServer()
	const transport = new StdioServerTransport()
	await server.connect(transport)
}

// ─── Streamable HTTP transport ───────────────────────────────────────────────

interface Session {
	transport: StreamableHTTPServerTransport
	server: McpServer
}

async function startHttp(): Promise<void> {
	const port = parseInt(process.env.MCP_PORT || '8787', 10)
	const host = process.env.MCP_HOST || '127.0.0.1'
	const endpoint = process.env.MCP_ENDPOINT || '/mcp'
	const sessions = new Map<string, Session>()

	const httpServer = http.createServer(async (req, res) => {
		const url = new URL(req.url || '', `http://${req.headers.host}`)

		if (url.pathname !== endpoint) {
			res.writeHead(404, { 'content-type': 'text/plain' })
			res.end('Not found. Use POST/GET ' + endpoint)
			return
		}

		// CORS — allow Windsurf and other local clients
		res.setHeader('access-control-allow-origin', '*')
		res.setHeader('access-control-allow-methods', 'POST, GET, DELETE, OPTIONS')
		res.setHeader('access-control-allow-headers', 'content-type, mcp-session-id, accept')

		if (req.method === 'OPTIONS') {
			res.writeHead(204)
			res.end()
			return
		}

		const sessionId = req.headers['mcp-session-id'] as string | undefined

		try {
			if (req.method === 'POST') {
				// Read body
				const chunks: Buffer[] = []
				for await (const chunk of req) chunks.push(chunk as Buffer)
				const body = Buffer.concat(chunks).toString('utf-8')
				let parsedBody: unknown
				try {
					parsedBody = JSON.parse(body)
				} catch {
					res.writeHead(400, { 'content-type': 'text/plain' })
					res.end('Invalid JSON body')
					return
				}

				// Detect initialize request (no session ID yet)
				const isInitialize =
					!sessionId &&
						Array.isArray(parsedBody)
						? parsedBody.some(
							(m: any) => m.method === 'initialize',
						)
						: (parsedBody as any)?.method === 'initialize'

				if (isInitialize) {
					// Create new session
					const transport = new StreamableHTTPServerTransport({
						sessionIdGenerator: () => randomUUID(),
					})
					const server = createServer()

					transport.onclose = () => {
						if (transport.sessionId) {
							sessions.delete(transport.sessionId)
						}
					}

					await server.connect(transport)
					await transport.handleRequest(req, res, parsedBody)

					if (transport.sessionId) {
						sessions.set(transport.sessionId, { transport, server })
						console.error(`[mcp] session established: ${transport.sessionId}`)
					}
				} else if (sessionId && sessions.has(sessionId)) {
					// Existing session — route to its transport
					await sessions.get(sessionId)!.transport.handleRequest(req, res, parsedBody)
				} else {
					res.writeHead(400, { 'content-type': 'text/plain' })
					res.end('No valid session. Send an initialize request first.')
				}
			} else if (req.method === 'GET') {
				// SSE stream for server-to-client notifications
				if (sessionId && sessions.has(sessionId)) {
					await sessions.get(sessionId)!.transport.handleRequest(req, res)
				} else {
					res.writeHead(400, { 'content-type': 'text/plain' })
					res.end('No valid session. Initialize first via POST.')
				}
			} else if (req.method === 'DELETE') {
				// Close session
				if (sessionId && sessions.has(sessionId)) {
					const session = sessions.get(sessionId)!
					await session.transport.handleRequest(req, res)
					sessions.delete(sessionId)
					console.error(`[mcp] session closed: ${sessionId}`)
				} else {
					res.writeHead(404, { 'content-type': 'text/plain' })
					res.end('Session not found')
				}
			} else {
				res.writeHead(405, { 'content-type': 'text/plain' })
				res.end('Method not allowed')
			}
		} catch (err) {
			console.error('[mcp] request error:', err)
			if (!res.headersSent) {
				res.writeHead(500, { 'content-type': 'text/plain' })
				res.end('Internal server error')
			}
		}
	})

	httpServer.listen(port, host, () => {
		console.error(`[mcp] ${SERVER_NAME} v${SERVER_VERSION} listening on http://${host}:${port}${endpoint}`)
		console.error('[mcp] Windsurf Server URL: http://%s:%d%s', host, port, endpoint)
		console.error('[mcp] Authentication: Open (passkey is held in server env)')
	})

	// Graceful shutdown
	const shutdown = () => {
		console.error('[mcp] shutting down...')
		for (const [, session] of sessions) {
			session.transport.close().catch(() => { })
		}
		httpServer.close(() => process.exit(0))
	}
	process.on('SIGINT', shutdown)
	process.on('SIGTERM', shutdown)
}

// ─── Start Server ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
	const transport = (process.env.MCP_TRANSPORT || 'stdio').toLowerCase()

	if (transport === 'http' || transport === 'streamable-http') {
		await startHttp()
	} else {
		await startStdio()
	}
}

main().catch((error) => {
	console.error('Fatal error:', error)
	process.exit(1)
})
