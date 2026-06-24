// =======================================================================
// APP VERSION
// =======================================================================
export const APP_VERSION = '0.0.19' // Semantic versioning: Major.Minor.Patch
export const IS_BETA = true
export const ADMIN_PASSWORD = 'brixtonreginald'

// =======================================================================
// API CONFIGURATION
// =======================================================================
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'

// =======================================================================
// API KEYS - Centralized for security and easy management
// =======================================================================
// ⚠️ SECURITY NOTE: In production, these should be stored in environment variables
// and accessed via process.env, not hardcoded here!

/**
 * Parallel AI - Deep Search & Task Processing
 * Used for: Deep search, task runs, events, schema suggestions
 */
export const PARALLEL_AI_API_KEY = 'V5LIasu9pAuTXhRjhEC-TMIQjnxoN5YfPk9LjxsR'

/**
 * Mistral AI - Image Generation & Chat
 * Used for: Image generation, chat completions, file operations
 */
export const MISTRAL_API_KEY = 'EaC9rqJsUjYgvFd1eT5O9FEIALsEwlF5'

/**
 * CognizApp LLM Service
 * Used for: Chat completions via CognizApp backend
 */
export const COGNIZAP_API_KEY =
	process.env.COGNIZAP_API_KEY || 'op-G2GC051BO4Y5ESHVO47S'

/**
 * Default model for CognizApp completions
 * Available Groq models: groq/compound, groq/compound-mini
 */
export const COGNIZAP_DEFAULT_MODEL = 'gemini-3.1-flash-lite'
export const COGNIZAP_PRO_MODEL = 'gemini-3.1-flash'

export const COGNIZAP_MODEL_LABELS: Record<string, string> = {
	'gemini-3.1-flash-lite': 'CognizApp Lite',
	'gemini-3.1-flash': 'CognizApp Pro',
}

export function getCognizAppModelLabel(model: string) {
	return COGNIZAP_MODEL_LABELS[model] || 'CognizApp Lite'
}

/**
 * AIAIAI Chat Service
 * Used for: Alternative chat completions
 */
export const AIAIAI_API_KEY =
	process.env.AIAIAI_API_KEY || 'sk-4f85fd9b2b034ee8879e4a063238a239'

/**
 * DeepSeek/LLM Service (via Chutes)
 * Used for: Chat completions with DeepSeek models
 */
export const LLM_API_KEY =
	process.env.LLM_API_KEY ||
	'cpk_fa0919285169401a847d9df8d2d6a51e.97ddf600ec2c5336a323c48c6992c128.KUq7sEPg6EcEklBchIUGgBKtInwTmFUU'

/**
 * Exa Search API
 * Used for: News digests and search functionality
 */
export const EXA_API_KEY =
	process.env.EXA_API_KEY || '11c7fb50-d088-4706-8c21-84435e185ebb'

// ============================================================================
// API ENDPOINTS - Centralized for consistency
// ============================================================================

/**
 * Parallel AI Endpoints
 */
export const PARALLEL_AI = {
	BASE_URL: 'https://api.parallel.ai',
	TASKS_RUNS: 'https://api.parallel.ai/v1/tasks/runs',
	TASKS_RUNS_BETA: 'https://api.parallel.ai/v1beta/tasks/runs',
	TASKS_SUGGEST: 'https://api.parallel.ai/v1beta/tasks/suggest',
} as const

/**
 * Mistral AI Endpoints
 **/
export const MISTRAL_AI = {
	BASE_URL: 'https://api.mistral.ai',
	CONVERSATIONS: 'https://api.mistral.ai/v1/conversations',
	CHAT_COMPLETIONS: 'https://api.mistral.ai/v1/chat/completions',
} as const

/**
 * LLM Provider Endpoints
 * Primary provider uses the CognizApp completion route
 * Available Groq models: groq/compound, groq/compound-mini
 */
export const LLM_PROVIDERS = {
	gemini: {
		baseUrl: `${API_BASE_URL}/api/chat/completions`,
		model: 'gemini-3.1-flash-lite',
		apiKey: COGNIZAP_API_KEY,
	},
	groq: {
		baseUrl: `${API_BASE_URL}/api/v1/completions/groq/chat`,
		model: 'groq/compound',
		apiKey: '',
	},
} as const

/**
 * N8N Webhook Endpoints
 **/
export const N8N = {
	REVIEW_WEBHOOK: 'https://selikaj394.app.n8n.cloud/webhook/review',
} as const

/**
 * Exa Search Endpoints
 **/
export const EXA_AI = {
	BASE_URL: 'https://api.exa.ai',
	SEARCH: 'https://api.exa.ai/search',
	ANSWER: 'https://api.exa.ai/answer',
	CONTENTS: 'https://api.exa.ai/contents',
	FIND_SIMILAR: 'https://api.exa.ai/findSimilar',
} as const

// ============================================================================
// INTERNAL API ROUTES (Next.js Proxies)
// ============================================================================
// These proxy external APIs to avoid CORS issues
export const INTERNAL_API = {
	PARALLEL: {
		DEEP_SEARCH: '/api/parallel/deep-search',
		TASK_STATUS: (runId: string) => `/api/parallel/task-status/${runId}`,
		TASK_RESULT: (runId: string) => `/api/parallel/task-result/${runId}`,
		TASK_EVENTS: (runId: string) => `/api/parallel/task-events/${runId}`,
	},
	MISTRAL: {
		CHAT: '/api/mistral/chat',
		IMAGE: '/api/mistral/image',
		FILE: (fileId: string) => `/api/mistral/files/${fileId}`,
		AGENTS: {
			LIST: '/api/mistral/agents',
			CREATE: '/api/mistral/agents',
			GET: (agentId: string) => `/api/mistral/agents/${agentId}`,
			UPDATE: (agentId: string) => `/api/mistral/agents/${agentId}`,
			DELETE: (agentId: string) => `/api/mistral/agents/${agentId}`,
		},
		CONVERSATIONS: {
			LIST: '/api/mistral/conversations',
			START: '/api/mistral/conversations',
			GET: (conversationId: string) =>
				`/api/mistral/conversations/${conversationId}`,
			CONTINUE: (conversationId: string) =>
				`/api/mistral/conversations/${conversationId}`,
			DELETE: (conversationId: string) =>
				`/api/mistral/conversations/${conversationId}`,
		},
	},

	LLM: '/api/llm',
	CHAT: '/api/ai/chat',
	DIGESTS: '/api/digests',
	REVIEW: {
		BASE: '/api/review',
		HEALTH: '/api/review', // GET for health check
	},
	EXA_SEARCH: '/api/exa-search', // Single endpoint, use 'endpoint' param: 'search', 'answer', 'contents', 'find-similar'
	AGENT: {
		POWERPOINT: '/api/v2/agent/powerpoint',
		PPT: '/v2/agent/ppt', // Alias for PowerPoint
		HEALTH: '/api/v2/agent/health',
	},
} as const
