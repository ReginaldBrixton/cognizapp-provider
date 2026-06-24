/**
 * CognizApp API - Main Export
 *
 * This is the primary entry point for all CognizApp API services.
 * Import from '@/lib/api' for all backend interactions.
 */

// Main comprehensive API
export * from './cognizap'

// Legacy auth API (for backward compatibility)
export * from './auth'

// Default export
export { default } from './cognizap'
