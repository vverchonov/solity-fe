import { useState } from 'react'

function Balance() {
  const [depositAddress] = useState('SoL1TyZ27...EuK4')

  const quickAmounts = [0.1, 0.5, 1, 2]

  const handleAddBalance = (amount) => {
    console.log('Adding balance:', amount)
    // Here you would typically add the balance to the user's account
  }

  const handleCopyAddress = () => {
    navigator.clipboard.writeText('SoL1TyZ27abcdefghijklmnopqrstuvwxyzEuK4')
  }

  return (
    <div className="card p-4 h-full">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg text-white/70">Balance</h2>
        <div className="bg-white/10 px-3 py-1 rounded-full">
          <span className="text-white/70 text-xs">on-chain • SOL</span>
        </div>
      </div>

      {/* Balance Display */}
      <div className="mb-4">
        <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          0.0000 SOL
        </div>
        <p className="text-yellow-400 text-xs mt-1">
          Low balance — please top up before a call.
        </p>
      </div>

      {/* Quick Add Balance Buttons */}
      <div className="space-y-3 mb-4">
        <h3 className="text-white/70 text-sm">Quick Add Balance</h3>
        <div className="grid grid-cols-4 gap-2">
          {quickAmounts.map((amount) => (
            <button
              key={amount}
              onClick={() => handleAddBalance(amount)}
              className="px-3 py-2 rounded-xl text-sm font-medium transition-all bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20"
            >
              {amount}
            </button>
          ))}
        </div>
      </div>

      {/* Deposit Address */}
      <div className="mb-4">
        <h3 className="text-white/70 text-sm mb-2">Deposit Address</h3>
        <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2">
          <span className="text-white font-mono text-sm">{depositAddress}</span>
        </div>
        <div className="mt-2 text-xs text-white/50">
          <p>Send only SOL to this address.</p>
          <p>Funds are credited after network confirmations.</p>
        </div>
      </div>
    </div>
  )
}

export default Balance