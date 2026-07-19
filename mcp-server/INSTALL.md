# CognizApp Provider MCP Server — Installation Guide

A complete guide to install, configure, and run the CognizApp Provider MCP Server.
This MCP server exposes 47 tools that let AI assistants (Claude, Windsurf Cascade,
Cursor, etc.) act as a CognizApp provider — managing the full support-desk
lifecycle: dashboard, requests, messages, milestones, files, payments, delivery,
quotes, orders, clients, referrals, discount codes, provider settings, AI
document analysis, and composite workflow tools.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start (3 Minutes)](#2-quick-start-3-minutes)
3. [Configuration](#3-configuration)
4. [Client Setup](#4-client-setup)
   - [Windsurf / Cascade](#windsurf--cascade)
   - [Claude Desktop](#claude-desktop)
   - [Cursor](#cursor)
   - [VS Code (Continue.dev)](#vs-code-continuedev)
   - [Generic MCP Client](#generic-mcp-client)
5. [Your Passkey](#5-your-passkey)
6. [Verifying the Installation](#6-verifying-the-installation)
7. [Tool Reference](#7-tool-reference)
8. [Troubleshooting](#8-troubleshooting)
9. [Architecture](#9-architecture)

---

## 1. Prerequisites

| Requirement | Minimum Version | Check Command |
|---|---|---|
| **Node.js** | 18.18+ (20 LTS recommended) | `node --version` |
| **npm** | 9+ (bundled with Node) | `npm --version` |
| **CognizApp Provider frontend** | Running and accessible | `curl <PROVIDER_URL>/api/auth/health` |

### Supported Backends

| Environment | URL | Notes |
|---|---|---|
| Local dev | `http://localhost:3001` | Run `bun dev` in the provider repo (port 3001). Backend must also be running for the provider proxy. |
| Production | `https://provider.cognizapp.com` | Passkey works in production |

---

## 2. Quick Start (3 Minutes)

```bash
# 1. Clone and build
git clone https://github.com/ReginaldBrixton/cognizapp-provider.git
cd cognizapp-provider/mcp-server
npm install && npm run build

# 2a. Test stdio mode
COGNIZAPP_MCP_PASSKEY=your_passkey npm start
# Should see no errors; Ctrl+C to stop

# 2b. Test HTTP mode (for Windsurf UI installation)
COGNIZAPP_MCP_PASSKEY=your_passkey \
COGNIZAPP_PROVIDER_URL=https://provider.cognizapp.com \
MCP_TRANSPORT=http \
node dist/index.js
# Should see: "[mcp] cognizapp-provider-mcp v1.2.0 listening on http://127.0.0.1:8787/mcp"

# 3. Add to your MCP client (see Section 4)
```

---

## 3. Configuration

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `COGNIZAPP_MCP_PASSKEY` | **Yes** | — | Static passkey for authentication (never expires) |
| `COGNIZAPP_PROVIDER_URL` | No | `http://localhost:3001` | Provider frontend base URL |
| `MCP_TRANSPORT` | No | `stdio` | Transport mode: `stdio` or `http` |
| `MCP_PORT` | No | `8787` | HTTP server port (when `MCP_TRANSPORT=http`) |
| `MCP_HOST` | No | `127.0.0.1` | HTTP server bind address |
| `MCP_ENDPOINT` | No | `/mcp` | HTTP endpoint path |

That's it. One passkey. No JWT tokens, no refresh tokens, no email.

### How the Passkey Works

The passkey is a static string sent via the `X-MCP-Passkey` HTTP header on every
request to the backend. The backend's auth middleware checks the passkey against
the `MCP_PROVIDER_PASSKEY` environment variable (set on the backend side). If it
matches, the request is authenticated as the `cognizapp@gmail.com` provider
account with `SUPPORT_PROVIDER_USER` role.

The passkey:
- **Never expires** — no token refresh needed
- **Works in production** — unlike the old test bypass token
- **Is account-agnostic** — you don't need to know any user's email or password
- **Uses constant-time comparison** — immune to timing attacks

---

## 4. Client Setup

### Windsurf / Cascade

Windsurf supports two installation methods:

#### Method A — UI with Server URL + Open Auth (recommended)

This uses the HTTP transport so Windsurf connects via a Server URL with **Open**
authentication. The passkey lives in the server's environment — Windsurf sends
no auth headers.

**Step 1 — Start the MCP HTTP server:**

```bash
cd cognizapp-provider/mcp-server
export COGNIZAPP_MCP_PASSKEY=mcp_pk_cdf27611295b4ae9bd97affd597c0b1c498a212e7940b36daae46c3619fa5256
export COGNIZAPP_PROVIDER_URL=https://provider.cognizapp.com   # or http://localhost:3001 for local dev
export MCP_TRANSPORT=http
node dist/index.js
```

Expected output:
```
[mcp] cognizapp-provider-mcp v1.2.0 listening on http://127.0.0.1:8787/mcp
[mcp] Windsurf Server URL: http://127.0.0.1:8787/mcp
[mcp] Authentication: Open (passkey is held in server env)
```

**Step 2 — Add to Windsurf UI:**

Open Windsurf → Settings → MCP Servers → **Add Server**, and fill in:

| Field | Value |
|---|---|
| **MCP Name** | `CognizApp Provider` |
| **Description** | AI agent tools for managing the CognizApp provider support desk — dashboard, requests, messages, milestones, files, payments, quotes, orders, clients, referrals, discount codes, settings, AI document analysis, and workflow orchestration. |
| **Connection** | `http://127.0.0.1:8787/mcp` |
| **Authentication** | `Open` |

Click **Add**. Windsurf connects immediately — no restart needed.

**Step 3 — Verify:**

Ask Cascade: "Use `provider_check_auth` to verify authentication."
Expected: `{ "authenticated": true, "hasPasskey": true }`

#### Method B — stdio config (traditional)

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "cognizapp-provider": {
      "command": "node",
      "args": ["/absolute/path/to/cognizapp-provider/mcp-server/dist/index.js"],
      "disabled": false,
      "env": {
        "COGNIZAPP_PROVIDER_URL": "https://provider.cognizapp.com",
        "COGNIZAPP_MCP_PASSKEY": "your_passkey_here"
      }
    }
  }
}
```

Restart Windsurf after saving.

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
        "COGNIZAPP_PROVIDER_URL": "https://provider.cognizapp.com",
        "COGNIZAPP_MCP_PASSKEY": "your_passkey_here"
      }
    }
  }
}
```

### Cursor

Edit `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "cognizapp-provider": {
      "command": "node",
      "args": ["/absolute/path/to/cognizapp-provider/mcp-server/dist/index.js"],
      "env": {
        "COGNIZAPP_PROVIDER_URL": "https://provider.cognizapp.com",
        "COGNIZAPP_MCP_PASSKEY": "your_passkey_here"
      }
    }
  }
}
```

### VS Code (Continue.dev)

Add to `~/.continue/config.json`:

```json
{
  "experimental": {
    "mcpServers": {
      "cognizapp-provider": {
        "command": "node",
        "args": ["/absolute/path/to/cognizapp-provider/mcp-server/dist/index.js"],
        "env": {
          "COGNIZAPP_PROVIDER_URL": "https://provider.cognizapp.com",
          "COGNIZAPP_MCP_PASSKEY": "your_passkey_here"
        }
      }
    }
  }
}
```

### Generic MCP Client

The server supports two transports:

**stdio** (default — for clients that launch the server as a child process):

```bash
node /path/to/mcp-server/dist/index.js
```

Reads JSON-RPC from stdin, writes responses to stdout. Logs go to stderr.
MCP protocol version `2024-11-05`.

**HTTP / Streamable HTTP** (for clients that connect via Server URL):

```bash
MCP_TRANSPORT=http MCP_PORT=8787 node /path/to/mcp-server/dist/index.js
```

Endpoint: `http://127.0.0.1:8787/mcp` — supports POST (requests), GET (SSE
stream), and DELETE (session close). Stateless sessions are not supported;
each client must initialize a session first.

---

## 5. Your Passkey

Your passkey is:

```
mcp_pk_cdf27611295b4ae9bd97affd597c0b1c498a212e7940b36daae46c3619fa5256
```

This passkey is set on the production backend; MCP clients call the provider frontend (`https://provider.cognizapp.com`) which forwards the passkey
as the `MCP_PROVIDER_PASSKEY` environment variable. It authenticates as the
`cognizapp@gmail.com` provider account.

**Keep this passkey private.** Anyone with this passkey can access the provider
support system. If it's compromised, rotate it by:
1. Generate a new one: `node -e "console.log('mcp_pk_' + require('crypto').randomBytes(32).toString('hex'))"`
2. Update `MCP_PROVIDER_PASSKEY` on Vercel: `echo "new_passkey" | vercel env add MCP_PROVIDER_PASSKEY production`
3. Update `COGNIZAPP_MCP_PASSKEY` in your MCP client config
4. Redeploy the backend

---

## 6. Verifying the Installation

### Method 1: MCP Inspector

```bash
cd cognizapp-provider/mcp-server
COGNIZAPP_MCP_PASSKEY=your_passkey npm run inspector
```

Opens a UI in your browser to browse tools and call them interactively.

### Method 2: Check Auth

Once configured in your client, ask the AI:

```
Use the provider_check_auth tool to verify authentication.
```

Expected response:
```json
{
  "authenticated": true,
  "hasPasskey": true
}
```

### Method 3: Dashboard Stats

```
Use provider_get_dashboard_stats to show me the provider dashboard.
```

If you see stats (totalRequests, openRequests, etc.), everything works.

---

## 7. Tool Reference

All 47 tools grouped by category:

### Dashboard (3)
| Tool | Key Params |
|---|---|
| `provider_get_dashboard_stats` | — |
| `provider_get_upcoming_deadlines` | `limit?` |
| `provider_get_recent_activity` | `limit?` |

### Requests (3)
| Tool | Key Params |
|---|---|
| `provider_list_requests` | `status?`, `paymentStatus?`, `deadline?`, `priority?`, `subscription?` |
| `provider_get_request` | `requestId` |
| `provider_update_request_status` | `requestId`, `status`, `note?` |

### Messages (6)
| Tool | Key Params |
|---|---|
| `provider_list_threads` | — |
| `provider_get_thread_messages` | `threadId` |
| `provider_send_message` | `threadId`, `content`, `attachments?`, `replyToMessageId?` |
| `provider_edit_message` | `threadId`, `messageId`, `content` |
| `provider_delete_message` | `threadId`, `messageId` |
| `provider_create_thread` | `requestId`, `type?` |

### Milestones (6)
| Tool | Key Params |
|---|---|
| `provider_list_milestones` | `requestId` |
| `provider_get_milestone` | `requestId`, `milestoneId` |
| `provider_create_milestone` | `requestId`, `title`, `description?`, `dueAt?`, `status?` |
| `provider_update_milestone_status` | `requestId`, `milestoneId`, `status` |
| `provider_send_milestone_card` | `requestId`, `milestoneId`, `message?`, `status?`, `note?` |
| `provider_get_milestone_history` | `requestId`, `milestoneId` |

### Files (3)
| Tool | Key Params |
|---|---|
| `provider_upload_file` | `requestId`, `fileName`, `fileContentBase64`, `contentType?`, `milestoneId?`, `purpose?` |
| `provider_download_file` | `fileId` |
| `provider_delete_file` | `fileId` |

### Payments (2)
| Tool | Key Params |
|---|---|
| `provider_discount_decision` | `requestId`, `status`, `approvedAmount?`, `discountPercent?`, `reason?` |
| `provider_override_payment_policy` | `requestId`, `depositPercent`, `previewUnlock`, `workStartRequirement`, `editableDocumentRequired`, `reason` (min 8 chars), `revisionsAllowed?` |

### Delivery (3)
| Tool | Key Params |
|---|---|
| `provider_deliver_final_work` | `requestId`, `pdfFileName`, `pdfContentBase64`, `docxFileName`, `docxContentBase64`, `previewImages[]`, `deliveryNote?` |
| `provider_retry_preview` | `requestId` |
| `provider_send_request_card` | `requestId`, `kind` (`payment_card` / `revision_card` / `delivery_card`), `message?`, `amount?`, `paymentType?`, `expectedAt?`, `locked?` |

### Quotes (2)
| Tool | Key Params |
|---|---|
| `provider_list_quotes` | `status?` |
| `provider_create_quote` | `requestId`, `quoteType?`, `lineItems?`, `deliverables?`, `turnaroundHours?`, `revisionPolicy?`, `terms?`, `totalAmount?`, `currency?`, `validUntil?` |

### Orders (3)
| Tool | Key Params |
|---|---|
| `provider_list_orders` | `status?` |
| `provider_get_order` | `orderId` |
| `provider_update_order_status` | `orderId`, `status`, `notes?` |

### Clients & Referrals (2)
| Tool | Key Params |
|---|---|
| `provider_list_clients` | — |
| `provider_list_referrals` | — |

### Discount Codes (4)
| Tool | Key Params |
|---|---|
| `provider_list_discount_codes` | — |
| `provider_create_discount_code` | `discountPercent`, `code?`, `label?`, `maxRedemptions?`, `minimumAmount?`, `eligibleServiceTags?`, `expiresAt?` |
| `provider_update_discount_code` | `codeId`, `label?`, `discountPercent?`, `status?`, `expiresAt?`, … |
| `provider_delete_discount_code` | `codeId` |

### Provider Settings (2)
| Tool | Key Params |
|---|---|
| `provider_get_settings` | — |
| `provider_update_settings` | `displayName?`, `bio?`, `timezone?`, `availabilityStatus?`, `weeklyCapacity?`, `responseTargetHours?`, `notificationPreferences?`, `workloadPreferences?` |

### AI Document Analysis (3)
| Tool | Key Params |
|---|---|
| `provider_ai_extract_comments` | `fileName`, `fileContentBase64`, `contentType?` |
| `provider_ai_extract_structure` | `fileName`, `fileContentBase64`, `contentType?` |
| `provider_ai_suggest_analysis` | `fileName`, `fileContentBase64`, `contentType?` |

> Rate-limited per hour. The passkey is a shared account, so concurrent agent sessions may hit the limit.

### Workflows (4) — composite, read-only
| Tool | Key Params |
|---|---|
| `provider_triage_inbox` | — |
| `provider_request_summary` | `requestId`, `messageLimit?` |
| `provider_draft_quote` | `requestId` |
| `provider_follow_up_overdue` | `deadlineFilter?` (`overdue` / `24h` / `both`) |

### Auth (1)
| Tool | Key Params |
|---|---|
| `provider_check_auth` | — |

---

## 8. Troubleshooting

### "COGNIZAPP_MCP_PASSKEY env var is not set"

The passkey environment variable is missing from your MCP client config. Check:
- `COGNIZAPP_MCP_PASSKEY` is set in the `env` block
- The value has no extra quotes or whitespace
- The env block is properly nested under the server entry

### "Missing or invalid Authorization header"

The backend didn't receive the passkey. Check:
- `MCP_PROVIDER_PASSKEY` is set on the backend (Vercel env var for production)
- The passkey in your MCP config matches the backend's passkey
- `COGNIZAPP_PROVIDER_URL` points to the correct backend

### "mcp_passkey_user_not_found"

The `cognizapp@gmail.com` user doesn't exist in the database. This user must
exist with `SUPPORT_PROVIDER_USER` role. Create it in the database:

```sql
INSERT INTO auth.users (email, role, status, permissions)
VALUES ('cognizapp@gmail.com', 'SUPPORT_PROVIDER_USER', 'active', '[]'::jsonb);
```

### "Cannot connect to backend" / Connection refused

- Verify `COGNIZAPP_PROVIDER_URL` is correct
- For local dev: start the provider with `bun dev` (port 3001); ensure backend is reachable via BACKEND_URL
- For production: use `https://provider.cognizapp.com`
- Test: `curl <PROVIDER_URL>/api/auth/health` should return healthy JSON

### "fileContentBase64 is not valid base64 data"

The base64 string passed to `provider_upload_file` or `provider_deliver_final_work`
is malformed. Ensure it's pure base64 (no `data:` URI prefix, though that is
accepted), length is a multiple of 4, and only contains `A-Za-z0-9+/` with
optional `=` padding.

### "reason must be at least 8 characters long"

`provider_override_payment_policy` requires a `reason` field with at least 8
characters (backend audit logging requirement).

### Server doesn't appear in my client

- Restart your MCP client after editing the config
- Check the config file path is correct for your client
- Check the `args` path is an **absolute** path to `dist/index.js`
- Check Node.js is installed: `node --version`

### Build fails with TypeScript errors

```bash
cd cognizapp-provider/mcp-server
rm -rf node_modules dist
npm install
npm run build
```

### HTTP mode: "No valid session" error

The MCP HTTP server uses stateful sessions. The client must send an `initialize`
request first (POST without `Mcp-Session-Id` header), then include the returned
`Mcp-Session-Id` header on all subsequent requests. If you see this error:
- The client skipped the initialize step
- The session expired (server was restarted)
- The session ID header is missing or malformed

### HTTP mode: Windsurf can't connect

- Ensure the MCP HTTP server is running: `curl -s http://127.0.0.1:8787/mcp` should return 404 (wrong method) not connection refused
- Check the Server URL in Windsurf matches exactly: `http://127.0.0.1:8787/mcp`
- Ensure Authentication is set to **Open** (not Mixed or OAuth)
- Check the server's stderr output for errors
- Verify the passkey is set in the server's environment

---

## 10. Auto-Start on Login (systemd user service)

To have the MCP HTTP server running whenever you're logged in, create a systemd
user service:

```bash
mkdir -p ~/.config/systemd/user
cat > ~/.config/systemd/user/cognizapp-mcp.service << 'EOF'
[Unit]
Description=CognizApp Provider MCP Server (HTTP)
After=network.target

[Service]
Type=simple
WorkingDirectory=/home/reginaldbrixton/Documents/GitHub/cognizapp-provider/mcp-server
Environment=COGNIZAPP_MCP_PASSKEY=mcp_pk_cdf27611295b4ae9bd97affd597c0b1c498a212e7940b36daae46c3619fa5256
Environment=COGNIZAPP_PROVIDER_URL=https://provider.cognizapp.com
Environment=MCP_TRANSPORT=http
Environment=MCP_PORT=8787
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=default.target
EOF

systemctl --user daemon-reload
systemctl --user enable cognizapp-mcp
systemctl --user start cognizapp-mcp
systemctl --user status cognizapp-mcp
```

The MCP server will now start automatically on login and restart on failure.
Windsurf can connect to `http://127.0.0.1:8787/mcp` at any time.

---

## 9. Architecture

```
┌──────────────┐  stdio or HTTP/SSE  ┌─────────────────┐     HTTP/HTTPS     ┌──────────────────┐
│  MCP Client  │ ◄─────────────────► │   MCP Server    │ ◄────────────────► │  Provider API    │
│  (Windsurf,  │                     │  (Node.js)      │                    │  (Next.js proxy  │
│   Claude,    │  stdio: stdin/stdout │  48 tools       │  X-MCP-Passkey     │   → Elysia/Bun   │
│   Cursor)    │  http: :8787/mcp    │  passkey auth   │  ──────────────►   │   backend)       │
└──────────────┘                     └─────────────────┘                    └──────────────────┘
```

### File Structure

```
mcp-server/
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config (ES2022, Node16 modules)
├── README.md             # Quick reference
├── INSTALL.md            # This file
├── evals/
│   └── qa.xml            # 10 evaluation QA pairs
├── .gitignore            # Ignores node_modules/ and dist/
└── src/
    ├── index.ts          # MCP server bootstrap (stdio + HTTP transport)
    ├── api-client.ts     # Provider API client (passkey auth, no JWT)
    ├── constants.ts      # Shared enums (statuses, kinds, types)
    ├── schemas.ts        # Shared Zod schemas/shapes
    ├── utils.ts          # decodeBase64, formatApiError, truncate
    └── tools/            # One file per domain (15 files)
        ├── dashboard.ts
        ├── requests.ts
        ├── messages.ts
        ├── milestones.ts
        ├── files.ts
        ├── payments.ts
        ├── delivery.ts
        ├── quotes.ts
        ├── orders.ts
        ├── clients.ts
        ├── discount-codes.ts
        ├── settings.ts
        ├── ai.ts
        ├── workflows.ts
        └── auth.ts
```

### Development Scripts

| Script | Command | Description |
|---|---|---|
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run the built server |
| `dev` | `tsc && node dist/index.js` | Build and run in one step |
| `inspector` | `npx @modelcontextprotocol/inspector dist/index.js` | Launch MCP Inspector UI |
