import { useState } from 'react'

function BalanceModule() {
  const [topUpAmount, setTopUpAmount] = useState('')
  const [depositAddress] = useState('SoL1TyZ27...EuK4')

  const quickAmounts = [0.1, 0.5, 1, 2]

  const handleQuickTopUp = (amount) => {
    setTopUpAmount(amount.toString())
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('SoL1TyZ27abcdefghijklmnopqrstuvwxyzEuK4')
  }

  const handleAddFunds = () => {
    console.log('Adding funds:', topUpAmount)
  }

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
          {/* Left Column - Balance & Deposit */}
          <div className="col-span-2 space-y-4">
            {/* Balance Display */}
            <div className="mb-4">
              <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                0.0000 SOL
              </div>
              <p className="text-yellow-400 text-sm mt-1">
                Low balance — please top up before a call.
              </p>
            </div>

            {/* Deposit Address */}
            <div>
              <h3 className="text-white/70 text-lg mb-3">Deposit Address</h3>
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-white font-mono">{depositAddress}</span>
              </div>
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

      {/* Pricing Card */}
      <div className="card p-6 flex-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white/40 rounded-full"></div>
          </div>
          <h3 className="text-xl font-semibold text-white">North America</h3>
        </div>
        
        {/* Table Header */}
        <div className="grid grid-cols-3 gap-4 pb-4 border-b border-white/10 mb-4">
          <div className="text-white/60 text-sm font-medium">Country</div>
          <div className="text-white/60 text-sm font-medium">Code</div>
          <div className="text-white/60 text-sm font-medium text-right">Rate per minute</div>
        </div>
        
        {/* Table Rows */}
        <div className="space-y-4">
          {[
            { country: "United States", code: "US", dialCode: "+1", rate: "0.00015 SOL" },
            { country: "Canada", code: "CA", dialCode: "+1", rate: "0.00018 SOL" },
            { country: "Mexico", code: "MX", dialCode: "+52", rate: "0.00025 SOL" }
          ].map((item) => (
            <div key={item.code} className="grid grid-cols-3 gap-4 py-2">
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm font-medium w-8">{item.code}</span>
                <span className="text-white text-sm">{item.country}</span>
              </div>
              <div className="text-white/80 text-sm font-mono">{item.dialCode}</div>
              <div className="text-white text-sm font-mono text-right">{item.rate}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default BalanceModule