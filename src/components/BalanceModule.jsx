import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRates } from '../contexts/RatesProvider'
import { useWallet } from '../contexts/WalletProvider'
import { useBalance } from '../contexts/BalanceProvider'
import { useInvoices } from '../contexts/InvoicesProvider'
import { useLogs } from '../contexts/LogsProvider'
import { useUser } from '../contexts/UserContext'
import { paymentsAPI } from '../services/payments'
import { solanaService } from '../services/solana'
import { authAPI } from '../services/auth'

function BalanceModule({ onNavigateToSupport }) {
  const [topUpAmount, setTopUpAmount] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const navigate = useNavigate()
  const { user, clearUser } = useUser()

  // Use rates from the /current endpoint via RatesProvider
  const { rates: apiRates, isLoading: ratesLoading, error: ratesError } = useRates()

  // Use wallet provider
  const { isWalletConnected, walletAddress, isConnecting, connectWallet, disconnectWallet, walletProvider } = useWallet()

  // Use balance provider
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
  const { invoices, getPendingInvoices, cancelInvoice: cancelInvoiceFromProvider, refreshInvoices, isLoading: invoicesLoading, error: invoicesError } = useInvoices()

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

  // Use actual rates from API or fallback to empty array
  const rates = apiRates || []

  const quickAmounts = [0.1, 0.5, 1, 2]

  const handleQuickTopUp = (amount) => {
    setTopUpAmount(amount.toString())
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
        const invoiceId = invoiceData.invoice || invoiceData.id
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
          console.log('✅ BalanceModule: Invoices refreshed after payment completion')
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

  const handleAddFunds = async () => {
    console.log('🔘 handleAddFunds called - wallet connected:', isWalletConnected, 'amount:', topUpAmount)

    if (!isWalletConnected) {
      console.log('❌ Wallet not connected')
      return
    }

    const amount = parseFloat(topUpAmount)
    if (amount <= 0) {
      console.log('❌ Invalid amount:', amount)
      return
    }

    console.log('💰 Adding funds:', amount)
    const result = await topUpBalance(amount)

    if (result.success) {
      console.log('✅ Invoice prepared:', result.data)
      logInvoicePrepare(amount, true, result.data.invoice)
      console.log('📝 Prepared invoice data structure:', JSON.stringify(result.data, null, 2))
      console.log('📝 Available keys in prepared invoice:', Object.keys(result.data))
      console.log('📝 Invoice ID field:', result.data.id)
      console.log('📝 Invoice field:', result.data.invoice)
      // Now pay the prepared invoice using the same flow as "Pay Invoice" button
      await handlePayPreparedInvoice(result.data)
      setTopUpAmount('')
    } else {
      console.error('❌ Failed to prepare invoice:', result.error)
      logInvoicePrepare(amount, false)
      // Show error message
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
      console.log('✅ BalanceModule: Invoices and balance refreshed after invoice cancellation')

      // Force a small delay to ensure UI updates properly
      setTimeout(() => {
        console.log('✅ BalanceModule: Top-up buttons should now be enabled')
      }, 100)
    } else {
      console.error('❌ Failed to cancel invoice:', result?.error)
      logInvoiceCancel(invoiceId, false)
    }
  }

  const handlePayInvoice = async (invoiceId) => {
    console.log('💳 Paying invoice:', invoiceId)
    logTransactionStart(invoiceId, 0) // Amount will be updated when we get invoice details

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
        logTransactionError(`Failed to get invoice details: ${invoiceResult.error}`, invoiceId)
        return
      }

      const invoiceResponse = invoiceResult.data
      console.log('📄 Invoice response received:', invoiceResponse)

      // Extract the actual invoice data from the nested structure
      const invoiceData = invoiceResponse.invoice || invoiceResponse
      console.log('📄 Extracted invoice data:', invoiceData)
      console.log('📄 Invoice data structure check:', {
        hasLamports: 'lamports' in invoiceData,
        hasToAddress: 'toAddress' in invoiceData,
        hasMemo: 'memo' in invoiceData,
        lamports: invoiceData.lamports,
        toAddress: invoiceData.toAddress,
        memo: invoiceData.memo
      })

      // 2. Execute Solana payment using the invoice data
      console.log('🔗 Executing Solana payment...')
      console.log('🔗 Wallet provider check:', {
        hasWalletProvider: !!walletProvider,
        hasPublicKey: !!walletProvider?.publicKey,
        publicKey: walletProvider?.publicKey?.toBase58?.()
      })
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
          console.log('✅ BalanceModule: Invoices refreshed after payment completion')
        } else {
          console.error('❌ Failed to complete invoice:', completeResult.error)
        }

        // Show processing modal
        setShowProcessingModal(true)

        // Refresh balance immediately after showing modal
        handleRefreshBalance()

        // Also refresh invoices after successful payment
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
        console.log('✅ BalanceModule: Invoices refreshed during balance refresh')
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
    console.log('🔄 BalanceModule: firstPendingInvoice updated:', result?.id || 'none')
    return result
  }, [invoices, getPendingInvoices])

  // Check for processing invoices (most recent one) - memoized for performance
  const latestProcessingInvoice = useMemo(() => {
    const processingInvoices = invoices.filter(invoice => invoice.status === 'processing')
    const result = processingInvoices.length > 0 ? processingInvoices[0] : null
    console.log('🔄 BalanceModule: latestProcessingInvoice updated:', result?.id || 'none')
    console.log('🔄 BalanceModule: Processing invoices count:', processingInvoices.length)
    console.log('🔄 BalanceModule: All invoices statuses:', invoices.map(inv => ({ id: inv.id, status: inv.status })))
    return result
  }, [invoices])

  // Helper functions for invoice display
  const formatInvoiceAmount = (lamports) => {
    return (lamports / 1e9).toFixed(4) + ' SOL'
  }

  const formatInvoiceStatus = (status) => {
    const statusMap = {
      pending: 'Pending',
      paid: 'Paid',
      cancelled: 'Cancelled',
      expired: 'Expired'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status) => {
    const colorMap = {
      pending: 'text-yellow-400',
      paid: 'text-green-400',
      cancelled: 'text-red-400',
      expired: 'text-gray-400'
    }
    return colorMap[status] || 'text-gray-400'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  // Get recent invoices (limit to first 10)
  const displayInvoices = invoices.slice(0, 10)

  // Filter and search rates - adapted for new data structure
  const filteredRates = rates.filter(rate => {
    if (!searchQuery.trim()) {
      // If no search query, show active first
      return true
    }

    const query = searchQuery.toLowerCase()
    const matchesDirection = rate.direction?.toLowerCase().includes(query)

    // Handle codes as array
    const codesMatch = Array.isArray(rate.codes)
      ? rate.codes.some(code => code.toString().toLowerCase().includes(query))
      : rate.codes?.toString().toLowerCase().includes(query)

    const matchesRouteName = rate.routename?.toLowerCase().includes(query)

    return matchesDirection || codesMatch || matchesRouteName
  })

  // Sort by active first (unless searching), then by priority, then by cost
  const sortedRates = filteredRates.sort((a, b) => {
    // If no search query, prioritize active rates
    if (!searchQuery.trim()) {
      if (a.active !== b.active) {
        return b.active - a.active // true (1) comes before false (0)
      }
    }

    // Sort by priority (lower number = higher priority)
    if (a.priority !== b.priority) {
      return (a.priority || 999) - (b.priority || 999)
    }

    // Then sort by cost (lowest to highest for better rates)
    return (a.cost || 0) - (b.cost || 0)
  })

  // Take first 50 records to show more data
  const displayRates = sortedRates.slice(0, 50).map((rate, index) => {
    // Count how many times this ID appears before this index
    const sameIdCount = sortedRates.slice(0, index).filter(r => r.id === rate.id).length
    const displayId = sameIdCount > 0 ? `${rate.id}-${sameIdCount + 1}` : rate.id

    // Format codes for display (handle array)
    const formattedCodes = Array.isArray(rate.codes)
      ? rate.codes.join(', ')
      : rate.codes?.toString() || '-'

    return {
      ...rate,
      displayId,
      formattedCodes,
      uniqueKey: `${rate.id}_${rate.priority}_${index}` // Use id + priority + index for React key prop
    }
  })

  return (
    <>
      <div className="space-y-6 h-full">
        {/* Balance Card */}
        <div className="card p-6">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl text-white/70">Balance</h2>
            <div className="bg-white/10 px-4 py-2 rounded-full">
              <span className="text-white/70 text-sm">on-chain • SOL</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Balance */}
            <div className="lg:col-span-2">
              {/* Balance Display */}
              <div className="mb-4">
                <div className="flex items-center gap-3">
                  <div className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
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
                      className={`w-5 h-5 ${isRefreshingBalance ? 'animate-spin' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                </div>
                <p className={`text-sm mt-1 ${isUserActive() ? 'text-green-400' : 'text-yellow-400'}`}>
                  {isUserActive()
                    ? 'Account active — ready for calls'
                    : 'Low balance — please top up before a call.'
                  }
                </p>

                {/* Invoice Action Buttons - Show if there's a pending invoice */}
                {firstPendingInvoice && (
                  <div className="mt-3">
                    <div className="text-xs text-white/60 text-center mb-2">
                      Pending invoice: {formatInvoiceAmount(firstPendingInvoice.lamports)} • Expires {formatDate(firstPendingInvoice.expiresAt)}
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
                  <div className="mt-3 mb-3 p-3 bg-blue-600/20 border border-blue-600/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-400 text-sm font-medium">Payment Processing</span>
                    </div>
                    <p className="text-white/70 text-xs">
                      Your {formatInvoiceAmount(latestProcessingInvoice.lamports)} payment is being processed.
                      Top-up buttons are disabled until processing completes (up to 10 minutes).
                    </p>
                  </div>
                )}

                {/* Wallet Connection */}
                <div className="mt-3">
                  <button
                    onClick={isWalletConnected ? handleDisconnectWallet : handleConnectWallet}
                    disabled={isConnecting}
                    className={`w-full py-2 px-4 rounded-xl text-sm font-medium transition-all ${isConnecting
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
                    <div className="mt-1 text-xs text-white/60 break-all text-center">
                      Connected: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Top Up */}
            <div className="space-y-3">
              {/* Quick Add Balance Buttons */}
              <div className="space-y-3 mb-4">
                <h3 className="text-white/70 text-sm">Quick Add Balance</h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickTopUp(amount)}
                      disabled={!isWalletConnected || isTopUpLoading || hasActiveInvoice() || firstPendingInvoice || latestProcessingInvoice}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${!isWalletConnected || isTopUpLoading || hasActiveInvoice() || firstPendingInvoice || latestProcessingInvoice
                          ? 'bg-gray-600 text-gray-400 border-gray-600 cursor-not-allowed'
                          : topUpAmount === amount.toString()
                            ? 'bg-white text-gray-900 border-white'
                            : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
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
                    step="0.0001"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
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
                    disabled={!isWalletConnected || isTopUpLoading || hasActiveInvoice() || firstPendingInvoice || latestProcessingInvoice}
                    className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none transition-all ${isWalletConnected && !isTopUpLoading && !hasActiveInvoice() && !firstPendingInvoice && !latestProcessingInvoice
                        ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-blue-400'
                        : 'bg-gray-600 border-gray-600 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                      }`}
                  />
                  <button
                    onClick={() => {
                      console.log('🔴 Add button clicked!')
                      handleAddFunds()
                    }}
                    disabled={!isWalletConnected || !topUpAmount || parseFloat(topUpAmount) <= 0 || isTopUpLoading || hasActiveInvoice() || firstPendingInvoice || latestProcessingInvoice}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${isWalletConnected && topUpAmount && parseFloat(topUpAmount) > 0 && !isTopUpLoading && !hasActiveInvoice() && !firstPendingInvoice && !latestProcessingInvoice
                        ? 'bg-white hover:bg-gray-100 text-gray-900'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {isTopUpLoading ? 'Preparing...' : hasActiveInvoice() ? 'Invoice Active' : firstPendingInvoice ? 'Pending Invoice' : latestProcessingInvoice ? 'Payment Processing' : 'Add'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table Card */}
        <div id="recent-invoices-section" className="card p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white/40 rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-white">Recent Invoices</h3>
            </div>
          </div>

          {invoicesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white/70">Loading invoices...</span>
            </div>
          ) : invoicesError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-400 text-sm mb-2">Failed to load invoices</div>
                <div className="text-white/60 text-xs">{invoicesError}</div>
              </div>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className="grid gap-3 pb-4 border-b border-white/10 mb-4 text-xs w-full" style={{ gridTemplateColumns: 'minmax(120px, 25%) minmax(120px, 20%) minmax(80px, 15%) minmax(120px, 20%) minmax(120px, 20%)' }}>
                <div className="text-white/60 font-medium">Invoice ID</div>
                <div className="text-white/60 font-medium">Amount</div>
                <div className="text-white/60 font-medium">Status</div>
                <div className="text-white/60 font-medium">Paid At</div>
                <div className="text-white/60 font-medium">Expires</div>
              </div>

              {/* Table Rows */}
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {displayInvoices.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    No invoices found.
                  </div>
                ) : (
                  displayInvoices.map((invoice) => (
                    <div key={invoice.id} className="grid gap-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-xs w-full" style={{ gridTemplateColumns: 'minmax(120px, 25%) minmax(120px, 20%) minmax(80px, 15%) minmax(120px, 20%) minmax(120px, 20%)' }}>
                      <div className="text-white/70 font-mono">
                        <div className="truncate" title={invoice.id}>
                          {invoice.id ? invoice.id.substring(0, 12) + '...' : '-'}
                        </div>
                      </div>
                      <div className="text-white font-mono">
                        {formatInvoiceAmount(invoice.lamports)}
                      </div>
                      <div className={`font-medium ${getStatusColor(invoice.status)}`}>
                        {formatInvoiceStatus(invoice.status)}
                      </div>
                      <div className="text-white/70">
                        {formatDate(invoice.paidAt)}
                      </div>
                      <div className="text-white/70">
                        {formatDate(invoice.expiresAt)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Results Info */}
              <div className="mt-4 pt-4 border-t border-white/10">
                <div className="text-white/50 text-sm">
                  Showing {displayInvoices.length} of {invoices.length} invoices
                </div>
              </div>
            </>
          )}
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
              <div className="grid gap-3 pb-4 border-b border-white/10 mb-4 text-xs" style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 1fr' }}>
                <div className="text-white/60 font-medium">Active</div>
                <div className="text-white/60 font-medium">Direction</div>
                <div className="text-white/60 font-medium">Codes</div>
                <div className="text-white/60 font-medium">Route</div>
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
                    <div key={rate.uniqueKey} className="grid gap-3 py-2 hover:bg-white/5 rounded-lg transition-colors text-xs" style={{ gridTemplateColumns: '40px 2fr 1fr 1fr 1fr' }}>
                      <div className="flex items-center justify-center">
                        <div className={`w-2 h-2 rounded-full ${rate.active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      </div>
                      <div className="text-white">
                        <div className="truncate" title={rate.direction}>
                          {rate.direction ? (rate.direction.length > 35 ? rate.direction.substring(0, 35) + '...' : rate.direction) : '-'}
                        </div>
                      </div>
                      <div className="text-white/70 font-mono relative group">
                        <div className="truncate cursor-help">
                          {rate.formattedCodes.length > 20 ? rate.formattedCodes.substring(0, 20) + '...' : rate.formattedCodes}
                        </div>
                        {rate.formattedCodes.length > 20 && (
                          <div className="absolute bottom-full left-0 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10 whitespace-nowrap">
                            {rate.formattedCodes}
                          </div>
                        )}
                      </div>
                      <div className="text-white/70">
                        <div className="truncate" title={rate.routename}>
                          {rate.routename ? (rate.routename.length > 18 ? rate.routename.substring(0, 18) + '...' : rate.routename) : '-'}
                        </div>
                      </div>
                      <div className="text-white font-mono text-right">
                        {rate.displaycost || '0'} {rate.displaycurrency || ''}
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

export default BalanceModule