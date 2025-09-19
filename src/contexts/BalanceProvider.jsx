import { createContext, useContext, useState, useEffect } from 'react'
import { paymentsAPI, paymentsUtils } from '../services/payments'
import { solanaService } from '../services/solana'
import { useUser } from './UserContext'
import { useWallet } from './WalletProvider'
import { useInvoices } from './InvoicesProvider'
import { apiDebouncer } from '../utils/debounce'

const BalanceContext = createContext()

export const useBalance = () => {
  const context = useContext(BalanceContext)
  if (!context) {
    throw new Error('useBalance must be used within a BalanceProvider')
  }
  return context
}

export const BalanceProvider = ({ children }) => {
  const { user, updateUser } = useUser() // Get user from UserContext
  const { walletProvider } = useWallet() // Get wallet provider for signing transactions
  const { invalidateInvoices } = useInvoices() // Get invalidateInvoices function

  const [balance, setBalance] = useState({
    solBalance: 0,
    usdBalance: 0,
    status: 'inactive'
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeInvoice, setActiveInvoice] = useState(null)
  const [isTopUpLoading, setIsTopUpLoading] = useState(false)

  // Fetch balance from API (debounced)
  const fetchBalance = async () => {
    // Don't fetch if no user is authenticated
    if (!user) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await apiDebouncer.debounce('getBalance', async () => {
        return await paymentsAPI.getBalance()
      })

      if (result.success) {
        setBalance(result.data.balances)

        // Update user status if it has changed
        if (user && result.data.balances.status !== user.status) {
          updateUser({
            ...user,
            status: result.data.balances.status
          })
        }

        // Store in session storage for quick access
        sessionStorage.setItem('userBalance', JSON.stringify(result.data.balances))
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to fetch balance')
    } finally {
      setIsLoading(false)
    }
  }

  // Initialize balance only when user is available
  useEffect(() => {
    const initializeBalance = () => {
      // Only fetch balance if user is authenticated
      if (!user) {
        return
      }


      // Try to get cached balance first
      const cachedBalance = sessionStorage.getItem('userBalance')

      if (cachedBalance) {
        try {
          const parsedBalance = JSON.parse(cachedBalance)
          setBalance(parsedBalance)
        } catch (error) {
        }
      }

      // Always fetch fresh balance when user is available
      fetchBalance()
    }

    initializeBalance()
  }, [user]) // Dependency on user

  // Top up balance function
  const topUpBalance = async (solAmount) => {

    // Don't allow top-up if no user is authenticated
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Don't allow top-up if wallet is not connected
    if (!walletProvider) {
      return {
        success: false,
        error: 'Wallet not connected'
      }
    }

    setIsTopUpLoading(true)
    setError(null)

    try {
      // Convert SOL to lamports
      const lamports = paymentsUtils.solToLamports(solAmount)


      // Prepare invoice (not debounced - single action creates unique invoice)
      const prepareResult = await paymentsAPI.prepareInvoice(lamports)

      if (prepareResult.success) {
        setActiveInvoice(prepareResult.data)

        // Invalidate invoices cache since we got 200 from prepare
        invalidateInvoices()

        // Return the prepared invoice data for the component to handle payment
        return {
          success: true,
          data: prepareResult.data
        }
      } else {
        setError(prepareResult.error)

        return {
          success: false,
          error: prepareResult.error
        }
      }
    } catch (error) {
      const errorMessage = 'Failed to process payment'
      setError(errorMessage)

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsTopUpLoading(false)
    }
  }

  // Cancel active invoice
  const cancelInvoice = async () => {
    if (!activeInvoice) return

    setIsLoading(true)

    try {
      // Extract invoice ID from the invoice field (assuming it's the ID)
      const invoiceId = activeInvoice.invoice

      // Cancel invoice (not debounced - single action)
      const result = await paymentsAPI.cancelInvoice(invoiceId)

      if (result.success) {
        setActiveInvoice(null)

        return {
          success: true
        }
      } else {
        setError(result.error)

        return {
          success: false,
          error: result.error
        }
      }
    } catch (error) {
      const errorMessage = 'Failed to cancel invoice'
      setError(errorMessage)

      return {
        success: false,
        error: errorMessage
      }
    } finally {
      setIsLoading(false)
    }
  }

  // Clear active invoice (when paid or expired)
  const clearActiveInvoice = () => {
    setActiveInvoice(null)
  }

  // Format balance for display
  const getFormattedSolBalance = () => {
    return paymentsUtils.formatSol(balance.solBalance * 1e9) // Assuming balance is in SOL
  }

  const getFormattedUsdBalance = () => {
    return paymentsUtils.formatUsd(balance.usdBalance)
  }

  // Check if user has active status
  const isUserActive = () => {
    return balance.status === 'active'
  }

  const isUserInactive = () => {
    return balance.status === 'inactive'
  }

  const isUserBanned = () => {
    return balance.status === 'banned'
  }

  // Get status color for UI
  const getStatusColor = () => {
    return paymentsUtils.getStatusColor(balance.status)
  }

  // Check if there's an active invoice
  const hasActiveInvoice = () => {
    return activeInvoice && paymentsUtils.isInvoiceValid(activeInvoice)
  }

  // Get invoice time remaining
  const getInvoiceTimeRemaining = () => {
    if (!activeInvoice) return null
    return paymentsUtils.getInvoiceTimeRemaining(activeInvoice.expiresAt)
  }

  // Refresh balance (can be called manually)
  const refreshBalance = async () => {
    await fetchBalance()
  }

  const value = {
    // Balance state
    balance,
    isLoading,
    error,

    // Invoice state
    activeInvoice,
    isTopUpLoading,

    // Actions
    topUpBalance,
    cancelInvoice,
    clearActiveInvoice,
    refreshBalance,

    // Computed values
    getFormattedSolBalance,
    getFormattedUsdBalance,
    isUserActive,
    isUserInactive,
    isUserBanned,
    getStatusColor,
    hasActiveInvoice,
    getInvoiceTimeRemaining
  }

  return (
    <BalanceContext.Provider value={value}>
      {children}
    </BalanceContext.Provider>
  )
}

export default BalanceProvider