import { useState } from 'react'

function Balance() {
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
    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 h-full">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg text-white/70">Balance</h2>
        <div className="bg-white/10 px-3 py-1 rounded-full">
          <span className="text-white/70 text-xs">on-chain • SOL</span>
        </div>
      </div>

      {/* Balance Display */}


      {/* Deposit Address */}
      <div className="mb-4">
        <div className="mb-4">
          <div className="text-3xl font-bold text-white mb-2">
            0.0000 SOL
          </div>
          <p className="text-yellow-400 text-xs">
            Low balance — please top up before a call.
          </p>
        </div>
        <h3 className="text-white/70 text-sm mb-2">Deposit Address</h3>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
            <span className="text-white font-mono text-sm">{depositAddress}</span>
          </div>
          <button
            onClick={handleCopyAddress}
            className="bg-white/10 hover:bg-white/15 text-white px-3 py-2 rounded-lg text-sm transition-all"
          >
            Copy
          </button>
        </div>
      </div>

      {/* Custom Amount and Add Funds */}
      <div className="space-y-3">
        <div>
          <input
            type="number"
            step="0.0001"
            value={topUpAmount}
            onChange={(e) => setTopUpAmount(e.target.value)}
            placeholder="Enter custom amount"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 text-sm"
          />
        </div>

        {/* Quick Top-up Buttons */}
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleQuickTopUp(amount)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${topUpAmount === amount.toString()
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
          className="w-full bg-white hover:bg-gray-100 text-gray-900 py-2 rounded-lg font-medium transition-all text-sm"
        >
          Add Funds
        </button>
      </div>
    </div>
  )
}

export default Balance