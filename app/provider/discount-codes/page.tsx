import { DiscountCodesPage } from './DiscountCodesPage'
import { fetchProviderData } from '../_lib/server-data'
import type { DiscountCodeRow } from './types'

export default async function ProviderDiscountCodesPageRoute() {
	const codes =
		(await fetchProviderData<DiscountCodeRow[]>('/api/support/provider/discount-codes', {
			revalidate: 0,
		})) ?? []

	return <DiscountCodesPage initialCodes={codes} />
}
