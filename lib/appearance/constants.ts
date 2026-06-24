/**
 * Appearance Constants
 * Font and color mappings for the Consistent Interface System
 * Requirements: 1.4, 2.1, 2.2, 4.1
 */

import type { AccentColor, FontFamily, FontSize } from './types'

/**
 * Font size mapping with base pixel values and scale factors
 * Requirements: 1.4, 2.2
 */
export const FONT_SIZE_MAP: Record<FontSize, { base: number; scale: number }> =
	{
		small: { base: 14, scale: 0.875 },
		medium: { base: 16, scale: 1 },
		large: { base: 18, scale: 1.125 },
		xl: { base: 20, scale: 1.25 },
	}

/**
 * Font family CSS values
 * Requirements: 2.1
 */
export const FONT_FAMILY_MAP: Record<FontFamily, string> = {
	inter: "'Inter', sans-serif",
	roboto: "'Roboto', sans-serif",
	system:
		"system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
	lato: "'Lato', sans-serif",
	montserrat: "'Montserrat', sans-serif",
}

/**
 * Accent color palettes for light and dark themes
 * Requirements: 4.1
 */
export const ACCENT_COLORS: Record<
	AccentColor,
	{ light: string; dark: string }
> = {
	monochrome: { light: '#171717', dark: '#f5f5f5' },
	blue: { light: '#3B82F6', dark: '#60A5FA' },
	purple: { light: '#8B5CF6', dark: '#A78BFA' },
	green: { light: '#10B981', dark: '#34D399' },
	orange: { light: '#F97316', dark: '#FB923C' },
	pink: { light: '#EC4899', dark: '#F472B6' },
	red: { light: '#EF4444', dark: '#F87171' },
}

/** CSS variable names for fonts */
export const CSS_VAR_FONT_FAMILY = '--font-family'
export const CSS_VAR_FONT_SIZE_BASE = '--font-size-base'
export const CSS_VAR_FONT_SIZE_SM = '--font-size-sm'
export const CSS_VAR_FONT_SIZE_LG = '--font-size-lg'
export const CSS_VAR_FONT_SIZE_XL = '--font-size-xl'

/** CSS variable names for colors */
export const CSS_VAR_COLOR_BACKGROUND = '--color-background'
export const CSS_VAR_COLOR_FOREGROUND = '--color-foreground'
export const CSS_VAR_COLOR_PRIMARY = '--color-primary'
export const CSS_VAR_COLOR_PRIMARY_FOREGROUND = '--color-primary-foreground'
export const CSS_VAR_COLOR_MUTED = '--color-muted'
export const CSS_VAR_COLOR_MUTED_FOREGROUND = '--color-muted-foreground'
export const CSS_VAR_COLOR_ACCENT = '--color-accent'
export const CSS_VAR_COLOR_ACCENT_FOREGROUND = '--color-accent-foreground'
export const CSS_VAR_COLOR_BORDER = '--color-border'

/** CSS variable name for spacing */
export const CSS_VAR_SPACING_UNIT = '--spacing-unit'

/** All CSS variable names grouped by category */
export const CSS_VARIABLES = {
	font: {
		family: CSS_VAR_FONT_FAMILY,
		sizeBase: CSS_VAR_FONT_SIZE_BASE,
		sizeSm: CSS_VAR_FONT_SIZE_SM,
		sizeLg: CSS_VAR_FONT_SIZE_LG,
		sizeXl: CSS_VAR_FONT_SIZE_XL,
	},
	color: {
		background: CSS_VAR_COLOR_BACKGROUND,
		foreground: CSS_VAR_COLOR_FOREGROUND,
		primary: CSS_VAR_COLOR_PRIMARY,
		primaryForeground: CSS_VAR_COLOR_PRIMARY_FOREGROUND,
		muted: CSS_VAR_COLOR_MUTED,
		mutedForeground: CSS_VAR_COLOR_MUTED_FOREGROUND,
		accent: CSS_VAR_COLOR_ACCENT,
		accentForeground: CSS_VAR_COLOR_ACCENT_FOREGROUND,
		border: CSS_VAR_COLOR_BORDER,
	},
	spacing: {
		unit: CSS_VAR_SPACING_UNIT,
	},
} as const

/** Available font family options for UI selectors */
export const FONT_FAMILY_OPTIONS: { value: FontFamily; label: string }[] = [
	{ value: 'inter', label: 'Inter' },
	{ value: 'roboto', label: 'Roboto' },
	{ value: 'system', label: 'System Default' },
	{ value: 'lato', label: 'Lato' },
	{ value: 'montserrat', label: 'Montserrat' },
]

/** Available font size options for UI selectors */
export const FONT_SIZE_OPTIONS: {
	value: FontSize
	label: string
	description: string
}[] = [
	{ value: 'small', label: 'Small', description: '14px base' },
	{ value: 'medium', label: 'Medium', description: '16px base' },
	{ value: 'large', label: 'Large', description: '18px base' },
	{ value: 'xl', label: 'Extra Large', description: '20px base' },
]

/** Available accent color options for UI selectors */
export const ACCENT_COLOR_OPTIONS: { value: AccentColor; label: string }[] = [
	{ value: 'monochrome', label: 'Monochrome' },
	{ value: 'blue', label: 'Blue' },
	{ value: 'purple', label: 'Purple' },
	{ value: 'green', label: 'Green' },
	{ value: 'orange', label: 'Orange' },
	{ value: 'pink', label: 'Pink' },
	{ value: 'red', label: 'Red' },
]
