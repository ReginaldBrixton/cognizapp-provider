/**
 * Centralised status configuration for request and payment statuses.
 *
 * Previously each component defined its own `statusConfig` / `paymentDotColors`
 * maps. Centralising them here ensures consistent colours and labels across
 * the inbox, dashboard, and detail views.
 */

export interface StatusStyle {
	/** Tailwind class for the status dot */
	dot: string
	/** Human-readable label (already formatted) */
	label?: string
}

// ── Request statuses ────────────────────────────────────────────────────────

export const REQUEST_STATUS_CONFIG: Record<string, StatusStyle> = {
	draft: { dot: 'bg-slate-400', label: 'Draft' },
	submitted: { dot: 'bg-blue-500', label: 'Submitted' },
	payment_pending: { dot: 'bg-amber-500', label: 'Payment Pending' },
	quoted: { dot: 'bg-amber-500', label: 'Quoted' },
	accepted: { dot: 'bg-green-500', label: 'Accepted' },
	deposit_pending_verification: { dot: 'bg-orange-500', label: 'Deposit Pending' },
	deposit_paid: { dot: 'bg-emerald-500', label: 'Deposit Paid' },
	in_progress: { dot: 'bg-blue-600', label: 'In Progress' },
	work_ready: { dot: 'bg-indigo-500', label: 'Work Ready' },
	completed: { dot: 'bg-green-600', label: 'Completed' },
	cancelled: { dot: 'bg-red-500', label: 'Cancelled' },
}

export function getRequestStatus(status: string): StatusStyle {
	return REQUEST_STATUS_CONFIG[status] ?? { dot: 'bg-slate-400', label: formatLabel(status) }
}

// ── Payment statuses ────────────────────────────────────────────────────────

export const PAYMENT_STATUS_CONFIG: Record<string, StatusStyle> = {
	pending: { dot: 'bg-slate-400', label: 'Pending' },
	deposit_required: { dot: 'bg-amber-400', label: 'Deposit Required' },
	deposit_pending_verification: { dot: 'bg-orange-400', label: 'Deposit Pending' },
	deposit_paid: { dot: 'bg-blue-500', label: 'Deposit Paid' },
	final_payment_required: { dot: 'bg-rose-500', label: 'Final Payment Due' },
	paid: { dot: 'bg-green-500', label: 'Paid' },
}

export function getPaymentStatus(status?: string): StatusStyle | null {
	if (!status) return null
	return PAYMENT_STATUS_CONFIG[status] ?? { dot: 'bg-slate-400', label: formatLabel(status) }
}

// ── Discount code statuses ──────────────────────────────────────────────────

export interface DiscountStatusStyle extends StatusStyle {
	text: string
}

export function getDiscountStatus(
	status?: string,
	expiresAt?: string,
	isExhausted?: boolean,
): DiscountStatusStyle {
	if (expiresAt && isExpired(expiresAt)) {
		return { dot: 'bg-slate-400', label: 'Expired', text: 'text-slate-500' }
	}
	if (isExhausted) {
		return { dot: 'bg-red-400', label: 'Used Up', text: 'text-red-600' }
	}
	if (status === 'inactive') {
		return { dot: 'bg-slate-400', label: 'Inactive', text: 'text-slate-500' }
	}
	return { dot: 'bg-emerald-500', label: 'Active', text: 'text-emerald-700' }
}

// ── Deadline urgency ─────────────────────────────────────────────────────────

export interface DeadlineInfo {
	label: string
	urgent: boolean
	overdue: boolean
	color: string
	dot: string
	bg: string
}

export function getDeadlineInfo(deadline?: string | null): DeadlineInfo {
	if (!deadline) {
		return {
			label: 'No deadline',
			urgent: false,
			overdue: false,
			color: 'text-slate-400',
			dot: 'bg-slate-300',
			bg: 'bg-slate-50',
		}
	}
	const date = new Date(deadline)
	if (Number.isNaN(date.getTime())) {
		return {
			label: '—',
			urgent: false,
			overdue: false,
			color: 'text-slate-400',
			dot: 'bg-slate-300',
			bg: 'bg-slate-50',
		}
	}
	const hours = (date.getTime() - Date.now()) / 3_600_000
	if (hours < 0) {
		return { label: 'Overdue', urgent: true, overdue: true, color: 'text-red-600', dot: 'bg-red-500', bg: 'bg-red-50' }
	}
	if (hours < 24) {
		return { label: 'Due today', urgent: true, overdue: false, color: 'text-red-600', dot: 'bg-red-400', bg: 'bg-red-50' }
	}
	if (hours < 48) {
		return { label: 'Due tomorrow', urgent: true, overdue: false, color: 'text-orange-600', dot: 'bg-orange-400', bg: 'bg-orange-50' }
	}
	if (hours < 168) {
		return { label: 'This week', urgent: false, overdue: false, color: 'text-amber-600', dot: 'bg-amber-400', bg: 'bg-amber-50' }
	}
	return {
		label: formatRelativeTime(deadline),
		urgent: false,
		overdue: false,
		color: 'text-slate-500',
		dot: 'bg-slate-300',
		bg: 'bg-slate-50',
	}
}

// ── Activity event styles ───────────────────────────────────────────────────

export interface EventStyle {
	icon: 'payment' | 'message' | 'order' | 'quote' | 'refund' | 'revision' | 'ai' | 'client' | 'default'
	color: string
	bg: string
}

export function getEventStyle(type: string): EventStyle {
	if (type.includes('payment')) return { icon: 'payment', color: 'text-emerald-600', bg: 'bg-emerald-50' }
	if (type.includes('message') || type.includes('chat')) return { icon: 'message', color: 'text-blue-600', bg: 'bg-blue-50' }
	if (type.includes('order') || type.includes('delivery')) return { icon: 'order', color: 'text-amber-600', bg: 'bg-amber-50' }
	if (type.includes('quote')) return { icon: 'quote', color: 'text-indigo-600', bg: 'bg-indigo-50' }
	if (type.includes('refund')) return { icon: 'refund', color: 'text-rose-600', bg: 'bg-rose-50' }
	if (type.includes('revision')) return { icon: 'revision', color: 'text-orange-600', bg: 'bg-orange-50' }
	if (type.includes('ai')) return { icon: 'ai', color: 'text-violet-600', bg: 'bg-violet-50' }
	if (type.includes('client') || type.includes('user')) return { icon: 'client', color: 'text-cyan-600', bg: 'bg-cyan-50' }
	return { icon: 'default', color: 'text-slate-500', bg: 'bg-slate-100' }
}

// ── Imports needed by this file ─────────────────────────────────────────────

import { formatLabel, formatRelativeTime, isExpired } from './format'
