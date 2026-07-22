/**
 * Preflight delivery parity test.
 *
 * Verifies that provider_preflight_delivery blocks delivery when the output
 * DOCX has fewer images than the source DOCX, and passes when
 * allowImageCountReduction is set. Uses mock EnhancementDeps (no network).
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDocx, TINY_PNG } from './zip-writer.mjs'
import { preflightDelivery } from '../../dist/enhancements/tools/preflight-delivery.js'

/** Build mock deps that serve synthetic files from an in-memory map. */
function mockDeps(files) {
	return {
		downloadFile: async (fileId) => {
			const f = files[fileId]
			if (!f) throw new Error(`mock: unknown fileId ${fileId}`)
			return {
				fileId,
				filename: f.filename,
				contentType: f.contentType,
				size: f.buffer.length,
				contentBase64: f.buffer.toString('base64'),
			}
		},
		uploadFile: async () => ({ id: 'mock-upload-id' }),
		deliverFinalWork: async () => ({ ok: true, delivered: true }),
	}
}

test('preflight blocks delivery when output has fewer images than source', async () => {
	const sourceDocx = buildDocx(['word/media/image1.png', 'word/media/image2.png'])
	const outputDocx = buildDocx(['word/media/image1.png']) // only 1 image
	const deps = mockDeps({
		src: { filename: 'source.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: sourceDocx },
		out: { filename: 'output.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: outputDocx },
	})

	const result = await preflightDelivery(deps, {
		requestId: 'req-1',
		docxFileId: 'out',
		sourceFileIds: ['src'],
		allowImageCountReduction: false,
	})

	assert.equal(result.ok, false)
	assert.equal(result.imageParity.sourceImageCount, 2)
	assert.equal(result.imageParity.outputImageCount, 1)
	assert.equal(result.imageParity.matching, false)
	const parity = result.checks.find((c) => c.name === 'image_parity')
	assert.ok(parity, 'image_parity check present')
	assert.equal(parity.ok, false)
	assert.ok(result.errors.some((e) => e.includes('Image parity failed')))
})

test('preflight passes when allowImageCountReduction=true', async () => {
	const sourceDocx = buildDocx(['word/media/image1.png', 'word/media/image2.png'])
	const outputDocx = buildDocx(['word/media/image1.png'])
	const deps = mockDeps({
		src: { filename: 'source.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: sourceDocx },
		out: { filename: 'output.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: outputDocx },
	})

	const result = await preflightDelivery(deps, {
		requestId: 'req-1',
		docxFileId: 'out',
		sourceFileIds: ['src'],
		allowImageCountReduction: true,
	})

	assert.equal(result.imageParity.matching, true)
	const parity = result.checks.find((c) => c.name === 'image_parity')
	assert.equal(parity.ok, true)
	// ok is true only if ALL checks pass; docx + parity both pass here.
	assert.equal(result.ok, true)
})

test('preflight passes when output image count matches source', async () => {
	const sourceDocx = buildDocx(['word/media/image1.png', 'word/media/image2.png'])
	const outputDocx = buildDocx(['word/media/image1.png', 'word/media/image2.png'])
	const deps = mockDeps({
		src: { filename: 'source.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: sourceDocx },
		out: { filename: 'output.docx', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: outputDocx },
	})

	const result = await preflightDelivery(deps, {
		requestId: 'req-1',
		docxFileId: 'out',
		sourceFileIds: ['src'],
		allowImageCountReduction: false,
	})

	assert.equal(result.imageParity.sourceImageCount, 2)
	assert.equal(result.imageParity.outputImageCount, 2)
	assert.equal(result.imageParity.matching, true)
	assert.equal(result.ok, true)
})
