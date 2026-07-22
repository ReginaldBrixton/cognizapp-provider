/**
 * Shared OOXML helpers for relationship + image-reference parsing.
 *
 * Uses lightweight regex parsing rather than a full XML DOM, to keep the
 * dependency surface at zero. OOXML relationship parts and image references
 * are regular enough that regex extraction is deterministic for media
 * ordering — which is all the manifest requires.
 */

import type { ZipFile } from './zip-reader.js'

/** rId → target path (relative to the rels part's directory). */
export type RelMap = Map<string, string>

/**
 * Parse a `*.rels` XML part into a map of Id → Target.
 * Targets are returned as-is (relative to the rels part's owner directory).
 */
export function parseRels(relsXml: string): RelMap {
	const map: RelMap = new Map()
	// <Relationship Id="rId1" Type="..." Target="media/image1.png"/>
	const re = /<Relationship\b[^>]*?\/>/g
	let m: RegExpExecArray | null
	while ((m = re.exec(relsXml)) !== null) {
		const tag = m[0]
		const id = attr(tag, 'Id')
		const target = attr(tag, 'Target')
		if (id && target) map.set(id, target)
	}
	return map
}

/** Read + parse a rels part for a given owner part path. */
export function readRels(zip: ZipFile, ownerPath: string): RelMap {
	// word/document.xml → word/_rels/document.xml.rels
	// ppt/slides/slide1.xml → ppt/slides/_rels/slide1.xml.rels
	const slash = ownerPath.lastIndexOf('/')
	const dir = slash >= 0 ? ownerPath.slice(0, slash) : ''
	const base = slash >= 0 ? ownerPath.slice(slash + 1) : ownerPath
	const relsPath = `${dir ? dir + '/' : ''}_rels/${base}.rels`
	if (!zip.has(relsPath)) return new Map()
	return parseRels(zip.read(relsPath).toString('utf8'))
}

/**
 * Resolve a relationship target against its owner part's directory.
 * Handles `media/image1.png` (relative) and absolute `/word/...` targets.
 */
export function resolveTarget(ownerPath: string, target: string): string {
	if (target.startsWith('/')) return target.slice(1)
	const slash = ownerPath.lastIndexOf('/')
	const dir = slash >= 0 ? ownerPath.slice(0, slash) : ''
	// Normalize `../` segments.
	const parts = (dir ? dir.split('/') : []).concat(target.split('/'))
	const out: string[] = []
	for (const part of parts) {
		if (part === '' || part === '.') continue
		if (part === '..') {
			out.pop()
			continue
		}
		out.push(part)
	}
	return out.join('/')
}

/**
 * Extract relationship IDs referenced as image embeds, in document order.
 * Matches the common OOXML image reference forms:
 *   - <a:blip r:embed="rId1"/>            (DrawingML — DOCX/PPTX/XLSX)
 *   - <v:imagedata r:id="rId1"/>          (VML fallback)
 *   - <pic:pic ...><a:blip r:embed="rId1"/>
 *   - r:embed="rId1" / r:link="rId1"      (any namespace prefix)
 */
export function extractImageRIdsInOrder(xml: string): string[] {
	const ids: string[] = []
	const seen = new Set<string>()
	// Match embed/id attributes that point at image relationships.
	const re = /\b(?:r:embed|r:link|r:id)\s*=\s*"([^"]+)"/g
	let m: RegExpExecArray | null
	while ((m = re.exec(xml)) !== null) {
		const id = m[1]
		if (!seen.has(id)) {
			seen.add(id)
			ids.push(id)
		}
	}
	return ids
}

/** Get an XML attribute value by name (case-sensitive on the attribute). */
export function attr(tag: string, name: string): string | undefined {
	const re = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, '')
	const m = re.exec(tag)
	return m ? m[1] : undefined
}

/** Infer a MIME content type from a media entry path. */
export function contentTypeForPath(path: string): string {
	const lower = path.toLowerCase()
	if (lower.endsWith('.png')) return 'image/png'
	if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg'
	if (lower.endsWith('.gif')) return 'image/gif'
	if (lower.endsWith('.bmp')) return 'image/bmp'
	if (lower.endsWith('.svg')) return 'image/svg+xml'
	if (lower.endsWith('.tif') || lower.endsWith('.tiff')) return 'image/tiff'
	if (lower.endsWith('.webp')) return 'image/webp'
	if (lower.endsWith('.emf')) return 'image/x-emf'
	if (lower.endsWith('.wmf')) return 'image/x-wmf'
	return 'application/octet-stream'
}

/** Basename of a path (`word/media/image1.png` → `image1.png`). */
export function basename(path: string): string {
	const slash = path.lastIndexOf('/')
	return slash >= 0 ? path.slice(slash + 1) : path
}
