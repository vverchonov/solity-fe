import { useState } from 'react'
import { useRates } from '../contexts/RatesProvider'

function BalanceModule() {
  const [topUpAmount, setTopUpAmount] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  // Fixed rates data
  const rates = [
    { code: 'TZ', country: 'Tanzania', dialCode: '+255', cost: 0.01305 },
    { code: 'GB', country: 'United Kingdom', dialCode: '+44', cost: 0.0125 },
    { code: 'CF', country: 'Central African Republic', dialCode: '+236', cost: 0.0119 },
    { code: 'XX', country: 'Sao Tome and Principe', dialCode: '', cost: 0.00995 },
    { code: 'PG', country: 'Papua New Guinea', dialCode: '+675', cost: 0.00975 },
    { code: 'NF', country: 'Norfolk Island', dialCode: '+672', cost: 0.00935 },
    { code: 'GW', country: 'Guinea-Bissau', dialCode: '+245', cost: 0.00905 },
    { code: 'DZ', country: 'Algeria', dialCode: '+213', cost: 0.00705 },
    { code: 'VU', country: 'Vanuatu', dialCode: '+678', cost: 0.0069 },
    { code: 'CU', country: 'Cuba', dialCode: '+53', cost: 0.0067 },
    { code: 'MV', country: 'Maldives', dialCode: '+960', cost: 0.00655 },
    { code: 'TV', country: 'Tuvalu', dialCode: '+688', cost: 0.0065 },
    { code: 'CK', country: 'Cook Islands', dialCode: '+682', cost: 0.00645 },
    { code: 'SB', country: 'Solomon Islands', dialCode: '+677', cost: 0.00625 },
    { code: 'WS', country: 'Samoa', dialCode: '+685', cost: 0.00625 },
    { code: 'TN', country: 'Tunisia', dialCode: '+216', cost: 0.00605 },
    { code: 'CN', country: 'China', dialCode: '+86', cost: 0.00575 },
    { code: 'SC', country: 'Seychelles', dialCode: '+248', cost: 0.0055 },
    { code: 'TL', country: 'Timor-Leste', dialCode: '+670', cost: 0.0054 },
    { code: 'DE', country: 'Germany', dialCode: '+49', cost: 0.0052 }
  ]

  const ratesLoading = false

  const quickAmounts = [0.1, 0.5, 1, 2]

  const handleQuickTopUp = (amount) => {
    setTopUpAmount(amount.toString())
  }


  const handleAddFunds = () => {
    console.log('Adding funds:', topUpAmount)
  }

  // Filter and search rates
  const filteredRates = rates.filter(rate => {
    if (!searchQuery.trim()) return true
    
    const query = searchQuery.toLowerCase()
    const matchesCountry = rate.country?.toLowerCase().includes(query)
    const matchesCode = rate.code?.toLowerCase().includes(query)
    const matchesDialCode = rate.dialCode?.toLowerCase().includes(query)
    
    return matchesCountry || matchesCode || matchesDialCode
  })

  // Sort by cost (highest to lowest)
  const sortedRates = filteredRates.sort((a, b) => b.cost - a.cost)

  // Take first 20 records
  const displayRates = sortedRates.slice(0, 20).map((rate, index) => ({
    ...rate,
    uniqueKey: `${rate.code}_${index}` // For React key prop
  }))

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
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      topUpAmount === amount.toString()
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
              placeholder="Search by country, code, or dial code..."
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
        ) : (
          <>
            {/* Table Header */}
            <div className="grid grid-cols-4 gap-4 pb-4 border-b border-white/10 mb-4">
              <div className="text-white/60 text-sm font-medium">Country</div>
              <div className="text-white/60 text-sm font-medium">Code</div>
              <div className="text-white/60 text-sm font-medium">Dial Code</div>
              <div className="text-white/60 text-sm font-medium text-right">Cost</div>
            </div>
            
            {/* Table Rows */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {displayRates.length === 0 ? (
                <div className="text-center py-8 text-white/60">
                  {searchQuery ? 'No rates found matching your search.' : 'No rates available.'}
                </div>
              ) : (
                displayRates.map((rate) => (
                  <div key={rate.uniqueKey} className="grid grid-cols-4 gap-4 py-2 hover:bg-white/5 rounded-lg transition-colors">
                    <div className="text-white text-sm">
                      {rate.country}
                    </div>
                    <div className="text-white/70 text-sm font-mono">
                      {rate.code}
                    </div>
                    <div className="text-white/70 text-sm font-mono">
                      {rate.dialCode || '-'}
                    </div>
                    <div className="text-white text-sm font-mono text-right">
                      {rate.cost.toFixed(8)} SOL
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