'use client'

import { Analytics } from '@vercel/analytics/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { Suspense, useState, type ReactNode } from 'react'
import { Toaster } from 'sonner'

import { SessionProvider } from '@/components/providers/SessionProvider'
import { AppearanceProvider } from '@/components/providers/AppearanceProvider'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { UrlCleanup } from '@/app/(auth)/components/UrlCleanup'

// Error boundary to catch ChunkLoadError and similar runtime errors
class AppErrorBoundary extends React.Component<
	{ children: ReactNode },
	{ hasError: boolean; error?: Error }
> {
	constructor(props: { children: ReactNode }) {
		super(props)
		this.state = { hasError: false }
	}

	static getDerivedStateFromError(error: Error) {
		// Update state so the next render will show the fallback UI
		return { hasError: true, error }
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		console.error(
			'AppProviders Error Boundary caught an error:',
			error,
			errorInfo,
		)
		// You can also log the error to an error reporting service here
	}

	render() {
		if (this.state.hasError) {
			// Check if it's a ChunkLoadError specifically
			const isChunkError = this.state.error?.message.includes('Loading chunk')

			return (
				<div className='min-h-screen flex items-center justify-center bg-background'>
					<div className='text-center p-8'>
						<h2 className='text-2xl font-bold text-foreground mb-4'>
							{isChunkError
								? 'Failed to Load Application'
								: 'Something went wrong'}
						</h2>
						<p className='text-muted-foreground mb-6'>
							{isChunkError
								? 'A required resource failed to load. Please refresh the page.'
								: 'An unexpected error occurred. Please try again.'}
						</p>
						<button
							onClick={() => window.location.reload()}
							className='px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors'
						>
							Refresh Page
						</button>
					</div>
				</div>
			)
		}

		return this.props.children
	}
}

export default function AppProviders({ children }: { children: ReactNode }) {
	const [queryClient] = useState(
		() =>
			new QueryClient({
				defaultOptions: {
					queries: {
						staleTime: 60_000,
						retry: (failureCount, error: unknown) => {
							const status = (error as { status?: number })?.status
							if (status === 401 || status === 403) return false
							return failureCount < 2
						},
					},
				},
			}),
	)

	return (
		<AppErrorBoundary>
			<QueryClientProvider client={queryClient}>
				<ThemeProvider>
					<SessionProvider>
						<AppearanceProvider>
							<UrlCleanup />
							{children}
							<Toaster position='top-center' />
							<Suspense fallback={null}>
								<Analytics />
							</Suspense>
						</AppearanceProvider>
					</SessionProvider>
				</ThemeProvider>
			</QueryClientProvider>
		</AppErrorBoundary>
	)
}
