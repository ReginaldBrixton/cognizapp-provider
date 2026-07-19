/**
 * File tools — upload, download, delete support files.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { z } from 'zod'
import { apiCall, apiCallRaw, apiDownloadBinary, apiFormUpload } from '../api-client.js'
import { FILE_PURPOSES } from '../constants.js'
import { blobFromBase64, serializeResult } from '../utils.js'

export function registerFileTools(server: McpServer): void {
	server.registerTool(
		'provider_upload_file',
		{
			title: 'Upload File',
			description: `Upload a file to a support request or milestone. File content is provided as base64-encoded data. Supports any file type (PDF, DOCX, images, etc.).

When to use: To attach a deliverable, supporting document, or milestone upload to a request.
Args:
  - requestId (string, required): The request ID (UUID)
  - fileName (string, required): Name of the file (e.g. "chapter1.pdf")
  - fileContentBase64 (string, required): Base64-encoded file content (raw or data URI)
  - contentType (string, optional): MIME type (default "application/octet-stream")
  - milestoneId (string, optional): Milestone ID to associate the file with
  - purpose (string, optional): File purpose — request_attachment, milestone_upload, delivery, preview, revision (default request_attachment)
Returns: The uploaded file metadata (file ID, URL, etc.).`,
			inputSchema: {
				requestId: z.string().min(1).describe('The support request ID (UUID)'),
				fileName: z.string().min(1).describe('Name of the file (e.g. "report.pdf")'),
				fileContentBase64: z
					.string()
					.min(1)
					.describe('Base64-encoded file content (raw or data URI)'),
				contentType: z
					.string()
					.default('application/octet-stream')
					.describe('MIME type (e.g. application/pdf, image/png)'),
				milestoneId: z
					.string()
					.optional()
					.describe('Optional milestone ID to associate the file with'),
				purpose: z
					.enum(FILE_PURPOSES)
					.default('request_attachment')
					.describe(
						'File purpose: request_attachment, milestone_upload, delivery, preview, revision',
					),
			},
		},
		async ({ requestId, fileName, fileContentBase64, contentType, milestoneId, purpose }) => {
			const blob = blobFromBase64(fileContentBase64, 'fileContentBase64', contentType || 'application/octet-stream')
			const formData = new FormData()
			formData.append('requestId', requestId)
			if (milestoneId) formData.append('milestoneId', milestoneId)
			formData.append('purpose', purpose || 'request_attachment')
			formData.append('files', blob, fileName)
			const result = await apiFormUpload('/api/files/upload', formData)
			return { content: [{ type: 'text', text: serializeResult(result) }] }
		},
	)

	server.registerTool(
		'provider_download_file',
		{
			title: 'Download File',
			description: `Download a file by its file ID. Returns base64-encoded file content with content type, size, and filename.

When to use: To read a file's contents — e.g. to review a client's uploaded document before quoting, or to inspect a milestone deliverable.
Args:
  - fileId (string, required): The file ID (UUID)
Returns: { fileId, contentType, size, filename, contentBase64 }
Note: Large files produce large base64 strings. The response is truncated at ${25_000} chars — for very large files, consider downloading via the backend directly.`,
			inputSchema: {
				fileId: z.string().min(1).describe('The file ID (UUID)'),
			},
			annotations: { readOnlyHint: true },
		},
		async ({ fileId }) => {
			const result = await apiDownloadBinary(`/api/files/${fileId}/download`)
			const base64 = result.buffer.toString('base64')
			const payload = {
				fileId,
				contentType: result.contentType,
				size: result.buffer.length,
				filename: result.filename,
				contentBase64: base64,
			}
			return { content: [{ type: 'text', text: serializeResult(payload) }] }
		},
	)

	server.registerTool(
		'provider_delete_file',
		{
			title: 'Delete File',
			description: `Delete a file by its file ID. Soft-deletes the file (the record is preserved for audit).

When to use: Rarely — only when a file was uploaded in error. Prefer keeping files for audit trail.
Args:
  - fileId (string, required): The file ID (UUID)
Returns: Raw response (typically a confirmation object).`,
			inputSchema: {
				fileId: z.string().min(1).describe('The file ID (UUID)'),
			},
			annotations: { destructiveHint: true },
		},
		async ({ fileId }) => {
			const result = await apiCallRaw(`/api/files/${fileId}`, { method: 'DELETE' })
			return { content: [{ type: 'text', text: serializeResult(result.data) }] }
		},
	)
}
