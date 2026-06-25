// Client-side session activity manager.
// Explicit logout is still broadcast across tabs, but inactivity no longer
// revokes an otherwise valid browser session.

export interface SessionManagerOptions {
	inactivityTimeout?: number // ms until automatic logout (default: 30 minutes)
	warningBeforeTimeout?: number // ms before timeout to trigger warning (default: 5 minutes)
	onWarning?: () => void // callback when warning should be shown
	onTimeout?: () => void // callback when session times out
	enabled?: boolean // whether session timeout is enabled (default: true)
}

export interface SessionManager {
	start(): void
	stop(): void
	onWarning(handler: () => void): void
	onTimeout(handler: () => void): void
	updateActivity(): void
	getTimeRemaining(): number
	broadcastLogout(): void
	isEnabled(): boolean
	setEnabled(enabled: boolean): void
	getConfig(): SessionManagerConfig
	resetTimer(): void
}

export interface SessionManagerConfig {
	inactivityTimeout: number
	warningBeforeTimeout: number
	enabled: boolean
}

const DEFAULT_INACTIVITY_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const DEFAULT_WARNING_BEFORE = 5 * 60 * 1000 // 5 minutes
const DEFAULT_ENABLED = false

const LOGOUT_BROADCAST_KEY = 'cognizap_auth_logout'
const SESSION_ACTIVITY_KEY = 'cognizap_session_last_activity'

class BrowserSessionManager implements SessionManager {
	private inactivityTimeout: number
	private warningBeforeTimeout: number
	private lastActivity: number
	private warned = false
	private enabled = DEFAULT_ENABLED
	private warningHandlers = new Set<() => void>()
	private timeoutHandlers = new Set<() => void>()
	private intervalId: number | null = null
	private boundActivityHandler: () => void
	private boundStorageHandler: (event: StorageEvent) => void
	private boundVisibilityHandler: () => void

	constructor(options?: SessionManagerOptions) {
		this.inactivityTimeout =
			options?.inactivityTimeout ?? DEFAULT_INACTIVITY_TIMEOUT
		this.warningBeforeTimeout =
			options?.warningBeforeTimeout ?? DEFAULT_WARNING_BEFORE
		this.enabled = options?.enabled ?? DEFAULT_ENABLED

		// Try to restore last activity from localStorage for cross-tab sync
		this.lastActivity = this.getStoredLastActivity() || Date.now()

		this.boundActivityHandler = () => this.updateActivity()
		this.boundStorageHandler = (event) => this.handleStorageEvent(event)
		this.boundVisibilityHandler = () => this.handleVisibilityChange()

		// Register initial callbacks if provided
		if (options?.onWarning) {
			this.warningHandlers.add(options.onWarning)
		}
		if (options?.onTimeout) {
			this.timeoutHandlers.add(options.onTimeout)
		}
	}

	private getStoredLastActivity(): number | null {
		if (typeof window === 'undefined') return null
		try {
			const stored = localStorage.getItem(SESSION_ACTIVITY_KEY)
			if (stored) {
				const timestamp = parseInt(stored, 10)
				if (!isNaN(timestamp)) {
					// Only use stored timestamp if it's within the timeout window
					// This prevents immediate logout from stale data
					const now = Date.now()
					const age = now - timestamp
					if (age < this.inactivityTimeout) {
						return timestamp
					}
					// Stale timestamp - clear it
					localStorage.removeItem(SESSION_ACTIVITY_KEY)
				}
			}
		} catch {
			// Ignore storage errors
		}
		return null
	}

	private storeLastActivity(): void {
		if (typeof window === 'undefined') return
		try {
			localStorage.setItem(SESSION_ACTIVITY_KEY, this.lastActivity.toString())
		} catch {
			// Ignore storage errors
		}
	}

	private handleStorageEvent(event: StorageEvent): void {
		if (event.key === LOGOUT_BROADCAST_KEY) {
			this.handleTimeout()
		} else if (event.key === SESSION_ACTIVITY_KEY && event.newValue) {
			// Sync activity across tabs
			const newActivity = parseInt(event.newValue, 10)
			if (!isNaN(newActivity) && newActivity > this.lastActivity) {
				this.lastActivity = newActivity
				this.warned = false
			}
		}
	}

	private handleVisibilityChange(): void {
		if (document.visibilityState === 'visible') {
			// When tab becomes visible, sync with stored activity
			const storedActivity = this.getStoredLastActivity()
			if (storedActivity && storedActivity > this.lastActivity) {
				this.lastActivity = storedActivity
				this.warned = false
			}
		}
	}

	start(): void {
		if (typeof window === 'undefined' || typeof document === 'undefined') return
		if (!this.enabled) return

		this.attachActivityListeners()
		this.attachStorageListener()
		this.attachVisibilityListener()

		if (this.intervalId == null) {
			this.intervalId = window.setInterval(() => this.checkTimers(), 1000)
		}
	}

	stop(): void {
		if (typeof window === 'undefined' || typeof document === 'undefined') return

		this.detachActivityListeners()
		this.detachStorageListener()
		this.detachVisibilityListener()

		if (this.intervalId != null) {
			window.clearInterval(this.intervalId)
			this.intervalId = null
		}
	}

	onWarning(handler: () => void): void {
		this.warningHandlers.add(handler)
	}

	onTimeout(handler: () => void): void {
		this.timeoutHandlers.add(handler)
	}

	updateActivity(): void {
		if (!this.enabled) return
		this.lastActivity = Date.now()
		this.warned = false
		this.storeLastActivity()
	}

	getTimeRemaining(): number {
		if (!this.enabled) return this.inactivityTimeout
		const now = Date.now()
		const elapsed = Math.max(0, now - this.lastActivity)
		const remaining = this.inactivityTimeout - elapsed
		return remaining > 0 ? remaining : 0
	}

	broadcastLogout(): void {
		if (typeof window === 'undefined') return
		try {
			window.localStorage.setItem(LOGOUT_BROADCAST_KEY, Date.now().toString())
			// Clean up activity tracking
			window.localStorage.removeItem(SESSION_ACTIVITY_KEY)
		} catch {
			// Ignore storage errors
		}
		this.handleTimeout()
	}

	isEnabled(): boolean {
		return this.enabled
	}

	setEnabled(enabled: boolean): void {
		this.enabled = enabled
		if (enabled) {
			this.resetTimer()
			this.start()
		} else {
			this.stop()
		}
	}

	getConfig(): SessionManagerConfig {
		return {
			inactivityTimeout: this.inactivityTimeout,
			warningBeforeTimeout: this.warningBeforeTimeout,
			enabled: this.enabled,
		}
	}

	resetTimer(): void {
		this.lastActivity = Date.now()
		this.warned = false
		this.storeLastActivity()
	}

	private attachActivityListeners(): void {
		window.addEventListener('mousemove', this.boundActivityHandler)
		window.addEventListener('keydown', this.boundActivityHandler)
		window.addEventListener('click', this.boundActivityHandler)
		window.addEventListener('scroll', this.boundActivityHandler)
		window.addEventListener('touchstart', this.boundActivityHandler)
	}

	private detachActivityListeners(): void {
		window.removeEventListener('mousemove', this.boundActivityHandler)
		window.removeEventListener('keydown', this.boundActivityHandler)
		window.removeEventListener('click', this.boundActivityHandler)
		window.removeEventListener('scroll', this.boundActivityHandler)
		window.removeEventListener('touchstart', this.boundActivityHandler)
	}

	private attachStorageListener(): void {
		window.addEventListener('storage', this.boundStorageHandler)
	}

	private detachStorageListener(): void {
		window.removeEventListener('storage', this.boundStorageHandler)
	}

	private attachVisibilityListener(): void {
		document.addEventListener('visibilitychange', this.boundVisibilityHandler)
	}

	private detachVisibilityListener(): void {
		document.removeEventListener(
			'visibilitychange',
			this.boundVisibilityHandler,
		)
	}

	private checkTimers(): void {
		if (!this.enabled) return

		const remaining = this.getTimeRemaining()

		if (
			!this.warned &&
			remaining <= this.warningBeforeTimeout &&
			remaining > 0
		) {
			this.warned = true
			this.warningHandlers.forEach((fn) => fn())
		}

		if (remaining === 0) {
			this.handleTimeout()
		}
	}

	private handleTimeout(): void {
		this.timeoutHandlers.forEach((fn) => fn())
	}
}

class NoopSessionManager implements SessionManager {
	start() {}
	stop() {}
	onWarning() {}
	onTimeout() {}
	updateActivity() {}
	getTimeRemaining() {
		return DEFAULT_INACTIVITY_TIMEOUT
	}
	broadcastLogout() {}
	isEnabled() {
		return DEFAULT_ENABLED
	}
	setEnabled() {}
	getConfig(): SessionManagerConfig {
		return {
			inactivityTimeout: DEFAULT_INACTIVITY_TIMEOUT,
			warningBeforeTimeout: DEFAULT_WARNING_BEFORE,
			enabled: DEFAULT_ENABLED,
		}
	}
	resetTimer() {}
}

let singleton: SessionManager | null = null

export function getSessionManager(
	options?: SessionManagerOptions,
): SessionManager {
	if (typeof window === 'undefined') {
		if (!singleton) singleton = new NoopSessionManager()
		return singleton
	}

	if (!singleton || !(singleton instanceof BrowserSessionManager)) {
		singleton = new BrowserSessionManager(options)
	}

	return singleton
}

/**
 * Reset the session manager singleton (useful for testing or reconfiguration)
 */
export function resetSessionManager(): void {
	if (singleton) {
		singleton.stop()
		singleton = null
	}
}

/**
 * Create a new session manager with custom options (does not affect singleton)
 */
export function createSessionManager(
	options?: SessionManagerOptions,
): SessionManager {
	if (typeof window === 'undefined') {
		return new NoopSessionManager()
	}
	return new BrowserSessionManager(options)
}

// Helper to format remaining time (ms) into "MM:SS" style text
export function formatTimeRemaining(ms: number): string {
	const totalSeconds = Math.max(0, Math.floor(ms / 1000))
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60

	const mm = minutes.toString().padStart(2, '0')
	const ss = seconds.toString().padStart(2, '0')
	return `${mm}:${ss}`
}
