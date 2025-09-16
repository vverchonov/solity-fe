import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useWallet } from '../contexts/WalletProvider'
import { useBalance } from '../contexts/BalanceProvider'
import { useInvoices } from '../contexts/InvoicesProvider'
import { useLogs } from '../contexts/LogsProvider'
import { useUser } from '../contexts/UserContext'
import { paymentsAPI } from '../services/payments'
import { solanaService } from '../services/solana'
import { authAPI } from '../services/auth'

function Balance({ onNavigateToInvoices, onNavigateToSupport }) {
  const [customAmount, setCustomAmount] = useState('')
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const navigate = useNavigate()
  const { user, clearUser } = useUser()
  const { isWalletConnected, walletAddress, isConnecting, connectWallet, disconnectWallet, walletProvider } = useWallet()
  const {
    balance,
    getFormattedSolBalance,
    getFormattedUsdBalance,
    isUserActive,
    topUpBalance,
    isTopUpLoading,
    activeInvoice,
    cancelInvoice,
    hasActiveInvoice,
    getInvoiceTimeRemaining,
    refreshBalance
  } = useBalance()

  // Use invoices provider to get pending invoices and cancel functionality
  const { invoices, getPendingInvoices, cancelInvoice: cancelInvoiceFromProvider, refreshInvoices } = useInvoices()

  // Use logs provider for tracking interactions
  const {
    logInvoicePrepare,
    logTransactionStart,
    logTransactionSigned,
    logTransactionConfirmed,
    logTransactionRejected,
    logTransactionError,
    logInvoiceStatusUpdate,
    logInvoiceCancel
  } = useLogs()

  const quickAmounts = [0.1, 0.5, 1, 2]

  const handleAddBalance = async (amount) => {
    if (!isWalletConnected) {
      console.log('Wallet not connected')
      return
    }

    console.log('Adding balance:', amount)
    const result = await topUpBalance(amount)

    if (result.success) {
      console.log('Invoice prepared:', result.data)
      logInvoicePrepare(amount, true, result.data.invoice)
      console.log('📝 Prepared invoice data structure:', JSON.stringify(result.data, null, 2))
      console.log('📝 Available keys in prepared invoice:', Object.keys(result.data))
      console.log('📝 Invoice ID field:', result.data.id)
      console.log('📝 Invoice field:', result.data.invoice)
      // Now pay the prepared invoice using the same flow as "Pay Invoice" button
      await handlePayPreparedInvoice(result.data)
    } else {
      console.error('Failed to prepare invoice:', result.error)
      logInvoicePrepare(amount, false)
      // Show error message
    }
  }

  const handleAddCustomAmount = async () => {
    const amount = parseFloat(customAmount)
    if (amount > 0) {
      await handleAddBalance(amount)
      setCustomAmount('')
    }
  }

  const handlePayPreparedInvoice = async (invoiceData) => {
    const invoiceId = invoiceData.invoice || invoiceData.id
    console.log('💳 Paying prepared invoice:', invoiceData)
    logTransactionStart(invoiceId, (invoiceData.lamports / 1e9))

    if (!walletProvider) {
      console.error('❌ Wallet not connected')
      logTransactionError('Wallet not connected', invoiceId)
      return
    }

    try {
      // Execute Solana payment using the prepared invoice data
      console.log('🔗 Executing Solana payment...')
      const paymentResult = await solanaService.executePayment(invoiceData, walletProvider)

      if (paymentResult.success) {
        console.log('🎉 Payment executed successfully:', paymentResult.signature)
        logTransactionSigned(paymentResult.signature, invoiceId)
        logTransactionConfirmed(paymentResult.signature, invoiceId)

        // Complete the invoice with the transaction signature
        console.log('📝 Completing invoice with signature...')
        console.log('📝 Invoice data for completion:', invoiceData)
        console.log('📝 Using invoice ID:', invoiceId)
        const completeResult = await paymentsAPI.completeInvoice(invoiceId, paymentResult.signature)

        if (completeResult.success) {
          console.log('✅ Invoice completed successfully')
          logInvoiceStatusUpdate(invoiceId, 'pending', 'processing')

          // Refetch invoices immediately after successful completion
          await refreshInvoices()
          console.log('✅ Balance: Invoices refreshed after payment completion')
        } else {
          console.error('❌ Failed to complete invoice:', completeResult.error)
        }

        // Show processing modal
        setShowProcessingModal(true)

        // Refresh balance immediately after showing modal
        handleRefreshBalance()

        // Also refresh invoices after successful payment (additional refresh)
        setTimeout(() => {
          refreshInvoices()
        }, 1000)
      } else {
        console.error('❌ Failed to execute payment:', paymentResult.error)

        if (paymentResult.userRejected) {
          console.log('ℹ️ Payment rejected by user')
          logTransactionRejected(invoiceId)
        } else {
          logTransactionError(paymentResult.error, invoiceId)
        }
      }
    } catch (error) {
      console.error('❌ Error in prepared invoice payment process:', error)
      logTransactionError(error.message, invoiceId)
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

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      clearUser()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
      // Clear user state and redirect even if logout fails
      clearUser()
      navigate('/')
    }
  }

  const handleCancelInvoice = async (invoiceId) => {
    console.log('🚫 Cancelling invoice:', invoiceId)
    const result = await cancelInvoiceFromProvider(invoiceId)

    if (result && result.success) {
      console.log('✅ Invoice cancelled successfully')
      logInvoiceCancel(invoiceId, true)

      // Refresh both invoices and balance to update all state and re-enable buttons
      await Promise.all([
        refreshInvoices(),
        refreshBalance()
      ])
      console.log('✅ Balance: Invoices and balance refreshed after invoice cancellation')

      // Force a small delay to ensure UI updates properly
      setTimeout(() => {
        console.log('✅ Balance: Top-up buttons should now be enabled')
      }, 100)
    } else {
      console.error('❌ Failed to cancel invoice:', result?.error)
      logInvoiceCancel(invoiceId, false)
    }
  }

  const handlePayInvoice = async (invoiceId) => {
    console.log('💳 Paying invoice:', invoiceId)

    if (!walletProvider) {
      console.error('❌ Wallet not connected')
      logTransactionError('Wallet not connected', invoiceId)
      return
    }

    try {
      // 1. Get invoice details by ID
      console.log('📄 Getting invoice details...')
      const invoiceResult = await paymentsAPI.getInvoiceById(invoiceId)

      if (!invoiceResult.success) {
        console.error('❌ Failed to get invoice details:', invoiceResult.error)
        return
      }

      const invoiceResponse = invoiceResult.data
      console.log('📄 Invoice response received:', invoiceResponse)

      // Extract the actual invoice data from the nested structure
      const invoiceData = invoiceResponse.invoice || invoiceResponse
      console.log('📄 Extracted invoice data:', invoiceData)

      logTransactionStart(invoiceId, (invoiceData.lamports / 1e9))

      // 2. Execute Solana payment using the invoice data
      console.log('🔗 Executing Solana payment...')
      const paymentResult = await solanaService.executePayment(invoiceData, walletProvider)

      if (paymentResult.success) {
        console.log('🎉 Payment executed successfully:', paymentResult.signature)
        logTransactionSigned(paymentResult.signature, invoiceId)
        logTransactionConfirmed(paymentResult.signature, invoiceId)

        // Complete the invoice with the transaction signature
        console.log('📝 Completing invoice with signature...')
        console.log('📝 Original invoice ID:', invoiceId)
        console.log('📝 Invoice data received:', invoiceData)
        console.log('📝 Using invoice ID:', invoiceId)
        const completeResult = await paymentsAPI.completeInvoice(invoiceId, paymentResult.signature)

        if (completeResult.success) {
          console.log('✅ Invoice completed successfully')
          logInvoiceStatusUpdate(invoiceId, 'pending', 'processing')

          // Refetch invoices immediately after successful completion
          await refreshInvoices()
          console.log('✅ Balance: Invoices refreshed after payment completion')
        } else {
          console.error('❌ Failed to complete invoice:', completeResult.error)
        }

        // Show processing modal
        setShowProcessingModal(true)

        // Refresh balance immediately after showing modal
        handleRefreshBalance()

        // Also refresh invoices after successful payment (additional refresh)
        setTimeout(() => {
          refreshInvoices()
        }, 1000)
      } else {
        console.error('❌ Failed to execute payment:', paymentResult.error)

        if (paymentResult.userRejected) {
          console.log('ℹ️ Payment rejected by user')
          logTransactionRejected(invoiceId)
        } else {
          logTransactionError(paymentResult.error, invoiceId)
        }
      }
    } catch (error) {
      console.error('❌ Error in pay invoice process:', error)
      logTransactionError(error.message, invoiceId)
    }
  }

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true)
    try {
      console.log('🔄 Refreshing balance and invoices...')
      const result = await paymentsAPI.getBalance()

      if (result.success) {
        console.log('✅ Balance refreshed:', result.data)
        // The BalanceProvider will automatically update when we call refreshBalance
        refreshBalance()
        // Also refresh invoices
        await refreshInvoices()
        console.log('✅ Balance: Invoices refreshed during balance refresh')
      } else {
        console.error('❌ Failed to refresh balance:', result.error)
      }
    } catch (error) {
      console.error('❌ Error refreshing balance:', error)
    } finally {
      setIsRefreshingBalance(false)
    }
  }

  // Get the first pending invoice (most recent incomplete one) - memoized for performance
  const firstPendingInvoice = useMemo(() => {
    const pendingInvoices = getPendingInvoices()
    const result = pendingInvoices.length > 0 ? pendingInvoices[0] : null
    console.log('🔄 Balance: firstPendingInvoice updated:', result?.id || 'none')
    return result
  }, [invoices, getPendingInvoices])

  // Check for processing invoices (most recent one) - memoized for performance
  const latestProcessingInvoice = useMemo(() => {
    const processingInvoices = invoices.filter(invoice => invoice.status === 'processing')
    const result = processingInvoices.length > 0 ? processingInvoices[0] : null
    console.log('🔄 Balance: latestProcessingInvoice updated:', result?.id || 'none')
    console.log('🔄 Balance: Processing invoices count:', processingInvoices.length)
    console.log('🔄 Balance: All invoices statuses:', invoices.map(inv => ({ id: inv.id, status: inv.status })))
    return result
  }, [invoices])

  // Helper functions for invoice display
  const formatInvoiceAmount = (lamports) => {
    return (lamports / 1e9).toFixed(4) + ' SOL'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <>
      <div className="card p-4 h-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg text-white/70">Balance</h2>
          <div className="bg-white/10 px-3 py-1 rounded-full flex items-center justify-center">
            <span className="text-white/70 text-xs">on-chain • SOL</span>
          </div>
        </div>

        {/* Balance Display */}
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              {getFormattedSolBalance()} SOL
            </div>
            <button
              onClick={handleRefreshBalance}
              disabled={isRefreshingBalance}
              className={`p-2 rounded-lg transition-all ${isRefreshingBalance
                ? 'text-white/40 cursor-not-allowed'
                : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              title="Refresh balance"
            >
              <svg
                className={`w-4 h-4 ${isRefreshingBalance ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
          <p className={`text-xs mt-1 ${isUserActive() ? 'text-green-400' : 'text-yellow-400'}`}>
            {isUserActive()
              ? 'Account active — ready for calls'
              : 'Low balance — please top up before a call.'
            }
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
                disabled={!isWalletConnected || isTopUpLoading || hasActiveInvoice() || firstPendingInvoice || latestProcessingInvoice}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${isWalletConnected && !isTopUpLoading && !hasActiveInvoice() && !firstPendingInvoice && !latestProcessingInvoice
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
              onKeyDown={(e) => {
                // Allow: navigation keys, delete, backspace, tab, escape, enter
                const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];

                // Allow decimal point (period and comma)
                if (e.key === '.' || e.key === ',') return;

                // Allow allowed keys
                if (allowedKeys.includes(e.key)) return;

                // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
                if (e.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(e.key.toLowerCase())) return;

                // Allow numbers 0-9
                if (e.key >= '0' && e.key <= '9') return;

                // Block everything else
                e.preventDefault();
              }}
              placeholder="Enter SOL amount"
              step="0.01"
              min="0"
              disabled={!isWalletConnected || isTopUpLoading || hasActiveInvoice() || firstPendingInvoice || latestProcessingInvoice}
              className={`flex-1 border rounded-xl px-3 py-2 text-sm transition-all ${isWalletConnected && !isTopUpLoading && !hasActiveInvoice() && !firstPendingInvoice && !latestProcessingInvoice
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10'
                : 'bg-gray-600 border-gray-600 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                }`}
            />
            <button
              onClick={handleAddCustomAmount}
              disabled={!isWalletConnected || !customAmount || parseFloat(customAmount) <= 0 || isTopUpLoading || hasActiveInvoice() || firstPendingInvoice || latestProcessingInvoice}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${isWalletConnected && customAmount && parseFloat(customAmount) > 0 && !isTopUpLoading && !hasActiveInvoice() && !firstPendingInvoice && !latestProcessingInvoice
                ? 'bg-white hover:bg-gray-100 text-gray-900'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
            >
              {isTopUpLoading ? 'Preparing...' : hasActiveInvoice() ? 'Invoice Active' : firstPendingInvoice ? 'Pending Invoice' : 'Add'}
            </button>
          </div>
        </div>

        {/* Invoice Action Buttons - Show if there's a pending invoice */}
        {firstPendingInvoice && (
          <div className="mb-4">
            <div
              className="text-xs text-white/60 text-center mb-2 cursor-pointer hover:text-white/80 transition-colors"
              onClick={() => onNavigateToInvoices && onNavigateToInvoices()}
              title="Click to view all invoices"
            >
              Invoice: {formatInvoiceAmount(firstPendingInvoice.lamports)} • Expires {formatDate(firstPendingInvoice.expiresAt)}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleCancelInvoice(firstPendingInvoice.id)}
                className="flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 hover:border-red-600/50"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePayInvoice(firstPendingInvoice.id)}
                disabled={!isWalletConnected}
                className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${isWalletConnected
                  ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 hover:border-green-600/50'
                  : 'bg-gray-600/20 text-gray-500 border border-gray-600/30 cursor-not-allowed'
                  }`}
              >
                Pay Invoice
              </button>
            </div>
          </div>
        )}

        {/* Processing Invoice Notification */}
        {latestProcessingInvoice && (
          <div className="mb-3 p-2 bg-blue-600/20 border border-blue-600/30 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
              <span className="text-blue-400 text-xs font-medium">
                Payment Processing {formatInvoiceAmount(latestProcessingInvoice.lamports)}
              </span>
            </div>
          </div>
        )}

        {/* Wallet Connection */}
        <div className="mb-4">
          <button
            onClick={isWalletConnected ? handleDisconnectWallet : handleConnectWallet}
            disabled={isConnecting}
            className={`w-full py-3 rounded-xl text-sm font-medium transition-all ${isConnecting
              ? 'bg-white/10 text-white/40 cursor-not-allowed'
              : isWalletConnected
                ? 'bg-white/10 hover:bg-white/15 text-white/80 border border-white/20'
                : 'bg-blue-600/30 hover:bg-blue-600/40 text-white shadow-lg hover:shadow-xl'
              }`}
          >
            <div className="flex items-center justify-center gap-2">
              {!isConnecting && !isWalletConnected && (
                <img src="/phantom.png" alt="Phantom" className="w-5 h-5" />
              )}
              {isConnecting
                ? 'Connecting...'
                : isWalletConnected
                  ? 'Disconnect Wallet'
                  : 'Connect Phantom Wallet'
              }
            </div>
          </button>
          {isWalletConnected && walletAddress && (
            <div className="mt-2 text-xs text-white/60 break-all text-center">
              Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </div>
          )}
        </div>
      </div>

      {/* Payment Processing Modal */}
      {showProcessingModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-8 max-w-lg w-full mx-4 animate-in fade-in zoom-in-95 duration-300">
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto bg-gradient-to-br from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-full flex items-center justify-center border border-white/10">
                  <svg className="w-10 h-10 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">Payment Submitted!</h3>
              <p className="text-white/80 text-base mb-4">
                Your payment has been successfully submitted to the Solana network.
              </p>
              <p className="text-white/70 text-sm mb-4">
                It may take up to <span className="text-purple-300 font-semibold">10 minutes</span> to process.
                Please wait patiently while your balance is updated.
              </p>
              <p className="text-white/60 text-sm mb-8">
                If you experience any problems with the payment, please{' '}
                <button
                  onClick={() => {
                    setShowProcessingModal(false)
                    onNavigateToSupport && onNavigateToSupport()
                  }}
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  visit this page
                </button>
                {' '}and contact us.
              </p>
              <button
                onClick={() => setShowProcessingModal(false)}
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Balance