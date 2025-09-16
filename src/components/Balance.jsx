import { useState } from 'react'
import { useWallet } from '../contexts/WalletProvider'

function Balance() {
  const [customAmount, setCustomAmount] = useState('')
  const { isWalletConnected, walletAddress, isConnecting, connectWallet, disconnectWallet } = useWallet()

  const quickAmounts = [0.1, 0.5, 1, 2]

  const handleAddBalance = (amount) => {
    console.log('Adding balance:', amount)
    // Here you would typically add the balance to the user's account
  }

  const handleAddCustomAmount = () => {
    const amount = parseFloat(customAmount)
    if (amount > 0) {
      handleAddBalance(amount)
      setCustomAmount('')
    }
  }

  const handleConnectWallet = async () => {
    const result = await connectWallet()
    if (!result.success) {
      console.error('Failed to connect wallet:', result.error)
    }
  }

  const handleDisconnectWallet = async () => {
    await disconnectWallet()
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
              onClick={() => setCustomAmount(amount.toString())}
              disabled={!isWalletConnected}
              className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${
                isWalletConnected
                  ? 'bg-white/5 hover:bg-white/10 text-white border-white/10 hover:border-white/20'
                  : 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed'
              }`}
            >
              {amount}
            </button>
          ))}
        </div>
      </div>

      {/* Custom Amount */}
      <div className="mb-4">
        <h3 className="text-white/70 text-sm mb-2">Custom Amount</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            placeholder="Enter SOL amount"
            step="0.01"
            min="0"
            disabled={!isWalletConnected}
            className={`flex-1 border rounded-xl px-3 py-2 text-sm transition-all ${
              isWalletConnected
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10'
                : 'bg-gray-600 border-gray-600 text-gray-400 placeholder-gray-500 cursor-not-allowed'
            }`}
          />
          <button
            onClick={handleAddCustomAmount}
            disabled={!isWalletConnected || !customAmount || parseFloat(customAmount) <= 0}
            className={`px-4 py-2 text-white text-sm font-medium rounded-xl transition-all ${
              isWalletConnected && customAmount && parseFloat(customAmount) > 0
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-gray-600 cursor-not-allowed'
            }`}
          >
            Add
          </button>
        </div>
      </div>

      {/* Wallet Connection */}
      <div className="mb-4">
        <button
          onClick={isWalletConnected ? handleDisconnectWallet : handleConnectWallet}
          disabled={isConnecting}
          className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${
            isConnecting
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : isWalletConnected
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}
        >
          {isConnecting
            ? 'Connecting...'
            : isWalletConnected
              ? 'Disconnect Wallet'
              : 'Connect Phantom Wallet'
          }
        </button>
        {isWalletConnected && walletAddress && (
          <div className="mt-2 text-xs text-white/60 break-all">
            Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
          </div>
        )}
      </div>
    </div>
  )
}

export default Balance