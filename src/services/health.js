import apiClient from '../lib/axios'

// Health API functions
export const healthAPI = {
  // Check server health status
  checkHealth: async () => {
    try {
      const response = await apiClient.get('/healthz')

      return {
        success: true,
        data: response.data // Should contain { api: boolean, db: boolean, tele: boolean }
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Health check failed',
        data: {
          api: false,
          db: false,
          tele: false
        }
      }
    }
  }
}

export default healthAPI