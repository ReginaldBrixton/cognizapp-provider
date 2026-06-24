/**
 * Property-Based Tests for CSS Variable System
 *
 * **Feature: consistent-interface-system**
 *
 * Tests validate that the CSS variable generator produces complete and consistent
 * output for all valid appearance settings combinations.
 */

import * as fc from 'fast-check'
import type {
	AccentColor,
	AppearanceSettings,
	FontFamily,
	FontSize,
	ThemeMode,
} from '../types'
import {
	generateCSSVariables,
	generateColorVariables,
	generateFontVariables,
	REQUIRED_CSS_VARIABLES,
	resolveTheme,
	validateCSSVariables,
} from '../css-variables'
import { ACCENT_COLORS, FONT_SIZE_MAP } from '../constants'

// Arbitraries for generating valid appearance settings
const fontFamilyArb = fc.constantFrom<FontFamily>(
	'inter',
	'roboto',
	'system',
	'lato',
	'montserrat',
)

const fontSizeArb = fc.constantFrom<FontSize>('small', 'medium', 'large', 'xl')

const accentColorArb = fc.constantFrom<AccentColor>(
	'monochrome',
	'blue',
	'purple',
	'green',
	'orange',
	'pink',
	'red',
)

const themeModeArb = fc.constantFrom<ThemeMode>('light', 'dark', 'system')

const appearanceSettingsArb = fc.record<AppearanceSettings>({
	theme: themeModeArb,
	fontFamily: fontFamilyArb,
	fontSize: fontSizeArb,
	accentColor: accentColorArb,
})

describe('CSS Variable System - Property Tests', () => {
	/**
	 * Property 5: Theme Color Consistency
	 *
	 * *For any* theme selection (light or dark), all color variables should be defined
	 * and form a consistent palette (background contrasts with foreground, accent is visible on both).
	 *
	 * **Validates: Requirements 1.3**
	 */
	describe('Property 5: Theme Color Consistency', () => {
		it('all color variables are defined for any theme and accent color combination', () => {
			fc.assert(
				fc.property(
					appearanceSettingsArb,
					fc.boolean(), // systemPrefersDark
					(settings, systemPrefersDark) => {
						const variables = generateCSSVariables(settings, systemPrefersDark)

						// All required CSS variables must be present
						expect(validateCSSVariables(variables)).toBe(true)

						// All color variables must be valid hex colors or CSS values
						const colorVars = [
							'--color-background',
							'--color-foreground',
							'--color-primary',
							'--color-primary-foreground',
							'--color-muted',
							'--color-muted-foreground',
							'--color-accent',
							'--color-accent-foreground',
							'--color-border',
						] as const

						for (const varName of colorVars) {
							const value = variables[varName]
							expect(value).toBeDefined()
							expect(value.length).toBeGreaterThan(0)
							// Should be a valid hex color
							expect(value).toMatch(/^#[0-9A-Fa-f]{6}$/)
						}

						return true
					},
				),
				{ numRuns: 20 },
			)
		})

		it('accent color matches the selected accent for the resolved theme', () => {
			fc.assert(
				fc.property(
					appearanceSettingsArb,
					fc.boolean(),
					(settings, systemPrefersDark) => {
						const resolvedTheme = resolveTheme(
							settings.theme,
							systemPrefersDark,
						)
						const variables = generateCSSVariables(settings, systemPrefersDark)

						// The accent color should match the expected value from ACCENT_COLORS
						const expectedAccent =
							ACCENT_COLORS[settings.accentColor][resolvedTheme]
						expect(variables['--color-accent']).toBe(expectedAccent)

						return true
					},
				),
				{ numRuns: 20 },
			)
		})

		it('light and dark themes produce different background/foreground colors', () => {
			fc.assert(
				fc.property(
					fontFamilyArb,
					fontSizeArb,
					accentColorArb,
					(fontFamily, fontSize, accentColor) => {
						const lightSettings: AppearanceSettings = {
							theme: 'light',
							fontFamily,
							fontSize,
							accentColor,
						}
						const darkSettings: AppearanceSettings = {
							theme: 'dark',
							fontFamily,
							fontSize,
							accentColor,
						}

						const lightVars = generateCSSVariables(lightSettings, false)
						const darkVars = generateCSSVariables(darkSettings, false)

						// Background and foreground should be different between themes
						expect(lightVars['--color-background']).not.toBe(
							darkVars['--color-background'],
						)
						expect(lightVars['--color-foreground']).not.toBe(
							darkVars['--color-foreground'],
						)

						return true
					},
				),
				{ numRuns: 20 },
			)
		})

		it('system theme resolves correctly based on system preference', () => {
			fc.assert(
				fc.property(
					fontFamilyArb,
					fontSizeArb,
					accentColorArb,
					fc.boolean(),
					(fontFamily, fontSize, accentColor, systemPrefersDark) => {
						const systemSettings: AppearanceSettings = {
							theme: 'system',
							fontFamily,
							fontSize,
							accentColor,
						}

						const explicitSettings: AppearanceSettings = {
							theme: systemPrefersDark ? 'dark' : 'light',
							fontFamily,
							fontSize,
							accentColor,
						}

						const systemVars = generateCSSVariables(
							systemSettings,
							systemPrefersDark,
						)
						const explicitVars = generateCSSVariables(explicitSettings, false)

						// System theme should produce same colors as explicit theme
						expect(systemVars['--color-background']).toBe(
							explicitVars['--color-background'],
						)
						expect(systemVars['--color-foreground']).toBe(
							explicitVars['--color-foreground'],
						)

						return true
					},
				),
				{ numRuns: 20 },
			)
		})
	})

	/**
	 * Property 6: Font Size Proportionality
	 *
	 * *For any* font size setting, the derived sizes (sm, base, lg, xl) should maintain
	 * consistent proportional relationships.
	 *
	 * **Validates: Requirements 1.4**
	 */
	describe('Property 6: Font Size Proportionality', () => {
		it('derived font sizes maintain proportional relationships', () => {
			fc.assert(
				fc.property(appearanceSettingsArb, (settings) => {
					const variables = generateCSSVariables(settings, false)

					// Extract numeric values from font size CSS variables
					const parseSize = (value: string): number =>
						parseInt(value.replace('px', ''), 10)

					const basePx = parseSize(variables['--font-size-base'])
					const smPx = parseSize(variables['--font-size-sm'])
					const lgPx = parseSize(variables['--font-size-lg'])
					const xlPx = parseSize(variables['--font-size-xl'])

					// Verify proportional relationships: sm < base < lg < xl
					expect(smPx).toBeLessThan(basePx)
					expect(basePx).toBeLessThan(lgPx)
					expect(lgPx).toBeLessThan(xlPx)

					// Verify base matches expected value from FONT_SIZE_MAP
					const expectedBase = FONT_SIZE_MAP[settings.fontSize].base
					expect(basePx).toBe(expectedBase)

					return true
				}),
				{ numRuns: 20 },
			)
		})

		it('font sizes are always positive integers', () => {
			fc.assert(
				fc.property(appearanceSettingsArb, (settings) => {
					const variables = generateCSSVariables(settings, false)

					const fontSizeVars = [
						'--font-size-base',
						'--font-size-sm',
						'--font-size-lg',
						'--font-size-xl',
					] as const

					for (const varName of fontSizeVars) {
						const value = variables[varName]
						// Should end with 'px'
						expect(value).toMatch(/^\d+px$/)
						// Should be a positive integer
						const numValue = parseInt(value.replace('px', ''), 10)
						expect(numValue).toBeGreaterThan(0)
						expect(Number.isInteger(numValue)).toBe(true)
					}

					return true
				}),
				{ numRuns: 20 },
			)
		})

		it('font family is correctly mapped from settings', () => {
			fc.assert(
				fc.property(appearanceSettingsArb, (settings) => {
					const variables = generateCSSVariables(settings, false)
					const fontFamily = variables['--font-family']

					// Font family should be non-empty
					expect(fontFamily.length).toBeGreaterThan(0)

					// Should contain the expected font name or 'system-ui' for system font
					if (settings.fontFamily === 'system') {
						expect(fontFamily).toContain('system-ui')
					} else {
						const expectedFontName =
							settings.fontFamily.charAt(0).toUpperCase() +
							settings.fontFamily.slice(1)
						expect(fontFamily).toContain(expectedFontName)
					}

					return true
				}),
				{ numRuns: 20 },
			)
		})
	})
})
