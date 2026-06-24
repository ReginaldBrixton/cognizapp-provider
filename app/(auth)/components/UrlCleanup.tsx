'use client'

import { useEffect } from 'react'

// Removes sensitive auth query/hash params left in the URL (e.g., code, access_token)
// after OAuth flows complete. Safe no-op if nothing to clean.
export function UrlCleanup() {
	useEffect(() => {
		if (typeof window === 'undefined') return

		const url = new URL(window.location.href)
		const params = url.searchParams
		const removeKeys = [
			'code',
			'access_token',
			'refresh_token',
			'token',
			'error',
			'error_description',
		]

		let changed = false
		for (const key of removeKeys) {
			if (params.has(key)) {
				params.delete(key)
				changed = true
			}
		}

		// Strip hash fragments that may contain tokens
		if (url.hash) {
			url.hash = ''
			changed = true
		}

		if (changed) {
			const cleanUrl = `${url.pathname}${params.toString() ? `?${params.toString()}` : ''}`
			window.history.replaceState(null, '', cleanUrl)
		}
	}, [])

	return null
}
