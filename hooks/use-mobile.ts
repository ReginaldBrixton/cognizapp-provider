'use client'

import { useEffect, useState } from 'react'

export function useIsMobile(breakpoint: number = 768): boolean {
	const [isMobile, setIsMobile] = useState(() => {
		if (typeof window === 'undefined') return false
		return window.innerWidth < breakpoint
	})

	useEffect(() => {
		const handleResize = () => {
			setIsMobile(window.innerWidth < breakpoint)
		}

		handleResize()
		window.addEventListener('resize', handleResize)
		return () => window.removeEventListener('resize', handleResize)
	}, [breakpoint])

	return isMobile
}
