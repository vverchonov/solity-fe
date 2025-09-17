import apiClient from '../lib/axios'

// Payments and Balance API functions
export const paymentsAPI = {
  // Get User Balance
  getBalance: async () => {
    try {
      const response = await apiClient.get('/user/balance')

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get balance'
      }
    }
  },

  // Get User Journal with pagination
  getJournal: async (offset = 0, limit = 20) => {
    try {
      const response = await apiClient.get('/user/journal', {
        params: {
          offset,
          limit
        }
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get journal'
      }
    }
  },

  // Prepare Invoice
  prepareInvoice: async (lamports) => {
    try {
      const response = await apiClient.post('/user/invoices/prepare', {
        lamports
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to prepare invoice'
      }
    }
  },

  // Cancel Invoice
  cancelInvoice: async (invoiceId) => {
    try {
      const response = await apiClient.post('/user/invoices/cancel', {
        id: invoiceId
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to cancel invoice'
      }
    }
  },

  // Get User Invoices with pagination
  getInvoices: async (offset = 0, limit = 20) => {
    try {
      const response = await apiClient.get('/user/invoices', {
        params: {
          offset,
          limit
        }
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get invoices'
      }
    }
  },

  // Get Invoice by ID
  getInvoiceById: async (invoiceId) => {
    try {
      const response = await apiClient.get(`/user/invoices/${invoiceId}`)

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to get invoice'
      }
    }
  },

  // Complete Invoice (mark as processing with signature)
  completeInvoice: async (invoiceId, signature) => {
    try {
      const requestBody = {
        id: invoiceId,
        signature: signature
      }

      const response = await apiClient.post('/user/invoices/complete', requestBody)

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to complete invoice'
      }
    }
  }
}

// Utility functions for working with payments data
export const paymentsUtils = {
  // Convert lamports to SOL
  lamportsToSol: (lamports) => {
    return lamports / 1e9
  },

  // Convert SOL to lamports
  solToLamports: (sol) => {
    return Math.round(sol * 1e9)
  },

  // Format SOL amount for display
  formatSol: (lamports) => {
    const sol = paymentsUtils.lamportsToSol(lamports)
    return sol.toFixed(4)
  },

  // Format USD amount for display
  formatUsd: (usdAmount) => {
    return usdAmount.toFixed(2)
  },

  // Get journal entry display text
  getJournalKindDisplay: (kind) => {
    const kindMap = {
      deposit: 'Deposit',
      withdrawal: 'Withdrawal',
      call: 'Call',
      sms: 'SMS',
      other: 'Other'
    }
    return kindMap[kind] || 'Unknown'
  },

  // Get invoice status display
  getInvoiceStatusDisplay: (status) => {
    const statusMap = {
      pending: 'Pending',
      paid: 'Paid',
      cancelled: 'Cancelled',
      expired: 'Expired'
    }
    return statusMap[status] || 'Unknown'
  },

  // Get status color for UI
  getStatusColor: (status) => {
    const colorMap = {
      pending: 'text-yellow-400',
      paid: 'text-green-400',
      cancelled: 'text-red-400',
      expired: 'text-gray-400',
      active: 'text-green-400',
      inactive: 'text-yellow-400',
      banned: 'text-red-400'
    }
    return colorMap[status] || 'text-gray-400'
  },

  // Check if invoice is still valid
  isInvoiceValid: (invoice) => {
    return invoice.status === 'pending' && new Date(invoice.expiresAt) > new Date()
  },

  // Get time remaining for invoice
  getInvoiceTimeRemaining: (expiresAt) => {
    const now = new Date()
    const expires = new Date(expiresAt)
    const diff = expires - now

    if (diff <= 0) return 'Expired'

    const minutes = Math.floor(diff / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }
}

export default paymentsAPI