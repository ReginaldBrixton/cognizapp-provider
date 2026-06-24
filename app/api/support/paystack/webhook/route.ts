import { NextRequest } from 'next/server'

import { forwardPaystackWebhook } from '@/app/api/_lib/paystack-webhook'

export async function POST(request: NextRequest) {
	return forwardPaystackWebhook(request, '/api/support/paystack/webhook')
}
