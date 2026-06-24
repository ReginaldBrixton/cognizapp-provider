import { NextResponse } from 'next/server'
import { clearAuthCookies } from '@/app/api/_lib/auth-session'

export async function POST() {
	return clearAuthCookies(NextResponse.json({ success: true }))
}
