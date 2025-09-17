import apiClient from '../lib/axios'

// Rates API functions
export const ratesAPI = {
  // Get all current call rates
  getCurrentRates: async () => {
    try {
      const response = await apiClient.get('/rates/current')

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to get rates'
      }
    }
  },

  // Resolve rate for specific phone number (not used for now)
  resolveRate: async (phoneNumber) => {
    try {
      const response = await apiClient.post('/rates/resolve', {
        phone: phoneNumber
      })

      return {
        success: true,
        data: response.data
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to resolve rate'
      }
    }
  }
}

export default ratesAPI