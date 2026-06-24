import { render, screen } from '@testing-library/react'
import { DashboardStats } from '../DashboardStats'

describe('DashboardStats', () => {
	it('renders provider dashboard stats from the backend payload shape', () => {
		render(
			<DashboardStats
				stats={{
					totalRequests: 10,
					openRequests: 4,
					convertedRequests: 2,
					messageThreads: 7,
					referrals: 1,
				}}
			/>,
		)

		expect(screen.getByLabelText('Total: 10')).toBeInTheDocument()
		expect(screen.getByLabelText('Open: 4')).toBeInTheDocument()
		expect(screen.getByLabelText('Threads: 7')).toBeInTheDocument()
		expect(screen.getByLabelText('Referrals: 1')).toBeInTheDocument()
		expect(screen.getByLabelText('Conversion: 20%')).toBeInTheDocument()
	})

	it('renders safe zero values when stats are missing', () => {
		render(<DashboardStats stats={null} />)

		expect(screen.getByLabelText('Total: 0')).toBeInTheDocument()
		expect(screen.getAllByText('0').length).toBeGreaterThan(0)
		expect(screen.getByLabelText('Conversion: 0%')).toBeInTheDocument()
	})
})
