/**
 * Mandatory verification language test.
 *
 * Asserts the server instructions and the image-preserving document prompt
 * contain the key rules that prevent the agent from claiming success without
 * a tool result, and that require asset inspection + preflight before delivery.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { PROVIDER_SERVER_INSTRUCTIONS } from '../../dist/enhancements/instructions.js'
import { PROVIDER_PROMPTS } from '../../dist/enhancements/prompts.js'

test('server instructions contain mandatory verification language', () => {
	const s = PROVIDER_SERVER_INSTRUCTIONS
	assert.match(s, /NEVER claim an upload, delivery, payment, or unlock succeeded unless a tool result confirms it/)
	assert.match(s, /provider_inspect_document_assets/)
	assert.match(s, /provider_preflight_delivery/)
	assert.match(s, /provider_deliver_final_work_from_file_ids/)
	assert.match(s, /allowImageCountReduction/)
})

test('image-preserving document prompt contains mandatory workflow steps', () => {
	const p = PROVIDER_PROMPTS.imagePreservingDocumentWork
	assert.match(p, /provider_inspect_document_assets/)
	assert.match(p, /provider_preflight_delivery/)
	assert.match(p, /provider_deliver_final_work_from_file_ids/)
	assert.match(p, /PDF embedded-image extraction is NOT lossless/)
})

test('final delivery prompt enforces preflight + verification', () => {
	const p = PROVIDER_PROMPTS.finalDeliveryAndPayment
	assert.match(p, /provider_preflight_delivery/)
	assert.match(p, /Read the delivery tool result/)
	assert.match(p, /locked until full payment/)
})

test('request handling prompt enforces read-before-act', () => {
	const p = PROVIDER_PROMPTS.requestHandling
	assert.match(p, /provider_get_thread_messages/)
	assert.match(p, /NEVER claim an upload, delivery, payment, or unlock succeeded unless a tool result confirms it/)
})
