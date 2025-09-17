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
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await paymentsAPI.getInvoices(offset, limit)

      if (result.success) {

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
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to fetch invoices')
    } finally {
      setIsLoading(false)
    }
  }, [user, currentOffset])

  // Initialize invoices when user is available
  useEffect(() => {
    const initializeInvoices = () => {
      if (!user) {
        return
      }


      // Try to get cached invoices first
      const cachedInvoices = sessionStorage.getItem('userInvoices')

      if (cachedInvoices) {
        try {
          const parsedInvoices = JSON.parse(cachedInvoices)
          setInvoices(parsedInvoices)
          setCurrentOffset(parsedInvoices.length)
        } catch (error) {
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
    setCurrentOffset(0)
    setHasMore(true)
    await fetchInvoices(0, 20, true)
  }

  // Invalidate invoices cache - call this after prepare invoice success
  const invalidateInvoices = () => {

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


    try {
      const result = await paymentsAPI.getInvoiceById(invoiceId)
      return result
    } catch (error) {
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


    try {
      const result = await paymentsAPI.cancelInvoice(invoiceId)

      if (result.success) {

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
        return {
          success: false,
          error: result.error
        }
      }
    } catch (error) {
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