/**
 * CognizApp Provider MCP endpoint — publicly reachable Streamable HTTP MCP
 * server, hosted inside the already-deployed provider Next.js app.
 *
 * This is what makes `https://provider.cognizapp.com/api/mcp` usable as:
 *   - A Windsurf "Server URL" connector (Authentication: Open)
 *   - An OpenAI / ChatGPT custom connector (Authentication: No Auth)
 *
 * The passkey used to authenticate against the backend lives ONLY in this
 * server's environment (COGNIZAPP_MCP_PASSKEY). Connecting clients send no
 * auth of their own — that's what "Open" / "No Auth" means here.
 *
 * Runs in stateless mode: a fresh McpServer + transport is created per
 * request, which is the correct pattern for serverless (Vercel) deployments
 * where no two requests are guaranteed to hit the same instance.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'

import { registerAiTools } from '../../../mcp-server/src/tools/ai.js'
import { registerAuthTools } from '../../../mcp-server/src/tools/auth.js'
import { registerClientTools } from '../../../mcp-server/src/tools/clients.js'
import { registerDashboardTools } from '../../../mcp-server/src/tools/dashboard.js'
import { registerDeliveryTools } from '../../../mcp-server/src/tools/delivery.js'
import { registerDiscountCodeTools } from '../../../mcp-server/src/tools/discount-codes.js'
import { registerFileTools } from '../../../mcp-server/src/tools/files.js'
import { registerMessageTools } from '../../../mcp-server/src/tools/messages.js'
import { registerMilestoneTools } from '../../../mcp-server/src/tools/milestones.js'
import { registerOrderTools } from '../../../mcp-server/src/tools/orders.js'
import { registerPaymentTools } from '../../../mcp-server/src/tools/payments.js'
import { registerQuoteTools } from '../../../mcp-server/src/tools/quotes.js'
import { registerRequestTools } from '../../../mcp-server/src/tools/requests.js'
import { registerSettingsTools } from '../../../mcp-server/src/tools/settings.js'
import { registerWorkflowTools } from '../../../mcp-server/src/tools/workflows.js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const SERVER_NAME = 'cognizapp-provider-mcp'
const SERVER_VERSION = '1.2.0'

function createServer(): McpServer {
	const server = new McpServer(
		{ name: SERVER_NAME, version: SERVER_VERSION },
		{ capabilities: { tools: {} } },
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

	return server
}

const CORS_HEADERS: Record<string, string> = {
	'access-control-allow-origin': '*',
	'access-control-allow-methods': 'POST, GET, DELETE, OPTIONS',
	'access-control-allow-headers': 'content-type, mcp-session-id, accept, mcp-protocol-version',
}

function withCors(response: Response): Response {
	for (const [key, value] of Object.entries(CORS_HEADERS)) {
		response.headers.set(key, value)
	}
	return response
}

/** Stateless MCP request handler — a fresh server/transport per request. */
async function handle(request: Request): Promise<Response> {
	const server = createServer()
	const transport = new WebStandardStreamableHTTPServerTransport({
		// Stateless mode: no session ID generation/validation. Each HTTP
		// request is handled independently — required for serverless.
		sessionIdGenerator: undefined,
		enableJsonResponse: true,
	})

	await server.connect(transport)
	const response = await transport.handleRequest(request)
	return withCors(response)
}

export async function GET(request: Request): Promise<Response> {
	return handle(request)
}

export async function POST(request: Request): Promise<Response> {
	return handle(request)
}

export async function DELETE(request: Request): Promise<Response> {
	return handle(request)
}

export async function OPTIONS(): Promise<Response> {
	return withCors(new Response(null, { status: 204 }))
}
