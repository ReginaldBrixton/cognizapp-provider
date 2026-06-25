import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/lib/server/auth-session'

export async function POST() {
	return clearAuthCookies(NextResponse.json({ success: true }))
}
