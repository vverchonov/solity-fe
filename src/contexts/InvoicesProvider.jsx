import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { paymentsAPI } from '../services/payments'
import { useUser } from './UserContext'

const InvoicesContext = createContext()

export const useInvoices = () => {
  const context = useContext(InvoicesContext)
  if (!context) {
    throw new Error('useInvoices must be used within an InvoicesProvider')
  }
  return context
}

export const InvoicesProvider = ({ children }) => {
  const { user } = useUser()

  const [invoices, setInvoices] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)
  const [currentOffset, setCurrentOffset] = useState(0)

  // Fetch invoices from API
  const fetchInvoices = useCallback(async (offset = 0, limit = 20, reset = false) => {
    if (!user) {
      console.log('💳 InvoicesProvider: Cannot fetch invoices - no user authenticated')
      return
    }

    console.log('💳 InvoicesProvider: Fetching invoices...', { offset, limit, reset })
    setIsLoading(true)
    setError(null)

    try {
      const result = await paymentsAPI.getInvoices(offset, limit)

      if (result.success) {
        console.log('💳 InvoicesProvider: Invoices fetched successfully:', result.data)

        const newInvoices = result.data.invoices || []
        const totalCount = result.data.total || 0

        if (reset || offset === 0) {
          // Reset the list (first load or refresh)
          setInvoices(newInvoices)
          setCurrentOffset(newInvoices.length)
        } else {
          // Append to existing list (load more)
          setInvoices(prev => [...prev, ...newInvoices])
          setCurrentOffset(prev => prev + newInvoices.length)
        }

        // Check if there are more invoices to load
        setHasMore(currentOffset + newInvoices.length < totalCount)

        // Cache in session storage
        if (reset || offset === 0) {
          sessionStorage.setItem('userInvoices', JSON.stringify(newInvoices))
        }
      } else {
        console.error('💳 InvoicesProvider: Failed to fetch invoices:', result.error)
        setError(result.error)
      }
    } catch (error) {
      console.error('💳 InvoicesProvider: Error fetching invoices:', error)
      setError('Failed to fetch invoices')
    } finally {
      setIsLoading(false)
    }
  }, [user, currentOffset])

  // Initialize invoices when user is available
  useEffect(() => {
    const initializeInvoices = () => {
      if (!user) {
        console.log('💳 InvoicesProvider: No user authenticated, skipping invoices fetch')
        return
      }

      console.log('💳 InvoicesProvider: User authenticated, initializing invoices')

      // Try to get cached invoices first
      const cachedInvoices = sessionStorage.getItem('userInvoices')

      if (cachedInvoices) {
        try {
          const parsedInvoices = JSON.parse(cachedInvoices)
          console.log('💳 InvoicesProvider: Using cached invoices:', parsedInvoices)
          setInvoices(parsedInvoices)
          setCurrentOffset(parsedInvoices.length)
        } catch (error) {
          console.error('💳 InvoicesProvider: Error parsing cached invoices:', error)
        }
      }

      // Always fetch fresh invoices
      fetchInvoices(0, 20, true)
    }

    initializeInvoices()
  }, [user, fetchInvoices])

  // Load more invoices (pagination)
  const loadMoreInvoices = async () => {
    if (!hasMore || isLoading) return
    await fetchInvoices(currentOffset, 20, false)
  }

  // Refresh invoices (invalidate cache and refetch)
  const refreshInvoices = async () => {
    console.log('💳 InvoicesProvider: Refreshing invoices...')
    setCurrentOffset(0)
    setHasMore(true)
    await fetchInvoices(0, 20, true)
  }

  // Invalidate invoices cache - call this after prepare invoice success
  const invalidateInvoices = () => {
    console.log('💳 InvoicesProvider: Invalidating invoices cache')

    // Clear cached data
    sessionStorage.removeItem('userInvoices')

    // Reset pagination state
    setCurrentOffset(0)
    setHasMore(true)

    // Refresh invoices from server
    refreshInvoices()
  }

  // Get invoice by ID
  const getInvoiceById = async (invoiceId) => {
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    console.log('💳 InvoicesProvider: Fetching invoice by ID:', invoiceId)

    try {
      const result = await paymentsAPI.getInvoiceById(invoiceId)
      return result
    } catch (error) {
      console.error('💳 InvoicesProvider: Error fetching invoice by ID:', error)
      return {
        success: false,
        error: 'Failed to fetch invoice'
      }
    }
  }

  // Get pending invoices
  const getPendingInvoices = () => {
    return invoices.filter(invoice => invoice.status === 'pending')
  }

  // Get paid invoices
  const getPaidInvoices = () => {
    return invoices.filter(invoice => invoice.status === 'paid')
  }

  // Check if invoice exists
  const hasInvoice = (invoiceId) => {
    return invoices.some(invoice => invoice.id === invoiceId)
  }

  // Cancel invoice
  const cancelInvoice = async (invoiceId) => {
    if (!user) {
      return {
        success: false,
        error: 'User not authenticated'
      }
    }

    console.log('💳 InvoicesProvider: Cancelling invoice:', invoiceId)

    try {
      const result = await paymentsAPI.cancelInvoice(invoiceId)

      if (result.success) {
        console.log('💳 InvoicesProvider: Invoice cancelled successfully')

        // Update local invoice status to cancelled
        setInvoices(prevInvoices =>
          prevInvoices.map(invoice =>
            invoice.id === invoiceId
              ? { ...invoice, status: 'cancelled' }
              : invoice
          )
        )

        // Also refresh invoices to get the latest state
        refreshInvoices()

        return {
          success: true,
          data: result.data
        }
      } else {
        console.error('💳 InvoicesProvider: Failed to cancel invoice:', result.error)
        return {
          success: false,
          error: result.error
        }
      }
    } catch (error) {
      console.error('💳 InvoicesProvider: Error cancelling invoice:', error)
      return {
        success: false,
        error: 'Failed to cancel invoice'
      }
    }
  }

  const value = {
    // State
    invoices,
    isLoading,
    error,
    hasMore,

    // Actions
    fetchInvoices,
    loadMoreInvoices,
    refreshInvoices,
    invalidateInvoices, // Key function to call after prepare success
    cancelInvoice, // Cancel invoice function
    getInvoiceById,

    // Computed values
    getPendingInvoices,
    getPaidInvoices,
    hasInvoice,

    // Stats
    totalInvoices: invoices.length,
    pendingCount: getPendingInvoices().length,
    paidCount: getPaidInvoices().length
  }

  return (
    <InvoicesContext.Provider value={value}>
      {children}
    </InvoicesContext.Provider>
  )
}

export default InvoicesProvider