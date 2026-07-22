/**
 * Minimal STORE-only ZIP writer for test fixtures only.
 *
 * Test-only — NOT used at runtime. Produces a valid ZIP that the production
 * zip-reader can parse, so we can synthesize DOCX/PPTX/XLSX packages with
 * known media entries without adding a dependency.
 */

// CRC32 table (standard polynomial 0xEDB88320).
const CRC_TABLE = (() => {
	const t = new Uint32Array(256)
	for (let n = 0; n < 256; n++) {
		let c = n
		for (let k = 0; k < 8; k++) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
		}
		t[n] = c >>> 0
	}
	return t
})()

function crc32(buf) {
	let c = 0xffffffff
	for (let i = 0; i < buf.length; i++) {
		c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)
	}
	return (c ^ 0xffffffff) >>> 0
}

function u16(n) {
	const b = Buffer.alloc(2)
	b.writeUInt16LE(n, 0)
	return b
}
function u32(n) {
	const b = Buffer.alloc(4)
	b.writeUInt32LE(n, 0)
	return b
}

/**
 * Build a ZIP from a map of entry path → Buffer (STORE / no compression).
 */
export function writeZip(entries) {
	const localParts = []
	const central = []
	let offset = 0
	const entryList = [...entries] // entries is a Map; materialize for count + iteration

	for (const [name, data] of entryList) {
		const nameBuf = Buffer.from(name, 'utf8')
		const crc = crc32(data)
		// Local file header
		const local = Buffer.concat([
			u32(0x04034b50), // signature
			u16(20), // version needed
			u16(0), // flags
			u16(0), // method = STORE
			u16(0), u16(0), // mod time, mod date
			u32(crc), // crc32
			u32(data.length), // compressed size
			u32(data.length), // uncompressed size
			u16(nameBuf.length),
			u16(0), // extra length
			nameBuf,
			data,
		])
		localParts.push(local)

		// Central directory entry
		const cd = Buffer.concat([
			u32(0x02014b50), // signature
			u16(20), // version made by
			u16(20), // version needed
			u16(0), // flags
			u16(0), // method
			u16(0), u16(0), // mod time, date
			u32(crc),
			u32(data.length),
			u32(data.length),
			u16(nameBuf.length),
			u16(0), // extra
			u16(0), // comment
			u16(0), // disk number start
			u16(0), // internal attrs
			u32(0), // external attrs
			u32(offset), // local header offset
			nameBuf,
		])
		central.push(cd)
		offset += local.length
	}

	const centralBuf = Buffer.concat(central)
	const eocd = Buffer.concat([
		u32(0x06054b50), // EOCD signature
		u16(0), // disk number
		u16(0), // disk with CD
		u16(entryList.length), // entries this disk
		u16(entryList.length), // total entries
		u32(centralBuf.length),
		u32(offset), // CD offset
		u16(0), // comment length
	])

	return Buffer.concat([...localParts, centralBuf, eocd])
}

/** 1x1 PNG (67 bytes) — a valid PNG fixture. */
export const TINY_PNG = Buffer.from(
	'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0wAAAABJRU5ErkJggg==',
	'base64',
)

/** 1x1 JPEG fixture. */
export const TINY_JPEG = Buffer.from(
	'/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFxDKBhUhEjQjMkFyFRY3CTJlRkNWo0QFz+MFE3OyQkOEh8SEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQ/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChQkdNUkZRVVdYSFJZU0RCU0pWVlFVWfdYaGBkSllKUU1RWFFVWfdYaGBkSllKUU1RWFFVWf/2gAIAQEAAT8A/wD/AB//2Q==',
	'base64',
)

/**
 * Build a minimal DOCX ZIP with the given media entries and a document.xml
 * that references them as `<a:blip r:embed="rIdN"/>` in order.
 *
 * @param {string[]} mediaPaths e.g. ['word/media/image1.png', 'word/media/image2.png']
 */
export function buildDocx(mediaPaths) {
	const relsEntries = mediaPaths.map((p, i) => {
		const rId = `rId${i + 1}`
		const target = p.replace(/^word\//, '')
		return `  <Relationship Id="${rId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="${target}"/>`
	})
	const relsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${relsEntries.join('\n')}
</Relationships>`

	const blips = mediaPaths
		.map((_, i) => `<a:blip r:embed="rId${i + 1}"/>`)
		.join('')
	const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>
    <w:p><w:r><w:drawing>${blips}</w:drawing></w:r></w:p>
  </w:body>
</w:document>`

	const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="jpeg" ContentType="image/jpeg"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`

	const entries = new Map([
		['[Content_Types].xml', Buffer.from(contentTypesXml)],
		['word/document.xml', Buffer.from(documentXml)],
		['word/_rels/document.xml.rels', Buffer.from(relsXml)],
	])
	for (const p of mediaPaths) {
		entries.set(p, p.endsWith('.png') ? TINY_PNG : TINY_JPEG)
	}
	return writeZip(entries)
}
