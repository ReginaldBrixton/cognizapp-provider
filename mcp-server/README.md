# CognizApp Provider MCP Server

An MCP (Model Context Protocol) server that lets AI agents act as a CognizApp
provider — managing the full support-desk lifecycle: dashboard, requests,
messages, milestones, files, payments, delivery, quotes, orders, clients,
referrals, discount codes, provider settings, AI document analysis, and
composite workflow tools.

It talks to the CognizApp provider frontend API (which proxies to the backend).

## Setup

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

### Build

```bash
cd mcp-server
npm install
npm run build
```

## Install in Windsurf (UI — Server URL + Open Auth)

This is the recommended way to install in Windsurf. The MCP server runs as a
local HTTP server, and Windsurf connects to it via a Server URL with **Open**
authentication (no OAuth, no mixed auth). The passkey lives in the server's
environment — Windsurf itself sends no auth headers.

### Step 1 — Start the MCP HTTP server

```bash
cd cognizapp-provider/mcp-server
export COGNIZAPP_MCP_PASSKEY=mcp_pk_cdf27611295b4ae9bd97affd597c0b1c498a212e7940b36daae46c3619fa5256
export COGNIZAPP_PROVIDER_URL=https://provider.cognizapp.com   # or http://localhost:3001 for local dev
export MCP_TRANSPORT=http
node dist/index.js
```

You should see:
```
[mcp] cognizapp-provider-mcp v1.2.0 listening on http://127.0.0.1:8787/mcp
[mcp] Windsurf Server URL: http://127.0.0.1:8787/mcp
[mcp] Authentication: Open (passkey is held in server env)
```

### Step 2 — Add to Windsurf via UI

Open Windsurf → Settings → MCP Servers → **Add Server**, and fill in:

| Field | Value |
|---|---|
| **MCP Name** | `CognizApp Provider` |
| **Description** | AI agent tools for managing the CognizApp provider support desk — dashboard, requests, messages, milestones, files, payments, quotes, orders, clients, referrals, discount codes, settings, AI document analysis, and workflow orchestration. |
| **Connection** | `http://127.0.0.1:8787/mcp` |
| **Authentication** | `Open` |

Click **Add** and Windsurf will connect. Verify by asking Cascade:
> Use `provider_check_auth` to verify authentication.

Expected: `{ "authenticated": true, "hasPasskey": true }`

### Step 3 (optional) — Auto-start on login

To have the MCP server running whenever you're logged in, create a systemd user
service or add a startup script. See `INSTALL.md` for details.

## Install in Windsurf (stdio — alternative)

If you prefer the traditional stdio config, add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "cognizapp-provider": {
    "command": "node",
    "args": ["/path/to/mcp-server/dist/index.js"],
    "disabled": false,
    "env": {
      "COGNIZAPP_PROVIDER_URL": "https://provider.cognizapp.com",
      "COGNIZAPP_MCP_PASSKEY": "your_passkey_here"
    }
  }
}
```

See `INSTALL.md` for Claude Desktop, Cursor, VS Code, and generic client setup.

## Available Tools (47)

### Dashboard (3)
- **`provider_get_dashboard_stats`** — Total/open/converted requests, threads, referrals
- **`provider_get_upcoming_deadlines`** — Soonest deadlines (`limit?`)
- **`provider_get_recent_activity`** — Activity log (`limit?`)

### Requests (3)
- **`provider_list_requests`** — List with filters (`status?`, `paymentStatus?`, `deadline?`, `priority?`, `subscription?`)
- **`provider_get_request`** — Single request details (`requestId`)
- **`provider_update_request_status`** — Update status with optional note (`requestId`, `status`, `note?`)

### Messages / Chat (6)
- **`provider_list_threads`** — All message threads
- **`provider_get_thread_messages`** — Messages in a thread (`threadId`)
- **`provider_send_message`** — Send a message (`threadId`, `content`, `attachments?`, `replyToMessageId?`)
- **`provider_edit_message`** — Edit a message (`threadId`, `messageId`, `content`)
- **`provider_delete_message`** — Soft-delete a message (`threadId`, `messageId`)
- **`provider_create_thread`** — Create a thread for a request (`requestId`, `type?`)

### Milestones (6)
- **`provider_list_milestones`** — List milestones (`requestId`)
- **`provider_get_milestone`** — Milestone details (`requestId`, `milestoneId`)
- **`provider_create_milestone`** — Create a milestone (`requestId`, `title`, `description?`, `dueAt?`, `status?`)
- **`provider_update_milestone_status`** — Update status (`requestId`, `milestoneId`, `status`)
- **`provider_send_milestone_card`** — Send milestone card to chat (`requestId`, `milestoneId`, `message?`, `status?`, `note?`)
- **`provider_get_milestone_history`** — Version history (`requestId`, `milestoneId`)

### Files (3)
- **`provider_upload_file`** — Upload a file (`requestId`, `fileName`, `fileContentBase64`, `contentType?`, `milestoneId?`, `purpose?`)
- **`provider_download_file`** — Download a file → base64 (`fileId`)
- **`provider_delete_file`** — Delete a file (`fileId`)

### Payments (2)
- **`provider_discount_decision`** — Approve/reject discount (`requestId`, `status`, `approvedAmount?`, `discountPercent?`, `reason?`)
- **`provider_override_payment_policy`** — Override payment policy (`requestId`, `depositPercent`, `previewUnlock`, `workStartRequirement`, `editableDocumentRequired`, `reason` [min 8 chars], `revisionsAllowed?`)

### Delivery (3)
- **`provider_deliver_final_work`** — Upload final delivery (`requestId`, `pdfFileName`, `pdfContentBase64`, `docxFileName`, `docxContentBase64`, `previewImages[]`, `deliveryNote?`)
- **`provider_retry_preview`** — Retry failed preview generation (`requestId`)
- **`provider_send_request_card`** — Send structured card (`requestId`, `kind`: `payment_card`/`revision_card`/`delivery_card`, `message?`, `amount?`, `paymentType?`, `expectedAt?`, `locked?`)

### Quotes (2)
- **`provider_list_quotes`** — List quotes (`status?`)
- **`provider_create_quote`** — Create and send a quote (`requestId`, `quoteType?`, `lineItems?`, `deliverables?`, `turnaroundHours?`, `revisionPolicy?`, `terms?`, `totalAmount?`, `currency?`, `validUntil?`)

### Orders (3)
- **`provider_list_orders`** — List orders (`status?`)
- **`provider_get_order`** — Order details (`orderId`)
- **`provider_update_order_status`** — Update order status (`orderId`, `status`, `notes?`)

### Clients & Referrals (2)
- **`provider_list_clients`** — List clients with aggregated stats
- **`provider_list_referrals`** — List referrals

### Discount Codes (4)
- **`provider_list_discount_codes`** — List discount codes with redemption history
- **`provider_create_discount_code`** — Create a discount code (`discountPercent`, `code?`, `label?`, `maxRedemptions?`, `minimumAmount?`, `eligibleServiceTags?`, `expiresAt?`)
- **`provider_update_discount_code`** — Update a discount code (`codeId`, `label?`, `discountPercent?`, `status?`, `expiresAt?`, …)
- **`provider_delete_discount_code`** — Cancel a discount code (`codeId`)

### Provider Settings (2)
- **`provider_get_settings`** — Read provider settings
- **`provider_update_settings`** — Update provider settings (`displayName?`, `bio?`, `timezone?`, `availabilityStatus?`, `weeklyCapacity?`, `responseTargetHours?`, `notificationPreferences?`, `workloadPreferences?`)

### AI Document Analysis (3)
- **`provider_ai_extract_comments`** — Extract supervisor comments/annotations from a document (`fileName`, `fileContentBase64`, `contentType?`)
- **`provider_ai_extract_structure`** — Extract chapter/section headings (`fileName`, `fileContentBase64`, `contentType?`)
- **`provider_ai_suggest_analysis`** — Analyze a dataset and suggest analysis types (`fileName`, `fileContentBase64`, `contentType?`)

> Rate-limited per hour. The passkey is a shared account, so concurrent agent sessions may hit the limit.

### Workflows (4) — composite, read-only
- **`provider_triage_inbox`** — Pre-prioritised inbox summary (stats + overdue + 24h + new submissions + activity) in one call
- **`provider_request_summary`** — Holistic request summary (request + milestones + thread + recent messages) in one call (`requestId`, `messageLimit?`)
- **`provider_draft_quote`** — Generate a suggested quote skeleton for a request (`requestId`) — refine then call `provider_create_quote`
- **`provider_follow_up_overdue`** — List overdue/24h requests with draft follow-up messages (`deadlineFilter?`: `overdue`/`24h`/`both`)

### Auth (1)
- **`provider_check_auth`** — Check passkey + backend reachability

## Workflow Tools — Usage Guide

The workflow tools chain multiple backend calls so the agent can answer common
"what needs my attention?" questions in one round-trip:

```
provider_triage_inbox           → "What needs my attention right now?"
       │
       ├─ newSubmissions[]      → for each: provider_request_summary
       │                              │
       │                              └─ provider_draft_quote
       │                                     │
       │                                     └─ provider_create_quote  (after refining)
       │
       ├─ overdue[] / due24h[]  → provider_follow_up_overdue
       │                              │
       │                              └─ provider_send_message  (with the draft, personalised)
       │
       └─ recentActivity[]      → context for any of the above
```

## Architecture

```
mcp-server/
├── package.json
├── tsconfig.json
├── INSTALL.md              # Full installation guide
├── README.md               # This file
├── evals/
│   └── qa.xml              # 10 read-only evaluation QA pairs
└── src/
    ├── index.ts            # McpServer bootstrap + tool registration
    ├── api-client.ts       # Backend API client (passkey auth)
    ├── constants.ts        # Shared enums (statuses, kinds, types)
    ├── schemas.ts          # Shared Zod schemas/shapes
    ├── utils.ts            # decodeBase64, formatApiError, truncate
    └── tools/              # One file per domain (15 files)
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

The server uses stdio transport and talks directly to the CognizApp backend API
at `COGNIZAPP_PROVIDER_URL` (provider frontend). Authentication uses a single static passkey sent via
the `X-MCP-Passkey` header. No JWT tokens, no refresh logic, no token expiry.

Built with the modern MCP TypeScript SDK (`McpServer` + `registerTool` + Zod).
