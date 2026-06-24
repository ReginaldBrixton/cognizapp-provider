import type { Metadata } from 'next'
import { type ReactNode } from 'react'

export const metadata: Metadata = {
	title: {
		template: '%s - CognizApp Provider',
		default: 'Authentication - CognizApp Provider',
	},
	description: 'Secure authentication for CognizApp provider portal',
	robots: {
		index: false,
		follow: false,
	},
}

export default function AuthLayout({ children }: { children: ReactNode }) {
	return <>{children}</>
}
