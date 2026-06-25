'use client'

import { useEffect, useState } from 'react'
import { LayoutList, Columns, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ViewMode = 'list' | 'split' | 'detail'

interface ViewToggleProps {
	viewMode: ViewMode
	onChange: (mode: ViewMode) => void
	storageKey: string
	className?: string
}

const STORAGE_PREFIX = 'provider:view:'

export function ViewToggle({
	viewMode,
	onChange,
	storageKey,
	className,
}: ViewToggleProps) {
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		setMounted(true)
		const saved = localStorage.getItem(`${STORAGE_PREFIX}${storageKey}`)
		if (
			saved &&
			(saved === 'list' || saved === 'split' || saved === 'detail')
		) {
			onChange(saved as ViewMode)
		}
	}, [storageKey, onChange])

	const handleViewChange = (mode: ViewMode) => {
		onChange(mode)
		localStorage.setItem(`${STORAGE_PREFIX}${storageKey}`, mode)
	}

	if (!mounted) return null

	return (
		<div
			className={cn(
				'flex items-center gap-1 rounded-lg border border-slate-200 dark:border-border p-1 dark:border-slate-800',
				className,
			)}
		>
			<Button
				type='button'
				variant={viewMode === 'list' ? 'default' : 'ghost'}
				size='sm'
				onClick={() => handleViewChange('list')}
				className='h-8 px-2'
				title='List View'
			>
				<LayoutList className='h-4 w-4' />
			</Button>
			<Button
				type='button'
				variant={viewMode === 'split' ? 'default' : 'ghost'}
				size='sm'
				onClick={() => handleViewChange('split')}
				className='h-8 px-2'
				title='Split View'
			>
				<Columns className='h-4 w-4' />
			</Button>
			<Button
				type='button'
				variant={viewMode === 'detail' ? 'default' : 'ghost'}
				size='sm'
				onClick={() => handleViewChange('detail')}
				className='h-8 px-2'
				title='Detail View'
			>
				<Maximize2 className='h-4 w-4' />
			</Button>
		</div>
	)
}
