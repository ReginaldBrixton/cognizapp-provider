/**
 * XLSX image extraction.
 *
 * An XLSX is a ZIP with `xl/worksheets/sheetN.xml` parts and matching
 * `xl/worksheets/_rels/sheetN.xml.rels`. Images are anchored via
 * `<xdr:pic>` / `<a:blip r:embed="rIdN"/>` inside drawing parts, but the rels
 * on the sheet itself also list image targets. We walk sheets in numeric order
 * and resolve image relationships in the order they appear in each sheet's rels.
 *
 * XLSX images are far less common than DOCX/PPTX, but the parity check still
 * benefits from a deterministic count + order.
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

/** Extract ordered image assets from an XLSX package (sheet order). */
export function extractXlsxAssets(zip: ZipFile, includeBytes = false): ImageAsset[] {
	const assets: ImageAsset[] = []
	let order = 0

	const sheetPaths = zip.entries
		.map((e) => e.name)
		.filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/i.test(n))
		.sort((a, b) => {
			const na = parseInt(a.replace(/^xl\/worksheets\/sheet(\d+)\.xml$/i, '$1'), 10)
			const nb = parseInt(b.replace(/^xl\/worksheets\/sheet(\d+)\.xml$/i, '$1'), 10)
			return na - nb
		})

	for (const sheetPath of sheetPaths) {
		// Sheet rels point at drawing parts (and sometimes directly at media).
		const sheetRels = readRels(zip, sheetPath)
		const sheetXml = zip.has(sheetPath) ? zip.read(sheetPath).toString('utf8') : ''
		const rIds = extractImageRIdsInOrder(sheetXml)

		// Resolve each rId: if it points at a drawing part, walk that drawing's
		// rels for the actual media; if it points directly at media, use it.
		for (const rId of rIds) {
			const target = sheetRels.get(rId)
			if (!target) continue
			const resolved = resolveTarget(sheetPath, target)
			const isDrawing = /drawing\d+\.xml$/i.test(resolved)
			const drawingRels = isDrawing ? readRels(zip, resolved) : null
			if (drawingRels) {
				const drawingXml = zip.has(resolved) ? zip.read(resolved).toString('utf8') : ''
				const drawingRIds = extractImageRIdsInOrder(drawingXml)
				for (const dRid of drawingRIds) {
					const mediaTarget = drawingRels.get(dRid)
					if (!mediaTarget) continue
					const mediaPath = resolveTarget(resolved, mediaTarget)
					if (!zip.has(mediaPath)) continue
					order += 1
					const bytes = zip.read(mediaPath)
					assets.push({
						order,
						relId: dRid,
						entryPath: mediaPath,
						filename: basename(mediaPath),
						contentType: contentTypeForPath(mediaPath),
						size: bytes.length,
						contentBase64: includeBytes ? bytes.toString('base64') : undefined,
					})
				}
			} else if (zip.has(resolved) && /media\//i.test(resolved)) {
				order += 1
				const bytes = zip.read(resolved)
				assets.push({
					order,
					relId: rId,
					entryPath: resolved,
					filename: basename(resolved),
					contentType: contentTypeForPath(resolved),
					size: bytes.length,
					contentBase64: includeBytes ? bytes.toString('base64') : undefined,
				})
			}
		}
	}

	return assets
}
