'use client'

import { motion } from 'framer-motion'
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AuthCardModernProps {
	children: ReactNode
	className?: string
}

export function AuthCardModern({ children, className }: AuthCardModernProps) {
	return (
		<motion.div
			initial={{ opacity: 0, scale: 0.98 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
			className={cn(
				'w-full',
				'rounded-2xl',
				'bg-white dark:bg-[#121212]',
				'border border-zinc-200 dark:border-zinc-800',
				'shadow-sm',
				'p-6 sm:p-8',
				className,
			)}
		>
			{children}
		</motion.div>
	)
}
