const privateBackendUrl = process.env.BACKEND_URL?.trim()
const usersServiceUrl = process.env.USERS_URL?.trim()
const publicBackendUrl = process.env.NEXT_PUBLIC_BACKEND_URL?.trim()
const publicBackendProductionUrl =
	process.env.NEXT_PUBLIC_BACKEND_PRODUCTION_URL?.trim()
const publicUsersApiUrl =
	process.env.NEXT_PUBLIC_USERS_API_URL?.trim() ||
	process.env.NEXT_PUBLIC_USERS_URL?.trim()
const productionUsersBackendUrl = 'https://cognizap-users.vercel.app'
const configuredBackendUrl =
	process.env.NODE_ENV === 'production'
		? privateBackendUrl ||
			usersServiceUrl ||
			publicBackendProductionUrl ||
			publicUsersApiUrl ||
			productionUsersBackendUrl
		: privateBackendUrl || usersServiceUrl || publicBackendUrl || publicUsersApiUrl

const isLocalBackendUrl = Boolean(
	configuredBackendUrl?.match(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i),
)

export const BACKEND_URL =
	configuredBackendUrl &&
	!(process.env.NODE_ENV === 'production' && isLocalBackendUrl)
		? configuredBackendUrl
		: process.env.NODE_ENV === 'production'
			? publicBackendProductionUrl ||
				usersServiceUrl ||
				publicUsersApiUrl ||
				productionUsersBackendUrl
			: 'http://localhost:4040'
