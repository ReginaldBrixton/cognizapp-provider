import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'

import '@/styles/globals.css'
import { AppProviders } from '@/components/providers'

// ============================================
// LOCAL FONT REGISTRATIONS
// Using next/font/local for optimal performance
// ============================================

const inter = localFont({
	src: [
		{ path: '../fonts/Inter.ttf', weight: '100 900', style: 'normal' },
		{ path: '../fonts/Inter-Italic.ttf', weight: '100 900', style: 'italic' },
	],
	variable: '--font-inter',
	display: 'swap',
	preload: true,
})

const montserrat = localFont({
	src: [
		{ path: '../fonts/Montserrat.ttf', weight: '100 900', style: 'normal' },
		{
			path: '../fonts/Montserrat-Italic.ttf',
			weight: '100 900',
			style: 'italic',
		},
	],
	variable: '--font-montserrat',
	display: 'swap',
	preload: true,
})

const lato = localFont({
	src: [
		{ path: '../fonts/Lato-Light.ttf', weight: '300', style: 'normal' },
		{ path: '../fonts/Lato-Regular.ttf', weight: '400', style: 'normal' },
		{ path: '../fonts/Lato-Black.ttf', weight: '900', style: 'normal' },
	],
	variable: '--font-lato',
	display: 'swap',
})

const raleway = localFont({
	src: [
		{ path: '../fonts/Raleway.ttf', weight: '100 900', style: 'normal' },
		{ path: '../fonts/Raleway-Italic.ttf', weight: '100 900', style: 'italic' },
	],
	variable: '--font-raleway',
	display: 'swap',
})

const robotoFlex = localFont({
	src: [
		{ path: '../fonts/RobotoFlex.ttf', weight: '100 900', style: 'normal' },
	],
	variable: '--font-roboto-flex',
	display: 'swap',
})

// Combine all font variables
const fontVariables = [
	inter.variable,
	montserrat.variable,
	lato.variable,
	raleway.variable,
	robotoFlex.variable,
].join(' ')

// ============================================
// THEME SCRIPT (prevents white flash)
// This runs before React hydrates
// ============================================
const themeScript = `
(function() {
  try {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      var cached = null;
      try {
        cached = JSON.parse(localStorage.getItem('cognizap_appearance_settings') || 'null');
      } catch (_) {
        cached = null;
      }
      var theme = (cached && cached.theme) || localStorage.getItem('theme') || 'system';
      var systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var isDark = theme === 'dark' || (!theme && systemDark) || (theme === 'system' && systemDark);
      document.documentElement.classList.toggle('dark', isDark);
      if (cached) {
        var fontMap = {
          inter: 'var(--font-inter), system-ui, sans-serif',
          montserrat: 'var(--font-montserrat), system-ui, sans-serif',
          lato: 'var(--font-lato), system-ui, sans-serif',
          roboto: 'var(--font-roboto-flex), system-ui, sans-serif',
          system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
        };
        var fontScale = {
          small: { base: '14px', sm: '13px', lg: '16px', xl: '18px' },
          medium: { base: '16px', sm: '14px', lg: '18px', xl: '20px' },
          large: { base: '18px', sm: '16px', lg: '20px', xl: '22px' },
          xl: { base: '20px', sm: '18px', lg: '22px', xl: '24px' }
        };
        var accentMap = {
          monochrome: { color: '#171717', foreground: '#ffffff', rgb: '23, 23, 23' },
          blue: { color: '#2563eb', foreground: '#ffffff', rgb: '37, 99, 235' },
          purple: { color: '#7c3aed', foreground: '#ffffff', rgb: '124, 58, 237' },
          green: { color: '#059669', foreground: '#ffffff', rgb: '5, 150, 105' },
          orange: { color: '#ea580c', foreground: '#ffffff', rgb: '234, 88, 12' },
          pink: { color: '#db2777', foreground: '#ffffff', rgb: '219, 39, 119' },
          red: { color: '#dc2626', foreground: '#ffffff', rgb: '220, 38, 38' }
        };
        var scale = fontScale[cached.fontSize || 'medium'] || fontScale.medium;
        var accent = accentMap[cached.accentColor || 'monochrome'] || accentMap.monochrome;
        document.documentElement.style.setProperty('--font-family', fontMap[cached.fontFamily || 'inter'] || fontMap.inter);
        document.documentElement.style.setProperty('--font-size-base', scale.base);
        document.documentElement.style.setProperty('--font-size-sm', scale.sm);
        document.documentElement.style.setProperty('--font-size-lg', scale.lg);
        document.documentElement.style.setProperty('--font-size-xl', scale.xl);
        document.documentElement.style.setProperty('--color-accent', accent.color);
        document.documentElement.style.setProperty('--color-accent-foreground', accent.foreground);
        document.documentElement.style.setProperty('--ios-blue', accent.rgb);
        document.documentElement.style.setProperty('--ios-blue-light', accent.rgb);
      }
    }
  } catch (e) {
    console.error('[Theme] Error setting theme:', e);
  }
})();
`

export const metadata: Metadata = {
	metadataBase: new URL('https://www.cognizapp.com'),
	title: 'CognizApp Provider',
	description: 'CognizApp provider portal.',
	applicationName: 'CognizApp Provider',
	appleWebApp: {
		capable: true,
		statusBarStyle: 'default',
		title: 'CognizApp Provider',
	},
	formatDetection: {
		telephone: false,
	},
	manifest: '/manifest.json',
	icons: {
		icon: '/favicon.ico',
		apple: '/images/icon-512.png',
	},
}

export const viewport: Viewport = {
	themeColor: [
		{ media: '(prefers-color-scheme: dark)', color: '#020617' },
		{ media: '(prefers-color-scheme: light)', color: '#fafafa' },
	],
}

// Force HMR update 2
export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html
			lang='en'
			id='root-html'
			className={fontVariables}
			suppressHydrationWarning
		>
			<head>
				{/* Inline script to set theme before React hydrates - prevents flash.
				    Use a plain <script> tag here, not Next.js <Script> component.
				    Next.js Script with strategy='beforeInteractive' inside <head> in
				    App Router RSC layouts triggers a React warning in Next.js 15+. */}
				<script
					id='theme-init'
					dangerouslySetInnerHTML={{ __html: themeScript }}
				/>
			</head>
			<body id='root-body' className='font-sans antialiased'>
				<AppProviders>{children}</AppProviders>
			</body>
		</html>
	)
}
