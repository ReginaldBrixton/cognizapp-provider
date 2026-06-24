'use client'

import { useQuery } from '@tanstack/react-query'
import type { SupportRequest } from '@/types/support'

export type SupportDashboardStats = {
	totalRequests: number
	activeRequests: number
	unpaidRequests: number
	recentActivityCount: number
	draftRequests: number
	completedRequests: number
	averageResponseHours: number
}

export type SupportDashboardMessage = {
	id: string
	threadId: string
	content: string
	senderRole: string
	type?: string
	requestId?: string
	createdAt: string
}

export function useSupportDashboard() {
	return useQuery({
		queryKey: ['support', 'dashboard'],
		queryFn: async () => {
			const response = await fetch('/api/support/client/dashboard-stats')
			if (!response.ok) {
				throw new Error('Failed to load support dashboard')
			}
			const json = await response.json()
			return {
				stats: json.data?.stats as SupportDashboardStats,
				recentRequests: (json.data?.recentRequests || []) as SupportRequest[],
				recentMessages: (json.data?.recentMessages || []) as SupportDashboardMessage[],
			}
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	})
}
