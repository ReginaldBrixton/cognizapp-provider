import { type ReactNode } from 'react'

export function FormRow({ children }: { children: ReactNode }) {
	return <div className='space-y-1'>{children}</div>
}
