/**
 * Appearance Types and Interfaces
 * Defines the core types for the Consistent Interface System
 * Requirements: 1.1, 7.1
 */

/** Available font families for the interface */
export type FontFamily = 'inter' | 'roboto' | 'system' | 'lato' | 'montserrat'

/** Available font size options */
export type FontSize = 'small' | 'medium' | 'large' | 'xl'

/** Available accent color options */
export type AccentColor =
	| 'monochrome'
	| 'blue'
	| 'purple'
	| 'green'
	| 'orange'
	| 'pink'
	| 'red'

/** Theme mode options */
export type ThemeMode = 'light' | 'dark' | 'system'

/** Complete appearance settings for a user */
export interface AppearanceSettings {
	theme: ThemeMode
	fontFamily: FontFamily
	fontSize: FontSize
	accentColor: AccentColor
}

/** Context value provided by AppearanceProvider */
export interface AppearanceContextValue {
	settings: AppearanceSettings
	updateSettings: (partial: Partial<AppearanceSettings>) => Promise<void>
	isLoading: boolean
	error: string | null
}

/** API response for GET /api/user/settings/appearance */
export interface GetAppearanceResponse {
	success: boolean
	data: AppearanceSettings
}

/** API request body for PATCH /api/user/settings/appearance */
export interface UpdateAppearanceRequest {
	theme?: ThemeMode
	fontFamily?: FontFamily
	fontSize?: FontSize
	accentColor?: AccentColor
}

/** API response for PATCH /api/user/settings/appearance */
export interface UpdateAppearanceResponse {
	success: boolean
	data: AppearanceSettings
	error?: string
}

/** Default appearance settings for new users (Requirements: 7.1) */
export const DEFAULT_SETTINGS: AppearanceSettings = {
	theme: 'system',
	fontFamily: 'system',
	fontSize: 'medium',
	accentColor: 'monochrome',
}
