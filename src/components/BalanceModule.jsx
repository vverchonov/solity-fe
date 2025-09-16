import { useState } from 'react'
import { useRates } from '../contexts/RatesProvider'

function BalanceModule() {
  const [topUpAmount, setTopUpAmount] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Use rates from the /current endpoint via RatesProvider
  const { rates: apiRates, isLoading: ratesLoading, error: ratesError } = useRates()

  // Use actual rates from API or fallback to empty array
  const rates = apiRates || []

  const quickAmounts = [0.1, 0.5, 1, 2]

  const handleQuickTopUp = (amount) => {
    setTopUpAmount(amount.toString())
  }


  const handleAddFunds = () => {
    console.log('Adding funds:', topUpAmount)
  }

  // Filter and search rates - adapted for new data structure
  const filteredRates = rates.filter(rate => {
    if (!searchQuery.trim()) {
      // If no search query, show active first
      return true
    }

    const query = searchQuery.toLowerCase()
    const matchesDirection = rate.direction?.toLowerCase().includes(query)
    const matchesCode = rate.codes?.toString().toLowerCase().includes(query)
    const matchesRouteName = rate.routename?.toLowerCase().includes(query)

    return matchesDirection || matchesCode || matchesRouteName
  })

  // Sort by active first (unless searching), then by cost
  const sortedRates = filteredRates.sort((a, b) => {
    // If no search query, prioritize active rates
    if (!searchQuery.trim()) {
      if (a.active !== b.active) {
        return b.active - a.active // true (1) comes before false (0)
      }
    }
    // Then sort by cost (lowest to highest for better rates)
    return (a.cost || 0) - (b.cost || 0)
  })

  // Take first 50 records to show more data
  const displayRates = sortedRates.slice(0, 50).map((rate, index) => {
    // Count how many times this ID appears before this index
    const sameIdCount = sortedRates.slice(0, index).filter(r => r.id === rate.id).length
    const displayId = sameIdCount > 0 ? `${rate.id}-${sameIdCount + 1}` : rate.id

    return {
      ...rate,
      displayId,
      uniqueKey: `${rate.id}_${index}` // Use id + index for React key prop
    }
  })

  return (
    <div className="space-y-6 h-full">
      {/* Balance Card */}
      <div className="card p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl text-white/70">Balance</h2>
          <div className="bg-white/10 px-4 py-2 rounded-full">
            <span className="text-white/70 text-sm">on-chain • SOL</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {/* Left Column - Balance */}
          <div className="col-span-2">
            {/* Balance Display */}
            <div className="mb-4">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                0.0000 SOL
              </div>
              <p className="text-yellow-400 text-sm mt-1">
                Low balance — please top up before a call.
              </p>
            </div>
          </div>

          {/* Right Column - Top Up */}
          <div className="space-y-3">
            <h3 className="text-white/70 text-sm mb-2">Top Up Amount</h3>
            <div className="space-y-3">
              <input
                type="number"
                step="0.0001"
                value={topUpAmount}
                onChange={(e) => setTopUpAmount(e.target.value)}
                placeholder="Enter custom amount"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 text-sm"
              />

              {/* Quick Top-up Buttons */}
              <div className="grid grid-cols-2 gap-2">
                {quickAmounts.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => handleQuickTopUp(amount)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${topUpAmount === amount.toString()
                        ? 'bg-white text-gray-900'
                        : 'bg-white/5 hover:bg-white/10 text-white border border-white/10'
                      }`}
                  >
                    {amount}
                  </button>
                ))}
              </div>

              <button
                onClick={handleAddFunds}
                className="w-full bg-white hover:bg-gray-100 text-gray-900 py-2 rounded-xl font-medium transition-all text-sm"
              >
                Add Funds
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rates Table Card */}
      <div className="card p-6 flex-1">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white/40 rounded-full"></div>
            </div>
            <h3 className="text-xl font-semibold text-white">Current Rates</h3>
          </div>

          {/* Search Field */}
          <div className="w-64">
            <input
              type="text"
              placeholder="Search by direction, codes, or route..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
            />
          </div>
        </div>

        {ratesLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-white/70">Loading rates...</span>
          </div>
        ) : ratesError ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-400 text-sm mb-2">Failed to load rates</div>
              <div className="text-white/60 text-xs">{ratesError}</div>
            </div>
          </div>
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-7 gap-3 pb-4 border-b border-white/10 mb-4 text-xs">
              <div className="text-white/60 font-medium">Active</div>
              <div className="text-white/60 font-medium">ID</div>
              <div className="text-white/60 font-medium">Direction</div>
              <div className="text-white/60 font-medium">Codes</div>
              <div className="text-white/60 font-medium">Route</div>
              <div className="text-white/60 font-medium">Priority</div>
              <div className="text-white/60 font-medium text-right">Cost</div>
            </div>

            {/* Table Rows */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {displayRates.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  {searchQuery ? 'No rates found matching your search.' : 'No rates available.'}
                </div>
              ) : (
                displayRates.map((rate) => (
                  <div key={rate.uniqueKey} className="grid grid-cols-7 gap-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-xs">
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full ${rate.active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    </div>
                    <div className="text-white/70 font-mono">
                      {rate.displayId}
                    </div>
                    <div className="text-white">
                      <div className="truncate" title={rate.direction}>
                        {rate.direction ? (rate.direction.length > 15 ? rate.direction.substring(0, 15) + '...' : rate.direction) : '-'}
                      </div>
                    </div>
                    <div className="text-white/70 font-mono">
                      <div className="truncate" title={rate.codes}>
                        {rate.codes ? (rate.codes.toString().length > 20 ? rate.codes.toString().substring(0, 20) + '...' : rate.codes) : '-'}
                      </div>
                    </div>
                    <div className="text-white/70">
                      <div className="truncate" title={rate.routename}>
                        {rate.routename ? (rate.routename.length > 10 ? rate.routename.substring(0, 10) + '...' : rate.routename) : '-'}
                      </div>
                    </div>
                    <div className="text-white/70 text-center">
                      {rate.priority || '-'}
                    </div>
                    <div className="text-white font-mono text-right">
                      {rate.displaycost || '-'} {rate.displaycurrency || ''}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Results Info */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="text-white/50 text-sm">
                Showing {displayRates.length} of {filteredRates.length} rates
                {searchQuery && ` (filtered from ${rates.length} total)`}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default BalanceModule