'use client'

/**
 * AppearanceProvider
 * Central React context provider for appearance settings
 * Requirements: 1.2, 2.3, 3.2, 4.2
 */

import {
	createContext,
	useCallback,
	useEffect,
	useMemo,
	useState,
	type ReactNode,
} from 'react'
import { useTheme } from 'next-themes'
import {
	type AppearanceContextValue,
	type AppearanceSettings,
	applyCSSVariables,
	DEFAULT_SETTINGS,
	generateCSSVariables,
} from '@/lib/appearance'
import { useSession } from '@/components/providers/SessionProvider'

/** Context for appearance settings - undefined when not within provider */
export const AppearanceContext = createContext<
	AppearanceContextValue | undefined
>(undefined)

interface AppearanceProviderProps {
	children: ReactNode
}

const APPEARANCE_STORAGE_KEY = 'cognizap_appearance_settings'

/**
 * Transform backend snake_case fields to frontend camelCase
 */
function transformBackendAppearance(data: any): AppearanceSettings {
	if (!data) return DEFAULT_SETTINGS
	return {
		theme: data.theme || DEFAULT_SETTINGS.theme,
		fontFamily:
			data.font_family || data.fontFamily || DEFAULT_SETTINGS.fontFamily,
		fontSize: data.font_size || data.fontSize || DEFAULT_SETTINGS.fontSize,
		accentColor:
			data.accent_color || data.accentColor || DEFAULT_SETTINGS.accentColor,
	}
}

function sanitizeAppearanceSettings(
	data: Partial<AppearanceSettings> | null | undefined,
): AppearanceSettings {
	return {
		theme:
			data?.theme === 'light' ||
				data?.theme === 'dark' ||
				data?.theme === 'system'
				? data.theme
				: DEFAULT_SETTINGS.theme,
		fontFamily:
			data?.fontFamily === 'inter' ||
				data?.fontFamily === 'roboto' ||
				data?.fontFamily === 'system' ||
				data?.fontFamily === 'lato' ||
				data?.fontFamily === 'montserrat'
				? data.fontFamily
				: DEFAULT_SETTINGS.fontFamily,
		fontSize:
			data?.fontSize === 'small' ||
				data?.fontSize === 'medium' ||
				data?.fontSize === 'large' ||
				data?.fontSize === 'xl'
				? data.fontSize
				: DEFAULT_SETTINGS.fontSize,
		accentColor:
			data?.accentColor === 'monochrome' ||
				data?.accentColor === 'blue' ||
				data?.accentColor === 'purple' ||
				data?.accentColor === 'green' ||
				data?.accentColor === 'orange' ||
				data?.accentColor === 'pink' ||
				data?.accentColor === 'red'
				? data.accentColor
				: DEFAULT_SETTINGS.accentColor,
	}
}

function loadCachedAppearanceSettings(): AppearanceSettings | null {
	if (typeof window === 'undefined') return null

	try {
		const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY)
		if (!raw) return null
		return sanitizeAppearanceSettings(JSON.parse(raw))
	} catch (error) {
		console.warn('[AppearanceProvider] Failed to read cached settings', error)
		return null
	}
}

function persistAppearanceSettings(settings: AppearanceSettings) {
	if (typeof window === 'undefined') return

	try {
		window.localStorage.setItem(
			APPEARANCE_STORAGE_KEY,
			JSON.stringify(settings),
		)
	} catch (error) {
		console.warn('[AppearanceProvider] Failed to persist settings cache', error)
	}
}

/**
 * AppearanceProvider component
 * Manages appearance state and applies CSS variables to document root
 */
export function AppearanceProvider({ children }: AppearanceProviderProps) {
	const [settings, setSettings] = useState<AppearanceSettings>(
		() => loadCachedAppearanceSettings() || DEFAULT_SETTINGS,
	)
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const { resolvedTheme, setTheme } = useTheme()
	const { status } = useSession()

	// Determine if system prefers dark mode
	const systemPrefersDark = resolvedTheme === 'dark'

	/**
	 * Apply CSS variables to document root whenever settings change
	 * Requirements: 2.3, 3.2, 4.2 - Immediate UI update on setting change
	 */
	useEffect(() => {
		if (typeof window === 'undefined') return

		const variables = generateCSSVariables(settings, systemPrefersDark)
		applyCSSVariables(document.documentElement, variables)
		persistAppearanceSettings(settings)
	}, [settings, systemPrefersDark])

	/**
	 * Sync theme setting with next-themes provider
	 * Requirements: 3.2 - Theme selection applies immediately
	 */
	useEffect(() => {
		setTheme(settings.theme)
	}, [settings.theme, setTheme])

	/**
	 * Load appearance settings from API on mount
	 * Requirements: 1.2 - Apply saved preferences automatically
	 * Only fetch when user is authenticated to avoid 401 errors
	 */
	useEffect(() => {
		const cachedSettings = loadCachedAppearanceSettings()
		if (cachedSettings) {
			setSettings(cachedSettings)
		}

		// Skip fetching if not authenticated or still loading session
		if (status !== 'authenticated') {
			setIsLoading(false)
			return
		}

		const loadSettings = async () => {
			try {
				setIsLoading(true)
				setError(null)

				const response = await fetch('/api/user/settings/appearance')

				if (!response.ok) {
					// If 404 or no settings, use defaults (new user case)
					if (response.status === 404) {
						setSettings(DEFAULT_SETTINGS)
						return
					}
					// If 401, session may have expired - use defaults silently
					if (response.status === 401) {
						setSettings(DEFAULT_SETTINGS)
						return
					}
					throw new Error('Failed to load appearance settings')
				}

				const data = await response.json()

				if (data.success && data.data) {
					// Transform snake_case backend fields to camelCase frontend fields
					const transformed = sanitizeAppearanceSettings(
						transformBackendAppearance(data.data),
					)
					setSettings(transformed)
				}
			} catch (err) {
				console.error('Error loading appearance settings:', err)
				setError(err instanceof Error ? err.message : 'Failed to load settings')
				// Keep using defaults on error
			} finally {
				setIsLoading(false)
			}
		}

		loadSettings()
	}, [status])

	/**
	 * Update appearance settings with optimistic updates
	 * Requirements: 2.3, 3.2, 4.2 - Immediate UI update
	 * Requirements: 5.3, 5.4 - Optimistic updates with error recovery
	 *
	 * Property 7: Optimistic Update with Error Recovery
	 * - Applies changes immediately (optimistic update)
	 * - Retains local changes even if API fails (per design spec)
	 * - Keeps server sync failures non-blocking so cached local settings remain usable
	 */
	const updateSettings = useCallback(
		async (partial: Partial<AppearanceSettings>): Promise<void> => {
			const newSettings = sanitizeAppearanceSettings({
				...settings,
				...partial,
			})

			// Optimistic update - apply immediately
			// Requirements: 5.4 - Use optimistic updates for immediate feedback
			setSettings(newSettings)
			setError(null)

			try {
				const response = await fetch('/api/user/settings/appearance', {
					method: 'PATCH',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(partial),
				})

				if (!response.ok) {
					const errorData = await response.json().catch(() => null)
					throw new Error(
						errorData?.error || 'Failed to save appearance settings',
					)
				}

				const data = await response.json()

				if (!data.success) {
					throw new Error(data.error || 'Failed to save settings')
				}

				// Update with server response to ensure consistency
				if (data.data) {
					const transformed = sanitizeAppearanceSettings(
						transformBackendAppearance(data.data),
					)
					setSettings(transformed)
				}
			} catch (err) {
				// Requirements: 5.3 - Retain local change when server sync fails
				// Property 7: Local state retains the attempted change on failure
				const errorMessage =
					err instanceof Error ? err.message : 'Failed to save settings'
				setError(errorMessage)
				console.warn('[AppearanceProvider] Background sync failed', err)
			}
		},
		[settings],
	)

	const contextValue = useMemo<AppearanceContextValue>(
		() => ({
			settings,
			updateSettings,
			isLoading,
			error,
		}),
		[settings, updateSettings, isLoading, error],
	)

	return (
		<AppearanceContext.Provider value={contextValue}>
			{children}
		</AppearanceContext.Provider>
	)
}
