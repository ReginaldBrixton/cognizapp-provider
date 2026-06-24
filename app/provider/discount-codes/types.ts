export type DiscountCodeRow = {
	id: string
	code: string
	label?: string
	discountPercent?: number
	maxRedemptions?: number
	redemptionCount?: number
	status?: string
	expiresAt?: string
	redemptions?: Array<{
		id: string
		email?: string
		fullName?: string
		finalAmount?: number
		discountAmount?: number
		redeemedAt?: string
		status?: string
	}>
}
