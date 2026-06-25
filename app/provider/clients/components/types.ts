export interface ClientSummary {
	clientUid: string
	email: string
	fullName?: string
	institution?: string
	referralCode?: string
	totalRequests: number
	totalOrders: number
	totalSpent: number
	lastActivityAt: string
	tags: string[]
}
