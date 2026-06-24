/**
 * Appearance Module
 * Centralized exports for the Consistent Interface System
 */

// Types
export type {
	AccentColor,
	AppearanceContextValue,
	AppearanceSettings,
	FontFamily,
	FontSize,
	GetAppearanceResponse,
	ThemeMode,
	UpdateAppearanceRequest,
	UpdateAppearanceResponse,
} from './types'

export type { CSSVariables } from './css-variables'

// Default settings
export { DEFAULT_SETTINGS } from './types'

// Constants
export {
	ACCENT_COLOR_OPTIONS,
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
	CSS_VARIABLES,
	FONT_FAMILY_MAP,
	FONT_FAMILY_OPTIONS,
	FONT_SIZE_MAP,
	FONT_SIZE_OPTIONS,
} from './constants'

// CSS Variable utilities
export {
	applyCSSVariables,
	generateColorVariables,
	generateCSSVariables,
	generateFontVariables,
	generateSpacingVariables,
	removeCSSVariables,
	REQUIRED_CSS_VARIABLES,
	resolveTheme,
	validateCSSVariables,
} from './css-variables'
