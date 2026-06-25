/**
 * Shared formatting utilities used across the provider portal.
 *
 * Centralising these here eliminates the duplicate `fmtDate`, `formatMoney`,
 * and `formatLabel` helpers that were previously scattered across feature
 * folders.
 */

import { formatDistanceToNow } from 'date-fns'

/**
 * Format a date string as e.g. "Jan 5, 2025".
 * Returns a fallback when the value is missing or invalid.
 */
export function formatDate(value?: string | null, fallback = '—'): string {
	if (!value) return fallback
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return fallback
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
	}).format(date)
}

/**
 * Format a date string as e.g. "Jan 5, 2025, 2:30 PM".
 */
export function formatDateTime(value?: string | null, fallback = '—'): string {
	if (!value) return fallback
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return fallback
	return new Intl.DateTimeFormat(undefined, {
		month: 'short',
		day: 'numeric',
		year: 'numeric',
		hour: 'numeric',
		minute: '2-digit',
	}).format(date)
}

/**
 * Relative time formatting, e.g. "3 hours ago".
 */
export function formatRelativeTime(value?: string | null, fallback = ''): string {
	if (!value) return fallback
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return fallback
	return formatDistanceToNow(date, { addSuffix: true })
}

/**
 * Format a monetary amount with currency, e.g. "GHS 1,250".
 */
export function formatMoney(amount?: number | null, currency = 'GHS'): string {
	return `${currency} ${Number(amount ?? 0).toLocaleString()}`
}

/**
 * Convert an ISO string to the value expected by `<input type="datetime-local">`,
 * i.e. `YYYY-MM-DDTHH:MM` in the user's local timezone.
 */
export function toDateTimeInputValue(value?: string | null): string {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	// getTimezoneOffset is in minutes; convert to milliseconds and adjust
	const adjusted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
	return adjusted.toISOString().slice(0, 16)
}

/**
 * Convert an ISO string to the value expected by `<input type="date">`,
 * i.e. `YYYY-MM-DD`.
 */
export function toDateInputValue(value?: string | null): string {
	if (!value) return ''
	const date = new Date(value)
	if (Number.isNaN(date.getTime())) return ''
	return date.toISOString().slice(0, 10)
}

/**
 * Check whether a date string is in the past.
 */
export function isExpired(value?: string | null): boolean {
	if (!value) return false
	return new Date(value).getTime() < Date.now()
}

/**
 * Convert a snake_case or kebab-case string to "Title Case" for display.
 */
export function formatLabel(value: string): string {
	return value
		.split(/[_-]/)
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
		.join(' ')
}

/**
 * Compute initials from a name, e.g. "John Doe" → "JD".
 */
export function getInitials(name: string): string {
	return (
		name
			.split(' ')
			.filter(Boolean)
			.map((part) => part[0])
			.join('')
			.toUpperCase()
			.slice(0, 2) || '??'
	)
}

/**
 * Hours until a deadline. Negative = overdue.
 */
export function hoursUntil(deadline?: string | null): number | null {
	if (!deadline) return null
	const date = new Date(deadline)
	if (Number.isNaN(date.getTime())) return null
	return (date.getTime() - Date.now()) / 3_600_000
}
