import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRates } from '../contexts/RatesProvider'
import { useWallet } from '../contexts/WalletProvider'
import { useBalance } from '../contexts/BalanceProvider'
import { useInvoices } from '../contexts/InvoicesProvider'
import { useLogs } from '../contexts/LogsProvider'
import { useUser } from '../contexts/UserContext'
import { useI18n } from '../contexts/I18nProvider'
import { paymentsAPI } from '../services/payments'
import { solanaService } from '../services/solana'
import { authAPI } from '../services/auth'
import apiClient from '../lib/axios'

function BalanceModule({ onNavigateToSupport }) {
  const [topUpAmount, setTopUpAmount] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false)
  const [activeTab, setActiveTab] = useState('invoices')
  const [journal, setJournal] = useState([])
  const [isJournalLoading, setIsJournalLoading] = useState(false)
  const [journalError, setJournalError] = useState(null)
  const navigate = useNavigate()
  const { user, clearUser } = useUser()
  const { t } = useI18n()

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
    logInvoiceCancel,
    logBalanceRefresh
  } = useLogs()

  // Use actual rates from API or fallback to empty array
  const rates = apiRates || []

  const quickAmounts = [0.1, 0.5, 1, 2]

  const handleQuickTopUp = (amount) => {
    setTopUpAmount(amount.toString())
  }


  const handlePayPreparedInvoice = async (invoiceData) => {
    const invoiceId = invoiceData.invoice || invoiceData.id
    logTransactionStart(invoiceId, (invoiceData.lamports / 1e9))

    if (!walletProvider) {
      logTransactionError('Wallet not connected', invoiceId)
      return
    }

    try {
      // Execute Solana payment using the prepared invoice data
      const paymentResult = await solanaService.executePayment(invoiceData, walletProvider)

      if (paymentResult.success) {
        const invoiceId = invoiceData.invoice || invoiceData.id
        logTransactionSigned(paymentResult.signature, invoiceId)
        logTransactionConfirmed(paymentResult.signature, invoiceId)

        // Complete the invoice with the transaction signature
        const completeResult = await paymentsAPI.completeInvoice(invoiceId, paymentResult.signature)

        if (completeResult.success) {
          logInvoiceStatusUpdate(invoiceId, 'pending', 'processing')

          // Refetch invoices and journal immediately after successful completion
          await Promise.all([
            refreshInvoices(),
            fetchJournal()
          ])
        } else {
        }

        // Show processing modal
        setShowProcessingModal(true)

        // Refresh balance immediately after showing modal
        handleRefreshBalance()

        // Also refresh invoices and journal after successful payment (additional refresh)
        setTimeout(() => {
          Promise.all([
            refreshInvoices(),
            fetchJournal()
          ])
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

  const handleAddFunds = async () => {

    if (!isWalletConnected) {
      return
    }

    const amount = parseFloat(topUpAmount)
    if (amount <= 0) {
      return
    }

    const result = await topUpBalance(amount)

    if (result.success) {
      logInvoicePrepare(amount, true, result.data.invoice)
      // Now pay the prepared invoice using the same flow as "Pay Invoice" button
      await handlePayPreparedInvoice(result.data)
      setTopUpAmount('')
    } else {
      logInvoicePrepare(amount, false)
      // Show error message
    }
  }

  const handleConnectWallet = async () => {
    const result = await connectWallet()
    if (!result.success) {
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
      // Clear user state and redirect even if logout fails
      clearUser()
      navigate('/')
    }
  }

  const handleCancelInvoice = async (invoiceId) => {
    const result = await cancelInvoiceFromProvider(invoiceId)

    if (result && result.success) {
      logInvoiceCancel(invoiceId, true)

      // Refresh invoices, journal, and balance to update all state and re-enable buttons
      await Promise.all([
        refreshInvoices(),
        fetchJournal(),
        refreshBalance()
      ])

      // Force a small delay to ensure UI updates properly

    } else {
      logInvoiceCancel(invoiceId, false)
    }
  }

  const handlePayInvoice = async (invoiceId) => {
    logTransactionStart(invoiceId, 0) // Amount will be updated when we get invoice details

    if (!walletProvider) {
      logTransactionError('Wallet not connected', invoiceId)
      return
    }

    try {
      // 1. Get invoice details by ID
      const invoiceResult = await paymentsAPI.getInvoiceById(invoiceId)

      if (!invoiceResult.success) {
        logTransactionError(`Failed to get invoice details: ${invoiceResult.error}`, invoiceId)
        return
      }

      const invoiceResponse = invoiceResult.data

      // Extract the actual invoice data from the nested structure
      const invoiceData = invoiceResponse.invoice || invoiceResponse

      // 2. Execute Solana payment using the invoice data

      const paymentResult = await solanaService.executePayment(invoiceData, walletProvider)

      if (paymentResult.success) {
        logTransactionSigned(paymentResult.signature, invoiceId)
        logTransactionConfirmed(paymentResult.signature, invoiceId)

        // Complete the invoice with the transaction signature
        const completeResult = await paymentsAPI.completeInvoice(invoiceId, paymentResult.signature)

        if (completeResult.success) {
          logInvoiceStatusUpdate(invoiceId, 'pending', 'processing')

          // Refetch invoices and journal immediately after successful completion
          await Promise.all([
            refreshInvoices(),
            fetchJournal()
          ])
        } else {
        }

        // Show processing modal
        setShowProcessingModal(true)

        // Refresh balance immediately after showing modal
        handleRefreshBalance()

        // Also refresh invoices and journal after successful payment
        setTimeout(() => {
          Promise.all([
            refreshInvoices(),
            fetchJournal()
          ])
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

  const fetchJournal = async () => {
    setIsJournalLoading(true)
    setJournalError(null)
    try {
      const response = await apiClient.get('/user/journal', {
        params: {
          offset: 0,
          limit: 100
        }
      })
      if (response.data && response.data.journal) {
        setJournal(response.data.journal)
      } else {
        setJournalError('No journal data received')
      }
    } catch (error) {
      setJournalError(error.response?.data?.error || error.message || 'Failed to fetch journal')
    } finally {
      setIsJournalLoading(false)
    }
  }

  const handleRefreshBalance = async () => {
    setIsRefreshingBalance(true)
    try {
      const result = await paymentsAPI.getBalance()

      if (result.success) {
        // The BalanceProvider will automatically update when we call refreshBalance
        refreshBalance()
        logBalanceRefresh(true)
        // Also refresh invoices and journal
        await Promise.all([
          refreshInvoices(),
          fetchJournal()
        ])
      } else {
        logBalanceRefresh(false, result.error)
      }
    } catch (error) {
      logBalanceRefresh(false, error.message)
    } finally {
      setIsRefreshingBalance(false)
    }
  }

  // Fetch journal on component mount
  useEffect(() => {
    fetchJournal()
  }, [])

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
    const result = invoices.some(invoice => invoice.status === 'pending' || invoice.status === 'processing')
    console.log('BalanceModule shouldDisableTopUp check:', {
      invoicesCount: invoices.length,
      invoiceStatuses: invoices.map(inv => ({ id: inv.id, status: inv.status })),
      shouldDisable: result
    })
    return result
  }, [invoices])

  // Poll invoices every 15 seconds when first invoice is pending or processing
  useEffect(() => {
    if (!shouldDisableTopUp) return

    const pollInterval = setInterval(() => {
      console.log('Polling for invoice status updates...')
      refreshInvoices()
    }, 15000) // 15 seconds

    return () => clearInterval(pollInterval)
  }, [shouldDisableTopUp, refreshInvoices])

  // Helper functions for invoice display
  const formatInvoiceAmount = (lamports) => {
    return (lamports / 1e9).toFixed(4) + ' SOL'
  }

  // Get appropriate button text based on current state
  const getTopUpButtonText = () => {
    if (isTopUpLoading) return t('balance.preparing')
    if (hasActiveInvoice()) return t('balance.invoiceActive')
    if (shouldDisableTopUp) {
      const pendingInvoice = invoices.find(invoice => invoice.status === 'pending')
      const processingInvoice = invoices.find(invoice => invoice.status === 'processing')
      if (pendingInvoice) return t('balance.pendingInvoice')
      if (processingInvoice) return t('balance.paymentProcessing')
    }
    return t('balance.add')
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

  // Helper functions for journal display
  const formatJournalAmount = (lamports) => {
    const amount = Math.abs(lamports / 1e9)
    return amount.toFixed(6) + ' SOL'
  }

  const getJournalTypeColor = (kind) => {
    switch (kind) {
      case 'deposit':
        return 'text-green-400'
      case 'withdrawal':
        return 'text-red-400'
      case 'call':
        return 'text-blue-400'
      case 'sms':
        return 'text-purple-400'
      default:
        return 'text-white/70'
    }
  }

  const formatJournalKind = (kind) => {
    const kindMap = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      call: 'Call',
      sms: 'SMS',
      other: 'Other'
    }
    return kindMap[kind] || kind
  }

  // Get recent invoices and journal entries (limit to first 10)
  const displayInvoices = invoices.slice(0, 10)
  const displayJournal = journal.slice(0, 10)

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

  // Take first 10 records to show more data
  const displayRates = sortedRates.slice(0, 10).map((rate, index) => {
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
      <div className="space-y-6 h-full max-h-full overflow-hidden flex flex-col">
        {/* Balance Card */}
        <div className="card p-6 flex-shrink-0">
          <div className="flex justify-between items-start mb-6">
            <h2 className="text-2xl text-white/70">{t('balance.title')}</h2>
            <div className="bg-white/10 px-4 py-2 rounded-full">
              <span className="text-white/70 text-sm">{t('balance.onChainSol')}</span>
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
                    title={t('balance.refreshBalance')}
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
                    ? t('balance.accountActive')
                    : t('balance.lowBalance')
                  }
                </p>

                {/* Invoice Action Buttons - Show if there's a pending invoice */}
                {firstPendingInvoice && (
                  <div className="mt-3">
                    <div className="text-xs text-white/60 text-center mb-2">
                      {t('balance.pendingInvoice')}: {formatInvoiceAmount(firstPendingInvoice.lamports)} • {t('balance.expires')} {formatDate(firstPendingInvoice.expiresAt)}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCancelInvoice(firstPendingInvoice.id)}
                        className="flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-600/30 hover:border-red-600/50"
                      >
                        {t('balance.cancel')}
                      </button>
                      <button
                        onClick={() => handlePayInvoice(firstPendingInvoice.id)}
                        disabled={!isWalletConnected}
                        className={`flex-1 py-2 px-4 rounded-xl text-sm font-medium transition-all ${isWalletConnected
                          ? 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border border-green-600/30 hover:border-green-600/50'
                          : 'bg-gray-600/20 text-gray-500 border border-gray-600/30 cursor-not-allowed'
                          }`}
                      >
                        {t('balance.payInvoice')}
                      </button>
                    </div>
                  </div>
                )}

                {/* Processing Invoice Notification */}
                {latestProcessingInvoice && (
                  <div className="mt-3 mb-3 p-3 bg-blue-600/20 border border-blue-600/30 rounded-xl">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                      <span className="text-blue-400 text-sm font-medium">{t('balance.paymentProcessing')}</span>
                    </div>
                    <p className="text-white/70 text-xs">
                      {t('balance.paymentProcessingMessage').replace('{amount}', formatInvoiceAmount(latestProcessingInvoice.lamports))}
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
                        ? t('balance.connecting')
                        : isWalletConnected
                          ? t('balance.disconnectWallet')
                          : t('balance.connectPhantomWallet')
                      }
                    </div>
                  </button>
                  {isWalletConnected && walletAddress && (
                    <div className="mt-1 text-xs text-white/60 break-all text-center">
                      {t('balance.connected')}: {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Top Up */}
            <div className="space-y-3">
              {/* Quick Add Balance Buttons */}
              <div className="space-y-3 mb-4">
                <h3 className="text-white/70 text-sm">{t('balance.quickAddBalance')}</h3>
                <div className="grid grid-cols-2 gap-2">
                  {quickAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => handleQuickTopUp(amount)}
                      disabled={!isWalletConnected || isTopUpLoading || hasActiveInvoice() || shouldDisableTopUp}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all border ${!isWalletConnected || isTopUpLoading || hasActiveInvoice() || shouldDisableTopUp
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
                <h3 className="text-white/70 text-sm mb-2">{t('balance.customAmount')}</h3>
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
                    placeholder={t('balance.enterSolAmount')}
                    disabled={!isWalletConnected || isTopUpLoading || hasActiveInvoice() || shouldDisableTopUp}
                    className={`flex-1 border rounded-xl px-3 py-2 text-sm focus:outline-none transition-all ${isWalletConnected && !isTopUpLoading && !hasActiveInvoice() && !shouldDisableTopUp
                      ? 'bg-white/5 border-white/10 text-white placeholder-white/40 focus:border-blue-400'
                      : 'bg-gray-600 border-gray-600 text-gray-400 placeholder-gray-500 cursor-not-allowed'
                      }`}
                  />
                  <button
                    onClick={() => {
                      handleAddFunds()
                    }}
                    disabled={!isWalletConnected || !topUpAmount || parseFloat(topUpAmount) <= 0 || isTopUpLoading || hasActiveInvoice() || shouldDisableTopUp}
                    className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${isWalletConnected && topUpAmount && parseFloat(topUpAmount) > 0 && !isTopUpLoading && !hasActiveInvoice() && !shouldDisableTopUp
                      ? 'bg-white hover:bg-gray-100 text-gray-900'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      }`}
                  >
                    {getTopUpButtonText()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices & Journal Card */}
        <div id="recent-invoices-section" className="card p-6 h-96 flex-shrink-0">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white/40 rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-white">{t('balance.recentActivity')}</h3>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-4 bg-white/5 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('invoices')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'invoices'
                ? 'bg-white text-gray-900'
                : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
            >
              {t('balance.invoices')} ({displayInvoices.length})
            </button>
            <button
              onClick={() => setActiveTab('journal')}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'journal'
                ? 'bg-white text-gray-900'
                : 'text-white/70 hover:text-white hover:bg-white/5'
                }`}
            >
              {t('balance.journal')} ({displayJournal.length})
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'invoices' ? (
            /* Invoices Tab Content */
            invoicesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3 text-white/70">Loading invoices...</span>
              </div>
            ) : invoicesError ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-400 text-sm mb-2">Failed to load invoices</div>
                  <div className="text-white/60 text-xs">{invoicesError}</div>
                </div>
              </div>
            ) : (
              <>
                {/* Invoices Table with Shared Horizontal Scroll */}
                <div className="overflow-x-auto">
                  <div className="min-w-[700px] w-full">
                    {/* Invoices Table Header */}
                    <div className="grid gap-3 pb-4 border-b border-white/10 mb-4 text-xs" style={{ gridTemplateColumns: 'minmax(120px, 1.5fr) minmax(120px, 1fr) minmax(60px, 0.6fr) minmax(120px, 1fr) minmax(120px, 1fr)' }}>
                      <div className="text-white/60 font-medium">{t('balance.invoiceId')}</div>
                      <div className="text-white/60 font-medium">Amount</div>
                      <div className="text-white/60 font-medium">Status</div>
                      <div className="text-white/60 font-medium">{t('balance.paidAt')}</div>
                      <div className="text-white/60 font-medium">Expires</div>
                    </div>

                    {/* Invoices Table Rows */}
                    <div className="space-y-2 h-48 overflow-y-auto">
                      {displayInvoices.length === 0 ? (
                        <div className="text-center py-8 text-white/60">
                          {t('balance.noInvoicesFound')}
                        </div>
                      ) : (
                        displayInvoices.map((invoice) => (
                          <div key={invoice.id} className="grid gap-3 py-2 px-2 hover:bg-white/5 rounded-lg transition-colors text-xs" style={{ gridTemplateColumns: 'minmax(120px, 1.5fr) minmax(120px, 1fr) minmax(60px, 0.6fr) minmax(120px, 1fr) minmax(120px, 1fr)' }}>
                            <div className="text-white/70 font-mono">
                              <div className="truncate" title={invoice.id}>
                                {invoice.id ? invoice.id : '-'}
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
                  </div>
                </div>

              </>
            )
          ) : (
            /* Journal Tab Content */
            isJournalLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                <span className="ml-3 text-white/70">Loading journal...</span>
              </div>
            ) : journalError ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-red-400 text-sm mb-2">Failed to load journal</div>
                  <div className="text-white/60 text-xs">{journalError}</div>
                </div>
              </div>
            ) : (
              <>
                {/* Journal Table with Shared Horizontal Scroll */}
                <div className="overflow-x-auto">
                  <div className="min-w-[700px] w-full">
                    {/* Journal Table Header */}
                    <div className="grid gap-3 pb-4 border-b border-white/10 mb-4 text-xs" style={{ gridTemplateColumns: 'minmax(50px, 1fr) minmax(50px, 1fr) minmax(50px, 1fr) minmax(200px, 1fr)' }}>
                      <div className="text-white/60 font-medium">Status</div>
                      <div className="text-white/60 font-medium">Amount</div>
                      <div className="text-white/60 font-medium">Date</div>
                      <div className="text-white/60 font-medium">{t('balance.details')}</div>
                    </div>

                    {/* Journal Table Rows */}
                    <div className="space-y-2 h-48 overflow-y-auto">
                      {displayJournal.length === 0 ? (
                        <div className="text-center py-8 text-white/60">
                          {t('balance.noJournalEntries')}
                        </div>
                      ) : (
                        displayJournal.map((entry) => (
                          <div key={entry.id} className="grid gap-3 py-2 px-2 hover:bg-white/5 rounded-lg transition-colors text-xs" style={{ gridTemplateColumns: 'minmax(50px, 1fr) minmax(50px, 1fr) minmax(50px, 1fr) minmax(200px, 1fr)' }}>
                            <div className={`font-medium ${getJournalTypeColor(entry.kind)}`}>
                              {formatJournalKind(entry.kind)}
                            </div>
                            <div className={`font-mono ${entry.lamports === 0 ? 'text-white/70' : entry.lamports < 0 ? 'text-red-400' : 'text-green-400'}`}>
                              {entry.lamports === 0 ? '‎ ' + formatJournalAmount(entry.lamports) : (entry.lamports < 0 ? '-' : '+') + formatJournalAmount(entry.lamports)}
                            </div>
                            <div className="text-white/70 text-xs">
                              {formatDate(entry.createdAt)}
                            </div>
                            <div className="text-white/70 font-mono">
                              {entry.kind === 'deposit' && entry.reference ? (
                                <a
                                  href={`https://solscan.io/tx/${entry.reference}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 underline transition-colors truncate block"
                                  title={`View transaction on Solscan: ${entry.reference}`}
                                >
                                  {entry.reference.substring(0, 20) + '...'}
                                </a>
                              ) : (entry.kind === 'call' || entry.kind === 'sms') ? (
                                <div className="truncate" title={`${entry.meta?.direction || 'Unknown'} - ${entry.meta?.status || 'Unknown'}`}>
                                  {entry.meta?.direction || 'Unknown'} - {entry.meta?.status || 'Unknown'}
                                </div>
                              ) : (
                                <div className="truncate" title={entry.reference || t('balance.noDetailsAvailable')}>
                                  {entry.reference ? entry.reference.substring(0, 20) + '...' : t('balance.noDetailsAvailable')}
                                </div>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

              </>
            )
          )}
        </div>

        {/* Rates Table Card */}
        <div className="card p-6 min-h-0 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-white/40 rounded-full"></div>
              </div>
              <h3 className="text-xl font-semibold text-white">{t('balance.currentRates')}</h3>
            </div>

            {/* Search Field */}
            <div className="w-64">
              <input
                type="text"
                placeholder={t('balance.searchRates')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
              />
            </div>
          </div>

          {ratesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <span className="ml-3 text-white/70">{t('balance.loadingRates')}</span>
            </div>
          ) : ratesError ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="text-red-400 text-sm mb-2">{t('balance.errorLoadingRates')}</div>
                <div className="text-white/60 text-xs">{ratesError}</div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col min-h-0 flex-1">
              {/* Table Header */}
              <div className="hidden md:grid gap-3 pb-4 border-b border-white/10 mb-4 text-xs items-center flex-shrink-0" style={{ gridTemplateColumns: '60px minmax(120px, 1fr) minmax(200px, 3fr) 120px' }}>
                <div className="text-white/60 font-medium text-left">{t('balance.active')}</div>
                <div className="text-white/60 font-medium">{t('balance.direction')}</div>
                <div className="text-white/60 font-medium">{t('balance.codes')}</div>
                <div className="text-white/60 font-medium text-right">{t('balance.cost')}</div>
              </div>

              {/* Table Rows */}
              <div className="space-y-2 flex-1 overflow-y-auto min-h-0">
                {displayRates.length === 0 ? (
                  <div className="text-center py-8 text-white/60">
                    {searchQuery ? t('balance.noRatesFound') : t('balance.noRatesAvailable')}
                  </div>
                ) : (
                  displayRates.map((rate) => (
                    <div key={rate.uniqueKey} className="hover:bg-white/5 rounded-lg transition-colors">
                      {/* Desktop Layout */}
                      <div className="hidden md:grid gap-3 py-2 px-2 text-xs items-start justify-center" style={{ gridTemplateColumns: '60px minmax(120px, 1fr) minmax(200px, 3fr) 120px' }}>
                        <div className="flex items-center justify-start self-center">
                          <div className={`w-2 h-2 rounded-full ${rate.active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                        </div>
                        <div className="text-white flex items-start self-center">
                          <div className="break-words min-w-0" title={rate.direction}>
                            {rate.direction || '-'}
                          </div>
                        </div>
                        <div className="text-white/70 font-mono flex items-start self-center min-w-0">
                          <div className="break-words text-xs leading-relaxed">
                            {rate.formattedCodes}
                          </div>
                        </div>
                        <div className="text-white font-mono text-right flex items-start justify-end self-center">
                          <span>{rate.displaycost || '0'} {rate.displaycurrency || ''}</span>
                        </div>
                      </div>

                      {/* Mobile Layout */}
                      <div className="md:hidden p-3 space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 justify-center">
                            <div className={`w-2 h-2 rounded-full ${rate.active ? 'bg-green-400' : 'bg-red-400'}`}></div>
                            <span className="text-white/60 text-xs">
                              {rate.active ? t('balance.active') : t('balance.inactive')}
                            </span>
                          </div>
                          <div className="text-white font-mono self-center">
                            {rate.displaycost || '0'} {rate.displaycurrency || ''}
                          </div>
                        </div>
                        <div className="text-white self-center">
                          <span className="text-white/60">{t('balance.direction')}: </span>
                          {rate.direction || '-'}
                        </div>
                        <div className="text-white/70 self-center">
                          <span className="text-white/60">{t('balance.codes')}: </span>
                          <span className="font-mono break-words">
                            {rate.formattedCodes}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Results Info */}
              <div className="mt-4 pt-4 border-t border-white/10 flex-shrink-0">
                <div className="text-white/50 text-sm">
                  {t('balance.showingRates').replace('{count}', displayRates.length).replace('{total}', filteredRates.length)}
                  {searchQuery && ` (${t('balance.filteredFrom').replace('{total}', rates.length)})`}
                </div>
              </div>
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

export default BalanceModule
