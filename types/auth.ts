/**
 * Authentication types for users, sessions, and identities
 */

// Identity types
export interface IdentityData {
	iss?: string
	sub?: string
	name?: string
	email?: string
	picture?: string
	full_name?: string
	avatar_url?: string
	provider_id?: string
	email_verified?: boolean
	given_name?: string
	family_name?: string
	locale?: string
}

export interface Identity {
	id: string
	user_id: string
	provider: string
	provider_uid: string
	email: string
	email_verified: boolean
	identity_data?: IdentityData
	created_at: string
	updated_at: string
	last_sign_in_at?: string
	provider_data?: Record<string, unknown>
}

export interface IdentitiesResponse {
	success: boolean
	identities: Identity[]
}

// Session types
export interface Session {
	id: string
	user_id: string
	email: string
	role: string
	created_at: string
	expires_at: string
	last_active: string
	is_revoked: boolean
	device_info: {
		name: string
		type: 'desktop' | 'mobile' | 'tablet'
		browser: string
		os: string
	}
	ip_address: string
}

export interface SessionsResponse {
	success: boolean
	sessions: Session[]
	total: number
}

// User types
export interface User {
	id: string
	email: string
	role: string
	display_name?: string
	avatar_url?: string
	email_verified: boolean
	created_at: string
	last_sign_in_at?: string

	// Backend sync fields
	account_type?: 'personal' | 'team' | 'enterprise'
	subscription_status?: 'free' | 'pro' | 'enterprise'
	onboarding_completed?: boolean
	onboarding_step?: string
	storage_used_bytes?: number
	storage_quota_bytes?: number
	last_workspace_id?: string
}

// Provider constants
export const PROVIDERS = {
	EMAIL: 'email',
} as const

export type Provider = (typeof PROVIDERS)[keyof typeof PROVIDERS]
