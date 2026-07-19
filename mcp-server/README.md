# CognizApp Provider MCP Server

An MCP (Model Context Protocol) server that enables AI to control the CognizApp Provider support system. It talks directly to the CognizApp backend API.

## Setup

### Environment Variables

| Variable | Required | Description |
|---|---|---|
| `COGNIZAPP_MCP_PASSKEY` | **Yes** | Static passkey for authentication (never expires) |
| `COGNIZAPP_BACKEND_URL` | No | Backend URL (default: `http://localhost:4040`) |

That's it. One passkey. No JWT tokens, no refresh tokens, no email.

### Build

```bash
cd mcp-server
npm install
npm run build
```

### Windsurf Configuration

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "cognizapp-provider": {
    "command": "node",
    "args": ["/path/to/mcp-server/dist/index.js"],
    "disabled": false,
    "env": {
      "COGNIZAPP_BACKEND_URL": "https://api.cognizapp.com",
      "COGNIZAPP_MCP_PASSKEY": "your_passkey_here"
    }
  }
}
```

## Available Tools (26)

### Dashboard
- **`provider_get_dashboard_stats`** — Get provider dashboard statistics
- **`provider_get_upcoming_deadlines`** — Get upcoming deadlines (limit param)
- **`provider_get_recent_activity`** — Get recent activity log (limit param)

### Requests
- **`provider_list_requests`** — List requests with filters (status, paymentStatus, deadline, priority, subscription)
- **`provider_get_request`** — Get single request details (requestId)

### Messages / Chat
- **`provider_list_threads`** — List all message threads
- **`provider_get_thread_messages`** — Get messages in a thread (threadId)
- **`provider_send_message`** — Send a message to a thread (threadId, content, attachments?, replyToMessageId?)
- **`provider_edit_message`** — Edit a message (threadId, messageId, content)
- **`provider_delete_message`** — Delete a message (threadId, messageId)
- **`provider_create_thread`** — Create a thread for a request (requestId, type?)

### Milestones
- **`provider_list_milestones`** — List milestones for a request (requestId)
- **`provider_get_milestone`** — Get milestone details (requestId, milestoneId)
- **`provider_create_milestone`** — Create a milestone (requestId, title, description?, dueAt?, status?)
- **`provider_update_milestone_status`** — Update milestone status (requestId, milestoneId, status)
- **`provider_send_milestone_card`** — Send milestone card to chat (requestId, milestoneId, message?, status?, note?)
- **`provider_get_milestone_history`** — Get milestone version history (requestId, milestoneId)

### Files
- **`provider_upload_file`** — Upload a file (requestId, fileName, fileContentBase64, contentType?, milestoneId?, purpose?)
- **`provider_download_file`** — Download a file (fileId) → returns base64 content, contentType, size, filename
- **`provider_delete_file`** — Delete a file (fileId)

### Payments & Discounts
- **`provider_discount_decision`** — Approve/reject discount (requestId, status, approvedAmount?, discountPercent?, reason?)
- **`provider_override_payment_policy`** — Override payment policy (requestId, depositPercent, previewUnlock, workStartRequirement, editableDocumentRequired, reason [min 8 chars], revisionsAllowed?)

### Delivery
- **`provider_deliver_final_work`** — Upload final delivery (requestId, pdfFileName, pdfContentBase64, docxFileName, docxContentBase64, previewImages[], deliveryNote?)

### Preview
- **`provider_retry_preview`** — Retry failed preview generation (requestId)

### Cards
- **`provider_send_request_card`** — Send structured card to chat (requestId, kind, message?, note?, title?, amount?, paymentType?, expectedAt?, locked?). kind: "payment_card", "revision_card", or "delivery_card"

### Auth
- **`provider_check_auth`** — Check if the passkey is configured and the backend is reachable

## Architecture

```
mcp-server/
├── package.json
├── tsconfig.json
├── INSTALL.md       # Full installation guide
└── src/
    ├── index.ts       # MCP server + tool definitions + handlers
    └── api-client.ts  # Backend API client (passkey auth)
```

The server uses stdio transport and talks directly to the CognizApp backend API at `COGNIZAPP_BACKEND_URL`. Authentication uses a single static passkey sent via the `X-MCP-Passkey` header. No JWT tokens, no refresh logic, no token expiry.
