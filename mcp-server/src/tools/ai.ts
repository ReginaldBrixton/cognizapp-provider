/**
 * AI document analysis tools — extract supervisor comments, extract document
 * structure, and suggest analysis for datasets. These wrap the backend's
 * /api/provider/ai/* endpoints which call Gemini.
 *
 * Note: These endpoints are rate-limited per user (extraction: per hour).
 * The MCP passkey authenticates as a single shared account, so concurrent
 * agent sessions may hit the limit. Tool descriptions document this.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiFormUpload } from '../api-client.js'
import { blobFromBase64, serializeResult } from '../utils.js'

export function registerAiTools(server: McpServer): void {
	server.registerTool(
		'provider_ai_extract_comments',
		{
			title: 'AI: Extract Document Comments',
			description: `Extract supervisor comments, track changes, and annotations from a document (DOCX, PDF, etc.) using Gemini AI.

When to use: When a client has uploaded a document with supervisor feedback and you need to identify all the comments/annotations to address. Returns a structured list of comments with location and page reference.
Args:
  - fileName (string, required): Name of the document (e.g. "thesis_v2.docx")
  - fileContentBase64 (string, required): Base64-encoded document content
  - contentType (string, optional): MIME type (e.g. "application/vnd.openxmlformats-officedocument.wordprocessingml.document" for DOCX, "application/pdf" for PDF)
Returns: { comments: [{ id, text, location, pageRef }] }
Rate limit: Per-hour extraction limit applies. If you get a 429, wait before retrying.`,
			inputSchema: {
				fileName: z.string().min(1).describe('Name of the document (e.g. "thesis_v2.docx")'),
				fileContentBase64: z
					.string()
					.min(1)
					.describe('Base64-encoded document content'),
				contentType: z
					.string()
					.default('application/octet-stream')
					.describe('MIME type (e.g. application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document)'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async ({ fileName, fileContentBase64, contentType }) => {
			const blob = blobFromBase64(fileContentBase64, 'fileContentBase64', contentType || 'application/octet-stream')
			const formData = new FormData()
			formData.append('file', blob, fileName)
			const result = await apiFormUpload('/api/provider/ai/extract-comments', formData)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_ai_extract_structure',
		{
			title: 'AI: Extract Document Structure',
			description: `Extract chapter and section headings from a document using Gemini AI.

When to use: When you need to understand the structure of a client's document — e.g. to plan chapter-level editing, or to verify a thesis has the expected sections.
Args:
  - fileName (string, required): Name of the document
  - fileContentBase64 (string, required): Base64-encoded document content
  - contentType (string, optional): MIME type
Returns: A structured outline of chapters and sections (format determined by the backend Gemini prompt).
Rate limit: Per-hour extraction limit applies.`,
			inputSchema: {
				fileName: z.string().min(1).describe('Name of the document'),
				fileContentBase64: z
					.string()
					.min(1)
					.describe('Base64-encoded document content'),
				contentType: z
					.string()
					.default('application/octet-stream')
					.describe('MIME type (e.g. application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document)'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async ({ fileName, fileContentBase64, contentType }) => {
			const blob = blobFromBase64(fileContentBase64, 'fileContentBase64', contentType || 'application/octet-stream')
			const formData = new FormData()
			formData.append('file', blob, fileName)
			const result = await apiFormUpload('/api/provider/ai/extract-structure', formData)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_ai_suggest_analysis',
		{
			title: 'AI: Suggest Dataset Analysis',
			description: `Analyze an uploaded dataset (CSV, Excel, or SPSS) and suggest analysis types using Gemini AI.

When to use: When a client has uploaded a dataset for data-analysis work and you need to understand the columns and recommend an analysis approach before quoting.
Args:
  - fileName (string, required): Name of the dataset file
  - fileContentBase64 (string, required): Base64-encoded dataset content
  - contentType (string, optional): MIME type (e.g. "text/csv", "application/vnd.ms-excel", "application/vnd.spss.sav")
Returns: { columns: [{ name, inferredType }], suggestions: [string] }
Rate limit: Per-hour extraction limit applies.`,
			inputSchema: {
				fileName: z.string().min(1).describe('Name of the dataset file'),
				fileContentBase64: z
					.string()
					.min(1)
					.describe('Base64-encoded dataset content'),
				contentType: z
					.string()
					.default('application/octet-stream')
					.describe('MIME type (e.g. text/csv, application/vnd.ms-excel)'),
			},
			annotations: { readOnlyHint: true, openWorldHint: false, destructiveHint: false },
		},
		async ({ fileName, fileContentBase64, contentType }) => {
			const blob = blobFromBase64(fileContentBase64, 'fileContentBase64', contentType || 'application/octet-stream')
			const formData = new FormData()
			formData.append('file', blob, fileName)
			const result = await apiFormUpload('/api/provider/ai/suggest-analysis', formData)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)
}
