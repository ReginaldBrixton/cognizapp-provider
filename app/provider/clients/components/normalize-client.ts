import type { ClientSummary } from './types'

export function normalizeClient(row: Record<string, unknown>): ClientSummary | null {
	const clientUid = String(row.clientUid ?? row.userKeyId ?? row.userId ?? row.id ?? '').trim()
	const email = String(row.email ?? '').trim()
	if (!clientUid && !email) return null
	return {
		clientUid: clientUid || email,
		email,
		fullName: String(row.fullName ?? row.full_name ?? ''),
		institution: String(row.institution ?? ''),
		referralCode: String(row.referralCode ?? row.referral_code ?? ''),
		totalRequests: Number(row.totalRequests ?? row.requestCount ?? row.request_count ?? 0) || 0,
		totalOrders: Number(row.totalOrders ?? row.total_orders ?? 0) || 0,
		totalSpent: Number(row.totalSpent ?? row.total_spent ?? row.lifetimeValue ?? 0) || 0,
		lastActivityAt: String(row.lastActivityAt ?? row.updatedAt ?? row.createdAt ?? ''),
		tags: Array.isArray(row.tags)
			? (row.tags as string[])
			: [
				row.institution ? String(row.institution) : '',
				row.referralCode ? `Ref: ${row.referralCode}` : '',
			].filter(Boolean),
	}
}
