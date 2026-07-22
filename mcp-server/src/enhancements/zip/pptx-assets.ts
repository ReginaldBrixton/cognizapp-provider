/**
 * PPTX image extraction.
 *
 * A PPTX is a ZIP with `ppt/slides/slideN.xml` parts (one per slide) and
 * matching `ppt/slides/_rels/slideN.xml.rels`. Images are referenced via
 * `<a:blip r:embed="rIdN"/>`. We walk slides in numeric order so the manifest
 * reflects presentation order.
 *
 * Slide layouts and masters are intentionally excluded — only the slides the
 * audience sees contribute to the visual asset manifest.
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

/** Extract ordered image assets from a PPTX package (slide order). */
export function extractPptxAssets(zip: ZipFile, includeBytes = false): ImageAsset[] {
	const assets: ImageAsset[] = []
	let order = 0

	const slidePaths = zip.entries
		.map((e) => e.name)
		.filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n))
		.sort((a, b) => {
			const na = parseInt(a.replace(/^ppt\/slides\/slide(\d+)\.xml$/i, '$1'), 10)
			const nb = parseInt(b.replace(/^ppt\/slides\/slide(\d+)\.xml$/i, '$1'), 10)
			return na - nb
		})

	for (const slidePath of slidePaths) {
		const rels = readRels(zip, slidePath)
		const xml = zip.read(slidePath).toString('utf8')
		const rIds = extractImageRIdsInOrder(xml)
		for (const rId of rIds) {
			const target = rels.get(rId)
			if (!target) continue
			const mediaPath = resolveTarget(slidePath, target)
			if (!zip.has(mediaPath)) continue
			order += 1
			const bytes = zip.read(mediaPath)
			assets.push({
				order,
				relId: rId,
				entryPath: mediaPath,
				filename: basename(mediaPath),
				contentType: contentTypeForPath(mediaPath),
				size: bytes.length,
				contentBase64: includeBytes ? bytes.toString('base64') : undefined,
			})
		}
	}

	return assets
}
