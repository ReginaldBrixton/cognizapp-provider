/**
 * CSS Variable Generator Utility
 * Generates CSS custom properties from AppearanceSettings
 * Requirements: 1.1, 1.3
 */

import type { AppearanceSettings, ThemeMode } from './types'
import {
	ACCENT_COLORS,
	CSS_VAR_COLOR_ACCENT,
	CSS_VAR_COLOR_ACCENT_FOREGROUND,
	CSS_VAR_COLOR_BACKGROUND,
	CSS_VAR_COLOR_BORDER,
	CSS_VAR_COLOR_FOREGROUND,
	CSS_VAR_COLOR_MUTED,
	CSS_VAR_COLOR_MUTED_FOREGROUND,
	CSS_VAR_COLOR_PRIMARY,
	CSS_VAR_COLOR_PRIMARY_FOREGROUND,
	CSS_VAR_FONT_FAMILY,
	CSS_VAR_FONT_SIZE_BASE,
	CSS_VAR_FONT_SIZE_LG,
	CSS_VAR_FONT_SIZE_SM,
	CSS_VAR_FONT_SIZE_XL,
	CSS_VAR_SPACING_UNIT,
	FONT_FAMILY_MAP,
	FONT_SIZE_MAP,
} from './constants'

/** CSS variables object type */
export interface CSSVariables {
	[CSS_VAR_FONT_FAMILY]: string
	[CSS_VAR_FONT_SIZE_BASE]: string
	[CSS_VAR_FONT_SIZE_SM]: string
	[CSS_VAR_FONT_SIZE_LG]: string
	[CSS_VAR_FONT_SIZE_XL]: string
	[CSS_VAR_COLOR_BACKGROUND]: string
	[CSS_VAR_COLOR_FOREGROUND]: string
	[CSS_VAR_COLOR_PRIMARY]: string
	[CSS_VAR_COLOR_PRIMARY_FOREGROUND]: string
	[CSS_VAR_COLOR_MUTED]: string
	[CSS_VAR_COLOR_MUTED_FOREGROUND]: string
	[CSS_VAR_COLOR_ACCENT]: string
	[CSS_VAR_COLOR_ACCENT_FOREGROUND]: string
	[CSS_VAR_COLOR_BORDER]: string
	[CSS_VAR_SPACING_UNIT]: string
}

/** Light theme base colors */
const LIGHT_THEME_COLORS = {
	background: '#ffffff',
	foreground: '#09090b',
	primary: '#09090b',
	primaryForeground: '#ffffff',
	muted: '#f4f4f5',
	mutedForeground: '#71717a',
	border: '#e4e4e7',
}

/** Dark theme base colors */
const DARK_THEME_COLORS = {
	background: '#09090b',
	foreground: '#fafafa',
	primary: '#fafafa',
	primaryForeground: '#09090b',
	muted: '#27272a',
	mutedForeground: '#a1a1aa',
	border: '#3f3f46',
}

/**
 * Resolves the effective theme based on settings and system preference
 * @param theme - The theme mode from settings
 * @param systemPrefersDark - Whether the system prefers dark mode
 * @returns The resolved theme ('light' or 'dark')
 */
export function resolveTheme(
	theme: ThemeMode,
	systemPrefersDark: boolean = false,
): 'light' | 'dark' {
	if (theme === 'system') {
		return systemPrefersDark ? 'dark' : 'light'
	}
	return theme
}

/**
 * Generates font-related CSS variables from settings
 * @param settings - The appearance settings
 * @returns Object with font CSS variables
 */
export function generateFontVariables(
	settings: AppearanceSettings,
): Pick<
	CSSVariables,
	| typeof CSS_VAR_FONT_FAMILY
	| typeof CSS_VAR_FONT_SIZE_BASE
	| typeof CSS_VAR_FONT_SIZE_SM
	| typeof CSS_VAR_FONT_SIZE_LG
	| typeof CSS_VAR_FONT_SIZE_XL
> {
	const fontFamily = FONT_FAMILY_MAP[settings.fontFamily]
	const { base } = FONT_SIZE_MAP[settings.fontSize]

	// Calculate proportional font sizes
	const sizeSm = Math.round(base * 0.875)
	const sizeLg = Math.round(base * 1.125)
	const sizeXl = Math.round(base * 1.5)

	return {
		[CSS_VAR_FONT_FAMILY]: fontFamily,
		[CSS_VAR_FONT_SIZE_BASE]: `${base}px`,
		[CSS_VAR_FONT_SIZE_SM]: `${sizeSm}px`,
		[CSS_VAR_FONT_SIZE_LG]: `${sizeLg}px`,
		[CSS_VAR_FONT_SIZE_XL]: `${sizeXl}px`,
	}
}

/**
 * Generates color-related CSS variables from settings
 * @param settings - The appearance settings
 * @param resolvedTheme - The resolved theme ('light' or 'dark')
 * @returns Object with color CSS variables
 */
export function generateColorVariables(
	settings: AppearanceSettings,
	resolvedTheme: 'light' | 'dark',
): Pick<
	CSSVariables,
	| typeof CSS_VAR_COLOR_BACKGROUND
	| typeof CSS_VAR_COLOR_FOREGROUND
	| typeof CSS_VAR_COLOR_PRIMARY
	| typeof CSS_VAR_COLOR_PRIMARY_FOREGROUND
	| typeof CSS_VAR_COLOR_MUTED
	| typeof CSS_VAR_COLOR_MUTED_FOREGROUND
	| typeof CSS_VAR_COLOR_ACCENT
	| typeof CSS_VAR_COLOR_ACCENT_FOREGROUND
	| typeof CSS_VAR_COLOR_BORDER
> {
	const themeColors =
		resolvedTheme === 'dark' ? DARK_THEME_COLORS : LIGHT_THEME_COLORS

	// Safely get accent color with fallback to monochrome if not found
	const accentColorKey =
		settings.accentColor in ACCENT_COLORS ? settings.accentColor : 'monochrome'
	const accentColor = ACCENT_COLORS[accentColorKey][resolvedTheme]
	const accentForeground = resolvedTheme === 'dark' ? '#09090b' : '#ffffff'

	const isMonochrome = accentColorKey === 'monochrome'
	let finalColors = { ...themeColors }

	if (!isMonochrome) {
		if (resolvedTheme === 'light') {
			finalColors = {
				background: mixColors(accentColor, '#ffffff', 0.03), // 3% accent tint
				foreground: mixColors(accentColor, '#09090b', 0.15), // 15% accent tint on black
				primary: accentColor, // Use accent for primary elements
				primaryForeground: '#ffffff',
				muted: mixColors(accentColor, '#ffffff', 0.08), // 8% accent tint
				mutedForeground: mixColors(accentColor, '#71717a', 0.25), // 25% accent tint
				border: mixColors(accentColor, '#e4e4e7', 0.18), // 18% accent tint
			}
		} else {
			finalColors = {
				background: mixColors(accentColor, '#040405', 0.04), // 4% accent tint on black
				foreground: mixColors(accentColor, '#fafafa', 0.15), // 15% accent tint on near-white
				primary: accentColor, // Use accent for primary elements
				primaryForeground: '#09090b',
				muted: mixColors(accentColor, '#27272a', 0.12), // 12% accent tint
				mutedForeground: mixColors(accentColor, '#a1a1aa', 0.3), // 30% accent tint
				border: mixColors(accentColor, '#3f3f46', 0.22), // 22% accent tint
			}
		}
	}

	return {
		[CSS_VAR_COLOR_BACKGROUND]: finalColors.background,
		[CSS_VAR_COLOR_FOREGROUND]: finalColors.foreground,
		[CSS_VAR_COLOR_PRIMARY]: finalColors.primary,
		[CSS_VAR_COLOR_PRIMARY_FOREGROUND]: finalColors.primaryForeground,
		[CSS_VAR_COLOR_MUTED]: finalColors.muted,
		[CSS_VAR_COLOR_MUTED_FOREGROUND]: finalColors.mutedForeground,
		[CSS_VAR_COLOR_ACCENT]: accentColor,
		[CSS_VAR_COLOR_ACCENT_FOREGROUND]: accentForeground,
		[CSS_VAR_COLOR_BORDER]: finalColors.border,
	}
}

/**
 * Mix two hex colors
 * @param color1 - First color in hex format
 * @param color2 - Second color in hex format  
 * @param ratio - Mix ratio (0-1, where 0 is all color2, 1 is all color1)
 * @returns Mixed color in hex format
 */
function mixColors(color1: string, color2: string, ratio: number): string {
	const hex = (c: string) => {
		const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(c)
		return result
			? {
					r: Number.parseInt(result[1], 16),
					g: Number.parseInt(result[2], 16),
					b: Number.parseInt(result[3], 16),
				}
			: { r: 0, g: 0, b: 0 }
	}

	const c1 = hex(color1)
	const c2 = hex(color2)

	const r = Math.round(c1.r * ratio + c2.r * (1 - ratio))
	const g = Math.round(c1.g * ratio + c2.g * (1 - ratio))
	const b = Math.round(c1.b * ratio + c2.b * (1 - ratio))

	return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Convert hex color to Tailwind HSL space-separated representation (H S% L%)
 * @param hex - Color in hex format
 * @returns HSL space-separated representation
 */
function hexToHslSpace(hex: string): string {
	const cleanHex = hex.replace(/^#/, '')
	const r = Number.parseInt(cleanHex.substring(0, 2), 16) / 255
	const g = Number.parseInt(cleanHex.substring(2, 4), 16) / 255
	const b = Number.parseInt(cleanHex.substring(4, 6), 16) / 255

	const max = Math.max(r, g, b)
	const min = Math.min(r, g, b)
	let h = 0
	let s = 0
	const l = (max + min) / 2

	if (max !== min) {
		const d = max - min
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
		switch (max) {
			case r:
				h = (g - b) / d + (g < b ? 6 : 0)
				break
			case g:
				h = (b - r) / d + 2
				break
			case b:
				h = (r - g) / d + 4
				break
		}
		h /= 6
	}

	return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

/**
 * Generates spacing CSS variables from settings
 * @param settings - The appearance settings
 * @returns Object with spacing CSS variables
 */
export function generateSpacingVariables(
	settings: AppearanceSettings,
): Pick<CSSVariables, typeof CSS_VAR_SPACING_UNIT> {
	const { base } = FONT_SIZE_MAP[settings.fontSize]
	// Spacing unit is derived from font size (0.25rem equivalent)
	const spacingUnit = Math.round(base * 0.25)

	return {
		[CSS_VAR_SPACING_UNIT]: `${spacingUnit}px`,
	}
}

/**
 * Generates all CSS variables from appearance settings
 * @param settings - The appearance settings
 * @param systemPrefersDark - Whether the system prefers dark mode (for 'system' theme)
 * @returns Complete CSS variables object
 */
export function generateCSSVariables(
	settings: AppearanceSettings,
	systemPrefersDark: boolean = false,
): CSSVariables {
	const resolvedTheme = resolveTheme(settings.theme, systemPrefersDark)

	return {
		...generateFontVariables(settings),
		...generateColorVariables(settings, resolvedTheme),
		...generateSpacingVariables(settings),
	}
}

/**
 * Applies CSS variables to a target element (typically document.documentElement)
 * @param element - The target HTML element
 * @param variables - The CSS variables to apply
 */
export function applyCSSVariables(
	element: HTMLElement,
	variables: CSSVariables,
): void {
	Object.entries(variables).forEach(([property, value]) => {
		element.style.setProperty(property, value)
	})

	const accent = variables[CSS_VAR_COLOR_ACCENT]
	const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(accent)
	if (match) {
		const rgb = match
			.slice(1)
			.map((part) => Number.parseInt(part, 16))
			.join(', ')
		element.style.setProperty('--ios-blue', rgb)
		element.style.setProperty('--ios-blue-light', rgb)
	}

	// Detect if it is dark theme based on primary foreground color
	const isDark = variables[CSS_VAR_COLOR_PRIMARY_FOREGROUND] !== '#ffffff'

	// Determine if the current theme uses monochrome accent
	const isMonochrome = accent === '#171717' || accent === '#fafafa' || accent === '#09090b'

	// Card backgrounds
	const cardHex = isMonochrome
		? (isDark ? '#09090b' : '#ffffff')
		: (isDark ? mixColors(accent, '#09090b', 0.07) : '#ffffff')

	// Generate Tailwind-compatible HSL variables
	const tailwindMappings: Record<string, string> = {
		'--background': variables[CSS_VAR_COLOR_BACKGROUND],
		'--foreground': variables[CSS_VAR_COLOR_FOREGROUND],
		'--primary': variables[CSS_VAR_COLOR_PRIMARY],
		'--primary-foreground': variables[CSS_VAR_COLOR_PRIMARY_FOREGROUND],
		'--muted': variables[CSS_VAR_COLOR_MUTED],
		'--muted-foreground': variables[CSS_VAR_COLOR_MUTED_FOREGROUND],
		'--accent': variables[CSS_VAR_COLOR_MUTED], // Use muted color for accent backgrounds (like hover states)
		'--accent-foreground': variables[CSS_VAR_COLOR_FOREGROUND],
		'--border': variables[CSS_VAR_COLOR_BORDER],
		'--card': cardHex,
		'--card-foreground': variables[CSS_VAR_COLOR_FOREGROUND],
		'--popover': cardHex,
		'--popover-foreground': variables[CSS_VAR_COLOR_FOREGROUND],
		'--input': variables[CSS_VAR_COLOR_BORDER],
		'--ring': variables[CSS_VAR_COLOR_PRIMARY],
	}

	Object.entries(tailwindMappings).forEach(([property, hexValue]) => {
		if (hexValue && hexValue.startsWith('#')) {
			try {
				const hslValue = hexToHslSpace(hexValue)
				element.style.setProperty(property, hslValue)
			} catch (e) {
				console.warn(`[applyCSSVariables] Failed to convert ${hexValue} to HSL`, e)
			}
		}
	})
}

/**
 * Removes CSS variables from a target element
 * @param element - The target HTML element
 * @param variables - The CSS variables to remove
 */
export function removeCSSVariables(
	element: HTMLElement,
	variables: CSSVariables,
): void {
	Object.keys(variables).forEach((property) => {
		element.style.removeProperty(property)
	})
}

/** List of all required CSS variable names for validation */
export const REQUIRED_CSS_VARIABLES = [
	CSS_VAR_FONT_FAMILY,
	CSS_VAR_FONT_SIZE_BASE,
	CSS_VAR_FONT_SIZE_SM,
	CSS_VAR_FONT_SIZE_LG,
	CSS_VAR_FONT_SIZE_XL,
	CSS_VAR_COLOR_BACKGROUND,
	CSS_VAR_COLOR_FOREGROUND,
	CSS_VAR_COLOR_PRIMARY,
	CSS_VAR_COLOR_PRIMARY_FOREGROUND,
	CSS_VAR_COLOR_MUTED,
	CSS_VAR_COLOR_MUTED_FOREGROUND,
	CSS_VAR_COLOR_ACCENT,
	CSS_VAR_COLOR_ACCENT_FOREGROUND,
	CSS_VAR_COLOR_BORDER,
	CSS_VAR_SPACING_UNIT,
] as const

/**
 * Validates that all required CSS variables are present
 * @param variables - The CSS variables object to validate
 * @returns True if all required variables are present and non-empty
 */
export function validateCSSVariables(variables: CSSVariables): boolean {
	return REQUIRED_CSS_VARIABLES.every(
		(varName) =>
			varName in variables && variables[varName as keyof CSSVariables] !== '',
	)
}
