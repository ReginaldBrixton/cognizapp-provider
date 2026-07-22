/**
 * Minimal ZIP (Open Office / OOXML package) reader.
 *
 * Uses only Node built-ins (`node:zlib`) — zero new runtime dependencies.
 * Reads the End Of Central Directory record, walks the central directory,
 * and inflates each entry (DEFLATE via `inflateRawSync`, or STORE pass-through).
 *
 * This is intentionally limited to the subset required for OOXML media
 * extraction: 32-bit sizes, no ZIP64, no encryption. OOXML packages never use
 * ZIP64 for the entries we care about (media + rels + document parts).
 */

import { inflateRawSync } from 'node:zlib'

export interface ZipEntry {
	/** Entry path, e.g. `word/media/image1.png`. */
	name: string
	/** Compression method: 0 = STORE, 8 = DEFLATE. */
	method: number
	/** Compressed size from the central directory. */
	compressedSize: number
	/** Uncompressed size from the central directory. */
	uncompressedSize: number
	/** CRC32 from the central directory. */
	crc32: number
	/** Offset of the local file header. */
	localHeaderOffset: number
}

export interface ZipFile {
	entries: ZipEntry[]
	/** Read an entry's decompressed bytes. Throws if missing or unsupported. */
	read(name: string): Buffer
	/** True when an entry exists. */
	has(name: string): boolean
}

const SIG_LOCAL = 0x04034b50
const SIG_CENTRAL = 0x02014b50
const SIG_EOCD = 0x06054b50

function readU16(buf: Buffer, off: number): number {
	return buf.readUInt16LE(off)
}
function readU32(buf: Buffer, off: number): number {
	return buf.readUInt32LE(off)
}

/**
 * Parse a ZIP/OOXML package from raw bytes.
 * Throws on bad signature, missing EOCD, or unsupported compression.
 */
export function readZip(data: Buffer): ZipFile {
	if (data.length < 22) {
		throw new Error('Not a ZIP file: too short')
	}

	// Find the End Of Central Directory record by scanning from the end.
	// EOCD is 22 bytes + comment (≤65535), so scan the last 65557 bytes.
	const minEocd = Math.max(0, data.length - 65557)
	let eocd = -1
	for (let i = data.length - 22; i >= minEocd; i--) {
		if (readU32(data, i) === SIG_EOCD) {
			eocd = i
			break
		}
	}
	if (eocd < 0) {
		throw new Error('Not a ZIP file: End Of Central Directory record not found')
	}

	const cdCount = readU16(data, eocd + 10)
	const cdSize = readU32(data, eocd + 12)
	const cdOffset = readU32(data, eocd + 16)
	if (cdOffset + cdSize > data.length) {
		throw new Error('ZIP central directory points past end of file')
	}

	const entries: ZipEntry[] = []
	let p = cdOffset
	for (let i = 0; i < cdCount; i++) {
		if (p + 46 > data.length || readU32(data, p) !== SIG_CENTRAL) {
			throw new Error(`ZIP central directory entry ${i} is corrupt`)
		}
		const method = readU16(data, p + 10)
		const crc32 = readU32(data, p + 16)
		const compressedSize = readU32(data, p + 20)
		const uncompressedSize = readU32(data, p + 24)
		const nameLen = readU16(data, p + 28)
		const extraLen = readU16(data, p + 30)
		const commentLen = readU16(data, p + 32)
		const localHeaderOffset = readU32(data, p + 42)
		const name = data.subarray(p + 46, p + 46 + nameLen).toString('utf8')
		entries.push({
			name,
			method,
			compressedSize,
			uncompressedSize,
			crc32,
			localHeaderOffset,
		})
		p += 46 + nameLen + extraLen + commentLen
	}

	const byName = new Map(entries.map((e) => [e.name, e]))

	function read(name: string): Buffer {
		const entry = byName.get(name)
		if (!entry) throw new Error(`ZIP entry not found: ${name}`)
		const lh = entry.localHeaderOffset
		if (lh + 30 > data.length || readU32(data, lh) !== SIG_LOCAL) {
			throw new Error(`ZIP local header corrupt for entry: ${name}`)
		}
		const lhNameLen = readU16(data, lh + 26)
		const lhExtraLen = readU16(data, lh + 28)
		const dataStart = lh + 30 + lhNameLen + lhExtraLen
		const comp = data.subarray(dataStart, dataStart + entry.compressedSize)

		if (entry.method === 0) {
			// STORE — no compression.
			return Buffer.from(comp)
		}
		if (entry.method === 8) {
			// DEFLATE (raw, no zlib header).
			return inflateRawSync(comp)
		}
		throw new Error(`Unsupported ZIP compression method ${entry.method} for entry: ${name}`)
	}

	return {
		entries,
		read,
		has(name: string): boolean {
			return byName.has(name)
		},
	}
}
