/**
 * DOCX image extraction + ZIP reader round-trip test.
 *
 * Builds a synthetic 2-image DOCX with the test-only zip-writer, then asserts
 * the production extractor returns both images in document order.
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildDocx } from './zip-writer.mjs'
import { readZip } from '../../dist/enhancements/zip/zip-reader.js'
import { extractDocxAssets } from '../../dist/enhancements/zip/docx-assets.js'

test('zip-reader round-trips a STORE-only ZIP', () => {
	const buf = buildDocx(['word/media/image1.png', 'word/media/image2.png'])
	const zip = readZip(buf)
	assert.equal(zip.has('[Content_Types].xml'), true)
	assert.equal(zip.has('word/document.xml'), true)
	assert.equal(zip.has('word/media/image1.png'), true)
	const doc = zip.read('word/document.xml').toString('utf8')
	assert.match(doc, /w:document/)
})

test('extractDocxAssets returns images in document order', () => {
	const buf = buildDocx(['word/media/image1.png', 'word/media/image2.png'])
	const zip = readZip(buf)
	const assets = extractDocxAssets(zip, false)
	assert.equal(assets.length, 2)
	assert.equal(assets[0].order, 1)
	assert.equal(assets[0].relId, 'rId1')
	assert.equal(assets[0].entryPath, 'word/media/image1.png')
	assert.equal(assets[0].contentType, 'image/png')
	assert.equal(assets[1].order, 2)
	assert.equal(assets[1].relId, 'rId2')
	assert.equal(assets[1].entryPath, 'word/media/image2.png')
})

test('extractDocxAssets includes Base64 when requested', () => {
	const buf = buildDocx(['word/media/image1.png'])
	const zip = readZip(buf)
	const assets = extractDocxAssets(zip, true)
	assert.equal(assets.length, 1)
	assert.ok(assets[0].contentBase64 && assets[0].contentBase64.length > 0)
	assert.equal(Buffer.from(assets[0].contentBase64, 'base64').length, assets[0].size)
})

test('extractDocxAssets handles zero-image DOCX', () => {
	const buf = buildDocx([])
	const zip = readZip(buf)
	const assets = extractDocxAssets(zip, false)
	assert.equal(assets.length, 0)
})
