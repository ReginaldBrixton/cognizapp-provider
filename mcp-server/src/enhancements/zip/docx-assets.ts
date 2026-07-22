/**
 * DOCX image extraction.
 *
 * A DOCX is a ZIP with `word/document.xml` (the body) and
 * `word/_rels/document.xml.rels` (relationships). Image references appear as
 * `<a:blip r:embed="rIdN"/>` (or VML `<v:imagedata r:id="rIdN"/>`) in document
 * order. Each rId resolves to a `media/imageN.<ext>` target.
 *
 * Header/footer parts (`word/header1.xml`, `word/footer1.xml`, …) also carry
 * images; they are appended after the body in part order.
 */

import type { ImageAsset } from '../types.js'
import type { ZipFile } from './zip-reader.js'
import {
	basename,
	contentTypeForPath,
	extractImageRIdsInOrder,
	readRels,
	resolveTarget,
} from './ooxml.js'

/**
 * Extract ordered image assets from a DOCX package.
 * `includeBytes` controls whether `contentBase64` is populated.
 */
export function extractDocxAssets(zip: ZipFile, includeBytes = false): ImageAsset[] {
	const assets: ImageAsset[] = []
	let order = 0

	const collectFrom = (partPath: string): void => {
		if (!zip.has(partPath)) return
		const rels = readRels(zip, partPath)
		const xml = zip.read(partPath).toString('utf8')
		const rIds = extractImageRIdsInOrder(xml)
		for (const rId of rIds) {
			const target = rels.get(rId)
			if (!target) continue
			const mediaPath = resolveTarget(partPath, target)
			if (!zip.has(mediaPath)) continue
			// Only count actual media entries (skip non-image rels like styles.xml).
			const ct = contentTypeForPath(mediaPath)
			if (ct === 'application/octet-stream' && !/media\//i.test(mediaPath)) continue
			order += 1
			const bytes = zip.read(mediaPath)
			assets.push({
				order,
				relId: rId,
				entryPath: mediaPath,
				filename: basename(mediaPath),
				contentType: ct,
				size: bytes.length,
				contentBase64: includeBytes ? bytes.toString('base64') : undefined,
			})
		}
	}

	// Body first, then headers/footers in part order.
	collectFrom('word/document.xml')
	const extraParts = zip.entries
		.map((e) => e.name)
		.filter((n) => /^word\/(header|footer)\d*\.xml$/i.test(n))
		.sort()
	for (const part of extraParts) collectFrom(part)

	return assets
}
