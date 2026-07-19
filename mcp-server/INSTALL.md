# CognizApp Provider MCP Server — Installation Guide

A complete guide to install, configure, and run the CognizApp Provider MCP Server.
This MCP server exposes 26 tools that let AI assistants (Claude, Windsurf Cascade,
Cursor, etc.) manage the CognizApp provider support system — dashboard, requests,
messages, milestones, files, payments, delivery, and auth.

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
| **CognizApp Backend API** | Running and accessible | `curl <BACKEND_URL>/health` |

### Supported Backends

| Environment | URL | Notes |
|---|---|---|
| Local dev | `http://localhost:4040` | Run `bun run src/server.ts` in the backend repo |
| Production | `https://api.cognizapp.com` | Passkey works in production |

---

## 2. Quick Start (3 Minutes)

```bash
# 1. Clone and build
git clone https://github.com/ReginaldBrixton/cognizapp-provider.git
cd cognizapp-provider/mcp-server
npm install && npm run build

# 2. Test it starts
COGNIZAPP_MCP_PASSKEY=your_passkey npm start
# Should see: "CognizApp Provider MCP Server running on stdio"
# Ctrl+C to stop

# 3. Add to your MCP client config (see Section 4)
```

---

## 3. Configuration

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `COGNIZAPP_MCP_PASSKEY` | **Yes** | — | Static passkey for authentication (never expires) |
| `COGNIZAPP_BACKEND_URL` | No | `http://localhost:4040` | Backend API base URL |

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

Edit `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "cognizapp-provider": {
      "command": "node",
      "args": ["/absolute/path/to/cognizapp-provider/mcp-server/dist/index.js"],
      "disabled": false,
      "env": {
        "COGNIZAPP_BACKEND_URL": "https://api.cognizapp.com",
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
        "COGNIZAPP_BACKEND_URL": "https://api.cognizapp.com",
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
        "COGNIZAPP_BACKEND_URL": "https://api.cognizapp.com",
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
          "COGNIZAPP_BACKEND_URL": "https://api.cognizapp.com",
          "COGNIZAPP_MCP_PASSKEY": "your_passkey_here"
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
Logs go to stderr. MCP protocol version `2024-11-05`.

---

## 5. Your Passkey

Your passkey is:

```
mcp_pk_cdf27611295b4ae9bd97affd597c0b1c498a212e7940b36daae46c3619fa5256
```

This passkey is already set on the production backend (`https://api.cognizapp.com`)
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

All 26 tools grouped by category:

### Dashboard (3)
| Tool | Key Params |
|---|---|
| `provider_get_dashboard_stats` | — |
| `provider_get_upcoming_deadlines` | `limit?` |
| `provider_get_recent_activity` | `limit?` |

### Requests (2)
| Tool | Key Params |
|---|---|
| `provider_list_requests` | `status?`, `paymentStatus?`, `priority?` |
| `provider_get_request` | `requestId` |

### Messages (6)
| Tool | Key Params |
|---|---|
| `provider_list_threads` | — |
| `provider_get_thread_messages` | `threadId` |
| `provider_send_message` | `threadId`, `content` |
| `provider_edit_message` | `threadId`, `messageId`, `content` |
| `provider_delete_message` | `threadId`, `messageId` |
| `provider_create_thread` | `requestId` |

### Milestones (6)
| Tool | Key Params |
|---|---|
| `provider_list_milestones` | `requestId` |
| `provider_get_milestone` | `requestId`, `milestoneId` |
| `provider_create_milestone` | `requestId`, `title`, `dueAt?` |
| `provider_update_milestone_status` | `requestId`, `milestoneId`, `status` |
| `provider_send_milestone_card` | `requestId`, `milestoneId`, `status?` |
| `provider_get_milestone_history` | `requestId`, `milestoneId` |

### Files (3)
| Tool | Key Params |
|---|---|
| `provider_upload_file` | `requestId`, `fileName`, `fileContentBase64` |
| `provider_download_file` | `fileId` |
| `provider_delete_file` | `fileId` |

### Payments (2)
| Tool | Key Params |
|---|---|
| `provider_discount_decision` | `requestId`, `status`, `discountPercent?` |
| `provider_override_payment_policy` | `requestId`, `depositPercent`, `previewUnlock`, `workStartRequirement`, `editableDocumentRequired`, `reason` (min 8 chars) |

### Delivery (1)
| Tool | Key Params |
|---|---|
| `provider_deliver_final_work` | `requestId`, `pdfFileName`, `pdfContentBase64`, `docxFileName`, `docxContentBase64`, `previewImages[]` |

### Preview (1)
| Tool | Key Params |
|---|---|
| `provider_retry_preview` | `requestId` |

### Cards (1)
| Tool | Key Params |
|---|---|
| `provider_send_request_card` | `requestId`, `kind` (`payment_card` / `revision_card` / `delivery_card`) |

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
- `COGNIZAPP_BACKEND_URL` points to the correct backend

### "mcp_passkey_user_not_found"

The `cognizapp@gmail.com` user doesn't exist in the database. This user must
exist with `SUPPORT_PROVIDER_USER` role. Create it in the database:

```sql
INSERT INTO auth.users (email, role, status, permissions)
VALUES ('cognizapp@gmail.com', 'SUPPORT_PROVIDER_USER', 'active', '[]'::jsonb);
```

### "Cannot connect to backend" / Connection refused

- Verify `COGNIZAPP_BACKEND_URL` is correct
- For local dev: start the backend with `bun run src/server.ts` (port 4040)
- For production: use `https://api.cognizapp.com`
- Test: `curl <BACKEND_URL>/health` should return `{"status":"ok"}`

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

---

## 9. Architecture

```
┌──────────────┐     stdio (JSON-RPC)     ┌─────────────────┐     HTTP/HTTPS     ┌──────────────────┐
│  MCP Client  │ ◄──────────────────────► │   MCP Server    │ ◄────────────────► │  CognizApp API   │
│  (Claude,    │                          │  (Node.js)      │                    │  (Elysia/Bun)    │
│   Windsurf,  │                          │                 │  X-MCP-Passkey     │                  │
│   Cursor)    │                          │  26 tools       │  ──────────────►   │  /api/support/   │
│              │                          │  passkey auth   │                    │  /api/support-   │
└──────────────┘                          └─────────────────┘                    │    inbox/        │
                                                                                 └──────────────────┘
```

### File Structure

```
mcp-server/
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript config (ES2022, Node16 modules)
├── README.md             # Quick reference
├── INSTALL.md            # This file
├── .gitignore            # Ignores node_modules/ and dist/
└── src/
    ├── index.ts          # MCP server + 26 tool definitions + handlers
    └── api-client.ts     # Backend HTTP client (passkey auth, no JWT)
```

### Development Scripts

| Script | Command | Description |
|---|---|---|
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/index.js` | Run the built server |
| `dev` | `tsc && node dist/index.js` | Build and run in one step |
| `inspector` | `npx @modelcontextprotocol/inspector dist/index.js` | Launch MCP Inspector UI |
