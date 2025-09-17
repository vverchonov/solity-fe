import apiClient from '../lib/axios'

// Call-related API functions
export const callAPI = {
  // Start a new call
  startCall: async (phoneNumber, callerID) => {
    try {
      const response = await apiClient.post('/calls/start', {
        phoneNumber,
        callerID
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // End an active call
  endCall: async (callId) => {
    try {
      const response = await apiClient.post(`/calls/${callId}/end`)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Send DTMF tones
  sendDTMF: async (callId, digit) => {
    try {
      const response = await apiClient.post(`/calls/${callId}/dtmf`, {
        digit
      })
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get call status
  getCallStatus: async (callId) => {
    try {
      const response = await apiClient.get(`/calls/${callId}`)
      return response.data
    } catch (error) {
      throw error
    }
  }
}

// Balance-related API functions
export const balanceAPI = {
  // Get current balance
  getBalance: async () => {
    try {
      const response = await apiClient.get('/balance')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Get balance history
  getBalanceHistory: async () => {
    try {
      const response = await apiClient.get('/balance/history')
      return response.data
    } catch (error) {
      throw error
    }
  }
}

// User-related API functions (non-auth)
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    try {
      const response = await apiClient.get('/user/profile')
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Update user settings
  updateSettings: async (settings) => {
    try {
      const response = await apiClient.put('/user/settings', settings)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await apiClient.put('/user/profile', profileData)
      return response.data
    } catch (error) {
      throw error
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await apiClient.put('/user/password', {
        currentPassword,
        newPassword
      })
      return response.data
    } catch (error) {
      throw error
    }
  }
}