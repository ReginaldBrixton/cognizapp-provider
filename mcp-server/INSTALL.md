# CognizApp Provider MCP Server — Installation Guide

A complete guide to install, configure, and run the CognizApp Provider MCP Server.
This MCP server exposes 27 tools that let AI assistants (Claude, Windsurf Cascade,
Cursor, etc.) manage the CognizApp provider support system — dashboard, requests,
messages, milestones, files, payments, delivery, and auth.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start (5 Minutes)](#2-quick-start-5-minutes)
3. [Detailed Installation](#3-detailed-installation)
4. [Configuration Reference](#4-configuration-reference)
5. [Client Setup](#5-client-setup)
   - [Windsurf / Cascade](#windsurf--cascade)
   - [Claude Desktop](#claude-desktop)
   - [Cursor](#cursor)
   - [VS Code (Continue.dev)](#vs-code-continuedev)
   - [Generic MCP Client](#generic-mcp-client)
6. [Getting Your Auth Tokens](#6-getting-your-auth-tokens)
7. [Verifying the Installation](#7-verifying-the-installation)
8. [Tool Reference](#8-tool-reference)
9. [Troubleshooting](#9-troubleshooting)
10. [Architecture & Development](#10-architecture--development)

---

## 1. Prerequisites

| Requirement | Minimum Version | Check Command |
|---|---|---|
| **Node.js** | 18.18+ (20 LTS recommended) | `node --version` |
| **npm** | 9+ (bundled with Node) | `npm --version` |
| **TypeScript** | 5.7+ (installed automatically) | — |
| **CognizApp Backend API** | Running and accessible | `curl <BACKEND_URL>/health` |

You do **not** need Bun, Docker, or a database — the MCP server is a standalone
Node.js process that talks to the backend API over HTTP.

### Supported Backends

| Environment | URL | Notes |
|---|---|---|
| Local dev | `http://localhost:4040` | Run `bun run src/server.ts` in the backend repo |
| Production | `https://api.cognizapp.com` | Requires real JWT tokens (test bypass won't work) |

---

## 2. Quick Start (5 Minutes)

```bash
# 1. Clone the provider repo (if you haven't already)
git clone https://github.com/ReginaldBrixton/cognizapp-provider.git
cd cognizapp-provider/mcp-server

# 2. Install dependencies and build
npm install && npm run build

# 3. Verify it starts
COGNIZAPP_ACCESS_TOKEN=your_token_here npm start
# You should see: "CognizApp Provider MCP Server running on stdio"
# Press Ctrl+C to stop

# 4. Add to your MCP client config (see Section 5)
```

---

## 3. Detailed Installation

### Step 1: Clone the Repository

```bash
git clone https://github.com/ReginaldBrixton/cognizapp-provider.git
cd cognizapp-provider/mcp-server
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs:
- `@modelcontextprotocol/sdk` — the MCP protocol library
- `typescript` — compiler (dev dependency)
- `@types/node` — Node.js type definitions (dev dependency)

### Step 3: Build the TypeScript Source

```bash
npm run build
```

This runs `tsc` and compiles `src/*.ts` → `dist/*.js`. The output is plain
JavaScript (ES2022 modules) that Node.js can run directly.

Verify the build succeeded:

```bash
ls dist/
# Should show: index.js, index.d.ts, api-client.js, api-client.d.ts
```

### Step 4: Get Your Auth Tokens

You need a CognizApp provider JWT access token. See [Section 6](#6-getting-your-auth-tokens)
for instructions on how to obtain one.

### Step 5: Configure Your MCP Client

Add the server to your MCP client's configuration file. See [Section 5](#5-client-setup)
for client-specific instructions.

---

## 4. Configuration Reference

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `COGNIZAPP_ACCESS_TOKEN` | **Yes** | — | JWT access token for a provider account |
| `COGNIZAPP_REFRESH_TOKEN` | No | — | JWT refresh token for auto-renewal on 401 |
| `COGNIZAPP_BACKEND_URL` | No | `http://localhost:4040` | Backend API base URL |

### Token Requirements

The access token must belong to a user with one of:
- `SUPPORT_PROVIDER_USER` role, OR
- `ADMIN_USER` role, OR
- The `support.tickets.respond` permission

Without the correct role/permissions, provider tools will return
`"Insufficient permissions"` errors.

### Token Refresh

If you provide a `COGNIZAPP_REFRESH_TOKEN`, the server automatically refreshes
the access token when the backend returns a 401. The new tokens are used for
all subsequent requests. You can also update tokens at runtime using the
`provider_set_auth_token` tool.

---

## 5. Client Setup

### Windsurf / Cascade

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "cognizapp-provider": {
      "command": "node",
      "args": ["/absolute/path/to/cognizapp-provider/mcp-server/dist/index.js"],
      "disabled": false,
      "env": {
        "COGNIZAPP_BACKEND_URL": "http://localhost:4040",
        "COGNIZAPP_ACCESS_TOKEN": "your_jwt_access_token",
        "COGNIZAPP_REFRESH_TOKEN": "your_jwt_refresh_token"
      }
    }
  }
}
```

Restart Windsurf after saving. The server appears in **Settings → MCP Servers**.

### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS)
or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "cognizapp-provider": {
      "command": "node",
      "args": ["/absolute/path/to/cognizapp-provider/mcp-server/dist/index.js"],
      "env": {
        "COGNIZAPP_BACKEND_URL": "https://api.cognizapp.com",
        "COGNIZAPP_ACCESS_TOKEN": "your_jwt_access_token",
        "COGNIZAPP_REFRESH_TOKEN": "your_jwt_refresh_token"
      }
    }
  }
}
```

Restart Claude Desktop. Tools will appear as `mcp__cognizapp-provider__*`.

### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cognizapp-provider": {
      "command": "node",
      "args": ["/absolute/path/to/cognizapp-provider/mcp-server/dist/index.js"],
      "env": {
        "COGNIZAPP_BACKEND_URL": "https://api.cognizapp.com",
        "COGNIZAPP_ACCESS_TOKEN": "your_jwt_access_token",
        "COGNIZAPP_REFRESH_TOKEN": "your_jwt_refresh_token"
      }
    }
  }
}
```

### VS Code (Continue.dev)

Add to `~/.continue/config.json` under `experimental.mcpServers`:

```json
{
  "experimental": {
    "mcpServers": {
      "cognizapp-provider": {
        "command": "node",
        "args": ["/absolute/path/to/cognizapp-provider/mcp-server/dist/index.js"],
        "env": {
          "COGNIZAPP_BACKEND_URL": "https://api.cognizapp.com",
          "COGNIZAPP_ACCESS_TOKEN": "your_jwt_access_token"
        }
      }
    }
  }
}
```

### Generic MCP Client

The server uses **stdio transport**. Start it with:

```bash
node /path/to/mcp-server/dist/index.js
```

It reads JSON-RPC messages from stdin and writes responses to stdout.
Logs go to stderr. The server implements the MCP protocol version `2024-11-05`.

---

## 6. Getting Your Auth Tokens

### Option A: From the Provider Portal (Production)

1. Log in to `https://provider.cognizapp.com`
2. Open browser DevTools → Application → Local Storage
3. Find `cognizapp_access_token` and `cognizapp_refresh_token`
4. Copy both values into your MCP config

### Option B: From the API Directly

```bash
# Exchange Firebase token for CognizApp JWT
curl -X POST https://api.cognizapp.com/api/auth/firebase-exchange \
  -H "Content-Type: application/json" \
  -d '{"firebaseToken": "your_firebase_id_token"}'
```

Response:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "refreshToken": "eyJhbGci..."
  }
}
```

### Option C: Dev/Test Bypass Token (Local Development Only)

For local testing, the backend supports a test bypass token when
`TEST_AUTH_BYPASS_ENABLED=true` and `TEST_AUTH_BYPASS_EMAIL` is set in the
backend's `.env`:

```json
{
  "COGNIZAPP_ACCESS_TOKEN": "cognizap_test_bypass_token_sAmb0RYDpPcJSkpm4NJB"
}
```

> **Warning:** The test bypass token is **blocked in production**. It only works
> against a local or staging backend with the bypass enabled. Never use it in
> a production MCP configuration.

---

## 7. Verifying the Installation

### Method 1: Using the MCP Inspector

```bash
cd cognizapp-provider/mcp-server
COGNIZAPP_ACCESS_TOKEN=your_token npm run inspector
```

This opens the MCP Inspector UI in your browser where you can:
- See all 27 tools and their schemas
- Call tools interactively
- View raw JSON-RPC traffic

### Method 2: Manual JSON-RPC Test

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}
{"jsonrpc":"2.0","method":"notifications/initialized"}
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | \
COGNIZAPP_ACCESS_TOKEN=your_token \
COGNIZAPP_BACKEND_URL=http://localhost:4040 \
node dist/index.js
```

You should see JSON responses with the server info and tool list.

### Method 3: Check Auth

Once configured in your client, ask the AI to call:

```
Use the provider_check_auth tool to verify authentication.
```

Expected response:
```json
{
  "authenticated": true,
  "hasToken": true
}
```

### Method 4: Test Dashboard Stats

```
Use provider_get_dashboard_stats to show me the provider dashboard.
```

If you see stats (totalRequests, openRequests, etc.), everything works.

---

## 8. Tool Reference

All 27 tools are listed below grouped by category. See the [README.md](README.md)
for full parameter details.

### Dashboard (3 tools)
| Tool | Description | Key Params |
|---|---|---|
| `provider_get_dashboard_stats` | Provider dashboard statistics | — |
| `provider_get_upcoming_deadlines` | Upcoming deadline list | `limit?` |
| `provider_get_recent_activity` | Recent activity feed | `limit?` |

### Requests (2 tools)
| Tool | Description | Key Params |
|---|---|---|
| `provider_list_requests` | List requests with filters | `status?`, `paymentStatus?`, `priority?` |
| `provider_get_request` | Get single request details | `requestId` |

### Messages (6 tools)
| Tool | Description | Key Params |
|---|---|---|
| `provider_list_threads` | List message threads | — |
| `provider_get_thread_messages` | Get messages in a thread | `threadId` |
| `provider_send_message` | Send a chat message | `threadId`, `content` |
| `provider_edit_message` | Edit a message | `threadId`, `messageId`, `content` |
| `provider_delete_message` | Delete a message | `threadId`, `messageId` |
| `provider_create_thread` | Create a thread for a request | `requestId` |

### Milestones (6 tools)
| Tool | Description | Key Params |
|---|---|---|
| `provider_list_milestones` | List milestones for a request | `requestId` |
| `provider_get_milestone` | Get milestone details | `requestId`, `milestoneId` |
| `provider_create_milestone` | Create a milestone | `requestId`, `title`, `dueAt?` |
| `provider_update_milestone_status` | Update milestone status | `requestId`, `milestoneId`, `status` |
| `provider_send_milestone_card` | Send milestone card to chat | `requestId`, `milestoneId`, `status?` |
| `provider_get_milestone_history` | Get milestone version history | `requestId`, `milestoneId` |

### Files (3 tools)
| Tool | Description | Key Params |
|---|---|---|
| `provider_upload_file` | Upload a file (base64) | `requestId`, `fileName`, `fileContentBase64` |
| `provider_download_file` | Download a file (returns base64) | `fileId` |
| `provider_delete_file` | Delete a file | `fileId` |

### Payments (2 tools)
| Tool | Description | Key Params |
|---|---|---|
| `provider_discount_decision` | Approve/reject discount | `requestId`, `status`, `discountPercent?` |
| `provider_override_payment_policy` | Override payment policy | `requestId`, `depositPercent`, `previewUnlock`, `workStartRequirement`, `editableDocumentRequired`, `reason` (min 8 chars) |

### Delivery (1 tool)
| Tool | Description | Key Params |
|---|---|---|
| `provider_deliver_final_work` | Upload final delivery | `requestId`, `pdfFileName`, `pdfContentBase64`, `docxFileName`, `docxContentBase64`, `previewImages[]` |

### Preview (1 tool)
| Tool | Description | Key Params |
|---|---|---|
| `provider_retry_preview` | Retry failed preview generation | `requestId` |

### Cards (1 tool)
| Tool | Description | Key Params |
|---|---|---|
| `provider_send_request_card` | Send structured card | `requestId`, `kind` (`payment_card` / `revision_card` / `delivery_card`) |

### Auth (2 tools)
| Tool | Description | Key Params |
|---|---|---|
| `provider_set_auth_token` | Update tokens at runtime | `accessToken`, `refreshToken?` |
| `provider_check_auth` | Check if token is valid | — |

---

## 9. Troubleshooting

### "Missing or invalid Authorization header"

The backend can't find your token. Check:
- `COGNIZAPP_ACCESS_TOKEN` is set in the env block of your MCP config
- The token value doesn't have extra quotes or whitespace
- The env block is properly nested under the server entry

### "Access token is invalid or expired"

Your JWT has expired. Either:
- Set `COGNIZAPP_REFRESH_TOKEN` so the server auto-refreshes on 401
- Get a new token (see [Section 6](#6-getting-your-auth-tokens))
- Use `provider_set_auth_token` to update the token at runtime

### "Insufficient permissions"

Your user account doesn't have provider access. The user needs one of:
- `SUPPORT_PROVIDER_USER` role
- `ADMIN_USER` role
- The `support.tickets.respond` permission

Contact an admin to upgrade your account, or use the provider portal to log in
with a provider account.

### "Cannot connect to backend" / Connection refused

The backend isn't running or the URL is wrong:
- Verify `COGNIZAPP_BACKEND_URL` is correct
- For local dev: start the backend with `bun run src/server.ts` (port 4040)
- For production: use `https://api.cognizapp.com`
- Test: `curl <BACKEND_URL>/health` should return `{"status":"ok"}`

### "fileContentBase64 is not valid base64 data"

The base64 string you passed to `provider_upload_file` or
`provider_deliver_final_work` is malformed. Ensure:
- The string is pure base64 (no `data:` URI prefix, though that is accepted)
- The string length is a multiple of 4
- The string only contains `A-Za-z0-9+/` and optional `=` padding

### "reason must be at least 8 characters long"

The `provider_override_payment_policy` tool requires a `reason` field with at
least 8 characters. This is a backend validation requirement for audit logging.

### Server doesn't appear in my client

- Restart your MCP client after editing the config file
- Check the config file path is correct for your client (see [Section 5](#5-client-setup))
- Check the `args` path is an **absolute** path to `dist/index.js`
- Check Node.js is installed and on your PATH: `node --version`

### Build fails with TypeScript errors

```bash
cd cognizapp-provider/mcp-server
rm -rf node_modules dist
npm install
npm run build
```

If errors persist, check your Node.js version (must be 18.18+):

```bash
node --version
# Should be v18.18.0 or higher
```

### Tools work but return empty results

This is normal if there's no data. For example, `provider_list_milestones`
returns `[]` if the request has no milestones. Try `provider_get_dashboard_stats`
first — if it returns zeros, the connection works but there's just no data yet.

---

## 10. Architecture & Development

### File Structure

```
mcp-server/
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config (ES2022, Node16 modules)
├── README.md             # Quick reference
├── INSTALL.md            # This file
├── .gitignore            # Ignores node_modules/ and dist/
└── src/
    ├── index.ts          # MCP server + 27 tool definitions + handlers
    └── api-client.ts     # Backend HTTP client with auth & auto-refresh
```

### How It Works

```
┌──────────────┐     stdio (JSON-RPC)     ┌─────────────────┐     HTTP/HTTPS     ┌──────────────────┐
│  MCP Client  │ ◄──────────────────────► │   MCP Server    │ ◄────────────────► │  CognizApp API   │
│  (Claude,    │                          │  (Node.js)      │                    │  (Elysia/Bun)    │
│   Windsurf,  │                          │                 │                    │                  │
│   Cursor)    │                          │  27 tool        │                    │  /api/support/   │
│              │                          │  handlers       │                    │  /api/support-   │
│              │                          │  + auth refresh │                    │    inbox/        │
└──────────────┘                          └─────────────────┘                    └──────────────────┘
```

1. The MCP client sends a `tools/call` JSON-RPC message over stdio
2. The server dispatches to the appropriate handler in `index.ts`
3. The handler calls the backend API via `api-client.ts`
4. The backend validates permissions, processes the request, and returns JSON
5. The server unwraps the response and returns it to the client

### API Client

The `api-client.ts` module handles:
- **Authentication:** Sends `Authorization: Bearer <token>` on every request
- **Auto-refresh:** On 401, calls `/api/auth/refresh` with the refresh token,
  then retries the original request with the new token
- **Response unwrapping:** The backend wraps responses in `{ success, data, message }`.
  The client unwraps to just `data`.
- **Binary downloads:** Uses `apiDownloadBinary()` for file downloads, which
  preserves raw bytes via `response.arrayBuffer()` (avoids text corruption)
- **Error handling:** Throws `Error` with the backend's error message and path

### Development Scripts

| Script | Command | Description |
|---|---|---|
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run the built server |
| `dev` | `tsc && node dist/index.js` | Build and run in one step |
| `inspector` | `npx @modelcontextprotocol/inspector dist/index.js` | Launch MCP Inspector UI |

### Building from Source

```bash
git clone https://github.com/ReginaldBrixton/cognizapp-provider.git
cd cognizapp-provider/mcp-server
npm install
npm run build
```

### Running Tests

The MCP server doesn't have its own test suite. To verify it works end-to-end:

1. Start the backend: `cd cognizapp-backend-api && bun run src/server.ts`
2. Start the MCP Inspector: `npm run inspector`
3. Call `provider_check_auth` and `provider_get_dashboard_stats` in the inspector

---

## License

Proprietary. See the repository for license details.
