import { useState, useEffect, useMemo, useCallback } from 'react'
import { useWallet } from '../contexts/WalletProvider'
import { useBalance } from '../contexts/BalanceProvider'
import { useInvoices } from '../contexts/InvoicesProvider'
import { useLogs } from '../contexts/LogsProvider'
import { useI18n } from '../contexts/I18nProvider'
import { paymentsAPI } from '../services/payments'
import { solanaService } from '../services/solana'
import { apiDebouncer } from '../utils/debounce'

function Balance({ onNavigateToInvoices, onNavigateToSupport }) {
  const [customAmount, setCustomAmount] = useState('')
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const [walletSolBalance, setWalletSolBalance] = useState(0)
  const [isLoadingWalletBalance, setIsLoadingWalletBalance] = useState(false)
  const { t } = useI18n()
  const { isWalletConnected, walletAddress, connectWallet, reconnectWallet } = useWallet()
  const {
    getFormattedSolBalance,
    isUserActive,
    topUpBalance,
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
    logInvoiceCancel,
    logBalanceRefresh,
    logInvoiceRefresh
  } = useLogs()

  const quickAmounts = [0.1, 0.5, 1, 2]

  // Function to refresh wallet SOL balance
  const refreshWalletBalance = useCallback(async () => {
    if (!isWalletConnected || !walletAddress) {
      setWalletSolBalance(0)
      setIsLoadingWalletBalance(false)
      return
    }

    setIsLoadingWalletBalance(true)
    try {
      const balanceResult = await solanaService.getWalletBalance(walletAddress)
      if (balanceResult.success) {
        setWalletSolBalance(balanceResult.balance)
      } else {
        setWalletSolBalance(0)
      }
    } catch (error) {
      setWalletSolBalance(0)
    } finally {
      setIsLoadingWalletBalance(false)
    }
  }, [isWalletConnected, walletAddress])

  const handleAddBalance = async (amount) => {
    // Always allow preparing invoice, even without wallet connection
    const result = await topUpBalance(amount)

    if (result.success) {
      logInvoicePrepare(amount, true, result.data.invoice)
      // Don't proceed with payment automatically - let user choose payment method
    } else {
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


  const handleConnectWallet = async () => {
    const result = await connectWallet()
    if (!result.success) {
    }
  }



  const handleCancelInvoice = async (invoiceId) => {
    const result = await cancelInvoiceFromProvider(invoiceId)

    if (result && result.success) {
      logInvoiceCancel(invoiceId, true)

      // Clear debounce cache to allow immediate refresh after cancellation
      apiDebouncer.clearAll()

      // Refresh both invoices and balance to update all state and re-enable buttons
      await Promise.all([
        refreshInvoices(),
        refreshBalance()
      ])
    } else {
      logInvoiceCancel(invoiceId, false)
    }
  }

  const handlePayWithPhantom = async (invoiceId) => {
    try {
      // Force wallet reconnection before transaction to ensure user signs both login and transaction manually
      const reconnectResult = await reconnectWallet()
      if (!reconnectResult.success) {
        logTransactionError('Failed to reconnect wallet', invoiceId)
        return
      }

      // Get fresh wallet provider after reconnection
      const freshWalletProvider = window.phantom?.solana
      if (!freshWalletProvider) {
        logTransactionError('Wallet not available after reconnection', invoiceId)
        return
      }

      // 1. Get invoice details by ID
      const invoiceResult = await paymentsAPI.getInvoiceById(invoiceId)

      if (!invoiceResult.success) {
        return
      }

      const invoiceResponse = invoiceResult.data

      // Extract the actual invoice data from the nested structure
      const invoiceData = invoiceResponse.invoice || invoiceResponse

      logTransactionStart(invoiceId, (invoiceData.lamports / 1e9))

      // 2. Execute Solana payment using the invoice data
      const paymentResult = await solanaService.executePayment(invoiceData, freshWalletProvider)

      if (paymentResult.success) {
        logTransactionSigned(paymentResult.signature, invoiceId)
        logTransactionConfirmed(paymentResult.signature, invoiceId)

        // Complete the invoice with the transaction signature
        const completeResult = await paymentsAPI.completeInvoice(invoiceId, paymentResult.signature)

        if (completeResult.success) {
          logInvoiceStatusUpdate(invoiceId, 'pending', 'processing')

          // Clear API debounce cache to allow fresh data after transaction
          apiDebouncer.clearAll()

          // Refetch invoices and balance immediately after successful completion
          await Promise.all([
            refreshInvoices(),
            refreshBalance()
          ])
        } else {
        }

        // Show processing modal
        setShowProcessingModal(true)

        // Reconnect wallet after successful transaction to reset session
        setTimeout(async () => {
          try {
            await reconnectWallet()
          } catch (error) {
            console.log('Post-transaction wallet reconnection failed:', error)
          }
        }, 1000)
      } else {

        if (paymentResult.userRejected) {
          logTransactionRejected(invoiceId)
        } else {
          logTransactionError(paymentResult.error, invoiceId)
        }
      }
    } catch (error) {
      logTransactionError(error.message, invoiceId)
    }
  }

  const handlePayWithHelious = async (invoiceId) => {
    // Get the invoice data to extract the Helious payment link
    try {
      const invoiceResult = await paymentsAPI.getInvoiceById(invoiceId)
      if (!invoiceResult.success) {
        return
      }

      const invoiceData = invoiceResult.data.invoice || invoiceResult.data

      // Open Helious payment link (assuming it's provided in the invoice data)
      if (invoiceData.heliousLink || invoiceData.paymentLink || invoiceData.link) {
        const heliousUrl = invoiceData.heliousLink || invoiceData.paymentLink || invoiceData.link
        window.open(heliousUrl, '_blank')
      } else {
        console.error('No Helious payment link found in invoice data')
      }
    } catch (error) {
      console.error('Failed to get invoice for Helious payment:', error)
    }
  }

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true)
    try {
      // Clear cache to ensure fresh data when user manually refreshes
      apiDebouncer.clearAll()

      // Use BalanceProvider's refresh method
      await refreshBalance()
      logBalanceRefresh(true)

      // Also refresh invoices
      await refreshInvoices()
      logInvoiceRefresh(true)
    } catch (error) {
      logBalanceRefresh(false, error.message)
      logInvoiceRefresh(false, error.message)
    } finally {
      setIsRefreshingBalance(false)
    }
  }

  // Get the first pending invoice (most recent incomplete one) - memoized for performance
  const firstPendingInvoice = useMemo(() => {
    const pendingInvoices = getPendingInvoices()
    const result = pendingInvoices.length > 0 ? pendingInvoices[0] : null
    return result
  }, [invoices, getPendingInvoices])

  // Check for processing invoices (most recent one) - memoized for performance
  const latestProcessingInvoice = useMemo(() => {
    const processingInvoices = invoices.filter(invoice => invoice.status === 'processing')
    const result = processingInvoices.length > 0 ? processingInvoices[0] : null
    return result
  }, [invoices])

  // Check if we should disable top-up based on any pending or processing invoice
  const shouldDisableTopUp = useMemo(() => {
    return invoices.some(invoice => invoice.status === 'pending' || invoice.status === 'processing')
  }, [invoices])


  // Check if wallet has insufficient balance for paying invoice
  const hasInsufficientBalanceForInvoice = useMemo(() => {
    if (!firstPendingInvoice || !isWalletConnected || isLoadingWalletBalance) {
      return false // Don't show insufficient balance if wallet is not connected or balance is still loading
    }
    const requiredSol = firstPendingInvoice.lamports / 1e9 // Convert lamports to SOL
    const feeBuffer = 0.001 // Transaction fee buffer
    return walletSolBalance < (requiredSol + feeBuffer)
  }, [firstPendingInvoice, isWalletConnected, walletSolBalance, isLoadingWalletBalance])

  // Refresh wallet balance when wallet connects/disconnects
  useEffect(() => {
    refreshWalletBalance()
  }, [isWalletConnected, walletAddress, refreshWalletBalance])

  // Simplified polling - only poll every 30 seconds when needed, no cascading
  useEffect(() => {
    if (!shouldDisableTopUp) return

    const pollInterval = setInterval(() => {
      refreshInvoices()
    }, 30000) // 30 seconds (longer interval, debouncer will handle duplicates)

    return () => clearInterval(pollInterval)
  }, [shouldDisableTopUp, refreshInvoices])

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
          <h2 className="text-lg text-white/70">{t('balance.title')}</h2>
          <div className="bg-white/10 px-3 py-1 rounded-full flex items-center justify-center">
            <span className="text-white/70 text-xs">{t('balance.onChainSol')}</span>
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
              title={t('balance.refreshBalance')}
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
              ? t('balance.accountActive')
              : t('balance.lowBalance')
            }
          </p>
        </div>

        {/* Quick Add Balance Buttons */}
        <div className="space-y-3 mb-4">
          <h3 className="text-white/70 text-sm">{t('balance.quickAddBalance')}</h3>
          <div className="grid grid-cols-4 gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => setCustomAmount(amount.toString())}
                disabled={shouldDisableTopUp}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${!shouldDisableTopUp
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
          <h3 className="text-white/70 text-sm mb-2">{t('balance.customAmount')}</h3>
          <div className="flex gap-2">
            <input
              type="number"
              value={customAmount}
              onChange={(e) => {
                const value = e.target.value
                // Allow empty value or valid numbers up to 5
                if (value === '' || (parseFloat(value) <= 5 && !isNaN(parseFloat(value)))) {
                  setCustomAmount(value)
                }
              }}
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
              placeholder={t('balance.enterSolAmount')}
              step="0.01"
              min="0"
              max="5"
              disabled={shouldDisableTopUp}
              className={`flex-1 min-w-[80px] border rounded-xl px-3 py-2 text-sm transition-all ${!shouldDisableTopUp
                ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10'
                : 'bg-gray-600 border-gray-600 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                }`}
            />
            <button
              onClick={handleAddCustomAmount}
              disabled={!customAmount || parseFloat(customAmount) <= 0 || shouldDisableTopUp}
              className={`px-4 py-2 text-sm font-medium rounded-xl transition-all flex-1 max-w-[140px] ${customAmount && parseFloat(customAmount) > 0 && !shouldDisableTopUp
                ? 'bg-white hover:bg-gray-100 text-gray-900'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
            >
              {t('balance.add')}
            </button>
          </div>
        </div>

        {/* Invoice Action Buttons - Show if there's a pending invoice */}
        {firstPendingInvoice && (
          <div className="mb-4">
            {/* Payment Method Buttons */}
            <div className="space-y-2">
              {/* Helious Payment Button */}
              <button
                onClick={() => handlePayWithHelious(firstPendingInvoice.id)}
                className="w-full py-3 px-4 rounded-xl text-sm font-medium transition-all bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-600/30 hover:border-orange-600/50 flex items-center justify-center gap-2"
              >
                <span>Pay with Helius</span>
                <img src="/helius.ico" alt="Helius" className="w-4 h-4" />
              </button>

              {/* Phantom Payment Button */}
              <button
                onClick={() => {
                  if (!isWalletConnected) {
                    handleConnectWallet()
                  } else {
                    handlePayWithPhantom(firstPendingInvoice.id)
                  }
                }}
                disabled={isWalletConnected && hasInsufficientBalanceForInvoice}
                className={`w-full py-3 px-4 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                  isWalletConnected && hasInsufficientBalanceForInvoice
                    ? 'bg-gray-600/20 text-gray-500 border border-gray-600/30 cursor-not-allowed'
                    : 'bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-600/30 hover:border-purple-600/50'
                }`}
                title={hasInsufficientBalanceForInvoice ? 'Insufficient SOL in wallet' : ''}
              >
                <span>
                  {hasInsufficientBalanceForInvoice
                    ? 'Insufficient SOL'
                    : !isWalletConnected
                      ? 'Connect'
                      : 'Pay with'
                  }
                </span>
                <img src="/phantom.png" alt="Phantom" className="w-4 h-4" />
              </button>

              {/* Cancel button */}
              <button
                onClick={() => handleCancelInvoice(firstPendingInvoice.id)}
                className="w-full py-2 px-4 rounded-xl text-sm font-medium transition-all bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 hover:border-red-600/50"
              >
                {t('balance.cancel')}
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
                {t('balance.paymentProcessing')} {formatInvoiceAmount(latestProcessingInvoice.lamports)}
              </span>
            </div>
          </div>
        )}

        {/* Invoice Info - Show at bottom if there's a pending invoice */}
        {firstPendingInvoice && (
          <div className="mt-auto pt-3 border-t border-white/10">
            <div
              className="text-xs text-white/60 text-center cursor-pointer hover:text-white/80 transition-colors"
              onClick={() => onNavigateToInvoices && onNavigateToInvoices()}
              title="Click to view all invoices"
            >
              {t('balance.invoice')}: {formatInvoiceAmount(firstPendingInvoice.lamports)} • {t('balance.expires')} {formatDate(firstPendingInvoice.expiresAt)}
            </div>
          </div>
        )}

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
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">{t('balance.paymentSubmitted')}</h3>
              <p className="text-white/80 text-base mb-4">
                {t('balance.paymentSubmittedDesc')}
              </p>
              <p className="text-white/70 text-sm mb-4">
                {t('balance.processingTime')}
              </p>
              <p className="text-white/60 text-sm mb-8">
                {t('balance.problemsContact')}{' '}
                <button
                  onClick={() => {
                    setShowProcessingModal(false)
                    onNavigateToSupport && onNavigateToSupport()
                  }}
                  className="text-blue-400 hover:text-blue-300 underline transition-colors"
                >
                  {t('balance.visitThisPage')}
                </button>
                {' '}{t('balance.andContactUs')}
              </p>
              <button
                onClick={() => setShowProcessingModal(false)}
                className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white rounded-xl font-medium transition-all shadow-lg hover:shadow-xl"
              >
                {t('balance.gotIt')}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default Balance
