/**
 * Safe area utilities for handling device notches and home indicators.
 *
 * These utilities provide consistent safe area handling across the admin
 * and provider portals, ensuring content doesn't overlap with system UI
 * elements on mobile devices.
 */

/**
 * Gets the safe area inset for the bottom of the screen.
 * This handles the home indicator on iOS devices and similar UI elements.
 */
export function getSafeAreaBottom(): string {
	return 'env(safe-area-inset-bottom, 0px)'
}

/**
 * Gets the safe area inset for the top of the screen.
 * This handles notches and status bars on mobile devices.
 */
export function getSafeAreaTop(): string {
	return 'env(safe-area-inset-top, 0px)'
}

/**
 * CSS class for bottom padding that accounts for safe area.
 * Use this for content that sits above the mobile navigation bar.
 */
export const safeAreaBottomPadding = 'pb-[calc(4.75rem+env(safe-area-inset-bottom,0px))]'

/**
 * CSS class for bottom padding in modal/sheet contexts.
 * Use this for bottom sheets and modals on mobile.
 */
export const safeAreaBottomPaddingModal = 'pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))]'

/**
 * CSS class for mobile navigation safe area.
 * Use this for the mobile navigation bar container.
 */
export const safeAreaMobileNav = 'pb-mobile-nav-safe'

/**
 * Generates a bottom padding value with custom base padding plus safe area.
 *
 * @param basePadding - The base padding in CSS units (e.g., '1rem', '20px')
 * @returns CSS calc expression combining base padding with safe area
 *
 * @example
 * ```tsx
 * <div style={{ paddingBottom: getBottomPaddingWithBase('1rem') }} />
 * ```
 */
export function getBottomPaddingWithBase(basePadding: string): string {
	return `calc(${basePadding} + ${getSafeAreaBottom()})`
}

/**
 * Generates a top padding value with custom base padding plus safe area.
 *
 * @param basePadding - The base padding in CSS units (e.g., '1rem', '20px')
 * @returns CSS calc expression combining base padding with safe area
 *
 * @example
 * ```tsx
 * <div style={{ paddingTop: getTopPaddingWithBase('1rem') }} />
 * ```
 */
export function getTopPaddingWithBase(basePadding: string): string {
	return `calc(${basePadding} + ${getSafeAreaTop()})`
}
