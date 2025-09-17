import { createContext, useContext, useState, useEffect } from 'react'
import { paymentsAPI, paymentsUtils } from '../services/payments'
import { solanaService } from '../services/solana'
import { useUser } from './UserContext'
import { useWallet } from './WalletProvider'
import { useInvoices } from './InvoicesProvider'

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

  // Fetch balance from API
  const fetchBalance = async () => {
    // Don't fetch if no user is authenticated
    if (!user) {
      console.log('💰 BalanceProvider: Cannot fetch balance - no user authenticated')
      return
    }

    console.log('💰 BalanceProvider: Fetching user balance...')
    setIsLoading(true)
    setError(null)

    try {
      const result = await paymentsAPI.getBalance()

      if (result.success) {
        console.log('💰 BalanceProvider: Balance fetched successfully:', result.data.balances)
        setBalance(result.data.balances)

        // Update user status if it has changed
        if (user && result.data.balances.status !== user.status) {
          console.log('💰 BalanceProvider: User status changed from', user.status, 'to', result.data.balances.status)
          updateUser({
            ...user,
            status: result.data.balances.status
          })
        }

        // Store in session storage for quick access
        sessionStorage.setItem('userBalance', JSON.stringify(result.data.balances))
      } else {
        console.error('💰 BalanceProvider: Failed to fetch balance:', result.error)
        setError(result.error)
      }
    } catch (error) {
      console.error('💰 BalanceProvider: Error fetching balance:', error)
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
        console.log('💰 BalanceProvider: No user authenticated, skipping balance fetch')
        return
      }

      console.log('💰 BalanceProvider: User authenticated, initializing balance')

      // Try to get cached balance first
      const cachedBalance = sessionStorage.getItem('userBalance')

      if (cachedBalance) {
        try {
          const parsedBalance = JSON.parse(cachedBalance)
          console.log('💰 BalanceProvider: Using cached balance:', parsedBalance)
          setBalance(parsedBalance)
        } catch (error) {
          console.error('💰 BalanceProvider: Error parsing cached balance:', error)
        }
      }

      // Always fetch fresh balance when user is available
      fetchBalance()
    }

    initializeBalance()
  }, [user]) // Dependency on user

  // Top up balance function
  const topUpBalance = async (solAmount) => {
    console.log('🔥 BalanceProvider: topUpBalance called with', solAmount, 'SOL')
    console.log('🔥 BalanceProvider: user:', !!user, 'walletProvider:', !!walletProvider)

    // Don't allow top-up if no user is authenticated
    if (!user) {
      console.log('💰 BalanceProvider: Cannot top-up balance - no user authenticated')
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    // Don't allow top-up if wallet is not connected
    if (!walletProvider) {
      console.log('💰 BalanceProvider: Cannot top-up balance - wallet not connected')
      return {
        success: false,
        error: 'Wallet not connected'
      }
    }

    console.log('💰 BalanceProvider: Starting top-up for', solAmount, 'SOL')
    setIsTopUpLoading(true)
    setError(null)

    try {
      // Convert SOL to lamports
      const lamports = paymentsUtils.solToLamports(solAmount)

      console.log('💰 BalanceProvider: Preparing invoice for', lamports, 'lamports')

      // Prepare invoice
      const prepareResult = await paymentsAPI.prepareInvoice(lamports)

      if (prepareResult.success) {
        console.log('💰 BalanceProvider: Invoice prepared successfully:', prepareResult.data)
        setActiveInvoice(prepareResult.data)

        // Invalidate invoices cache since we got 200 from prepare
        invalidateInvoices()

        // Return the prepared invoice data for the component to handle payment
        return {
          success: true,
          data: prepareResult.data
        }
      } else {
        console.error('💰 BalanceProvider: Failed to prepare invoice:', prepareResult.error)
        setError(prepareResult.error)

        return {
          success: false,
          error: prepareResult.error
        }
      }
    } catch (error) {
      console.error('💰 BalanceProvider: Error in top-up process:', error)
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

    console.log('💰 BalanceProvider: Cancelling invoice:', activeInvoice.invoice)
    setIsLoading(true)

    try {
      // Extract invoice ID from the invoice field (assuming it's the ID)
      const invoiceId = activeInvoice.invoice

      const result = await paymentsAPI.cancelInvoice(invoiceId)

      if (result.success) {
        console.log('💰 BalanceProvider: Invoice cancelled successfully')
        setActiveInvoice(null)

        return {
          success: true
        }
      } else {
        console.error('💰 BalanceProvider: Failed to cancel invoice:', result.error)
        setError(result.error)

        return {
          success: false,
          error: result.error
        }
      }
    } catch (error) {
      console.error('💰 BalanceProvider: Error cancelling invoice:', error)
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
    console.log('💰 BalanceProvider: Clearing active invoice')
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