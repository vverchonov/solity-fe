import apiClient from '../lib/axios'

// SIP Credentials Service - Handles telephone credentials and caller ID management
export const sipAPI = {
  // Get SIP credentials for user
  getCredentials: async () => {
    try {

      const response = await apiClient.get('/tele/credentials')

      if (response.data) {

        return {
          success: true,
          data: {
            wss: response.data.wss,
            domain: response.data.domain,
            extension: response.data.extension,
            callerID: response.data.callerID,
            password: response.data.password,
            ttl: response.data.ttl
          }
        }
      }

      return {
        success: false,
        error: 'No credentials data received'
      }
    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get SIP credentials'
      }
    }
  },

  // Update caller ID using the new extension endpoint
  updateCallerID: async (callerID) => {
    try {

      const response = await apiClient.patch('/tele/extension', {
        callerID: callerID
      })

      if (response.data) {

        return {
          success: true,
          data: {
            callerID: callerID,
            message: response.data.message || 'Extension updated successfully'
          }
        }
      }

      return {
        success: false,
        error: 'No response data received'
      }
    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update caller ID'
      }
    }
  },

  // Refresh/rotate SIP password
  refreshPassword: async () => {
    try {

      const response = await apiClient.post('/tele/refresh-password')

      if (response.data) {

        return {
          success: true,
          data: {
            password: response.data.password,
            ttl: response.data.ttl,
            message: response.data.message
          }
        }
      }

      return {
        success: false,
        error: 'No response data received'
      }
    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to refresh SIP password'
      }
    }
  },

  // Get SIP connection status
  getConnectionStatus: async () => {
    try {

      const response = await apiClient.get('/tele/status')

      if (response.data) {

        return {
          success: true,
          data: {
            connected: response.data.connected,
            lastConnected: response.data.lastConnected,
            extension: response.data.extension,
            registrationStatus: response.data.registrationStatus
          }
        }
      }

      return {
        success: false,
        error: 'No status data received'
      }
    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get SIP status'
      }
    }
  },

  // Test SIP connection
  testConnection: async () => {
    try {

      const response = await apiClient.post('/tele/test-connection')

      if (response.data) {

        return {
          success: true,
          data: {
            testResult: response.data.testResult,
            latency: response.data.latency,
            message: response.data.message,
            timestamp: response.data.timestamp
          }
        }
      }

      return {
        success: false,
        error: 'No test result received'
      }
    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to test SIP connection'
      }
    }
  },

  // Get available caller ID numbers
  getAvailableCallerIDs: async () => {
    try {

      const response = await apiClient.get('/tele/available-caller-ids')

      if (response.data) {

        return {
          success: true,
          data: {
            callerIDs: response.data.callerIDs || [],
            currentCallerID: response.data.currentCallerID,
            allowCustom: response.data.allowCustom || false
          }
        }
      }

      return {
        success: false,
        error: 'No caller ID data received'
      }
    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get available caller IDs'
      }
    }
  },

  // Verify caller ID ownership
  verifyCallerID: async (callerID, verificationCode) => {
    try {

      const response = await apiClient.post('/tele/verify-caller-id', {
        callerID: callerID,
        verificationCode: verificationCode
      })

      if (response.data) {

        return {
          success: true,
          data: {
            verified: response.data.verified,
            callerID: response.data.callerID,
            message: response.data.message
          }
        }
      }

      return {
        success: false,
        error: 'No verification result received'
      }
    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to verify caller ID'
      }
    }
  },

  // Request caller ID verification
  requestCallerIDVerification: async (callerID) => {
    try {

      const response = await apiClient.post('/tele/request-caller-id-verification', {
        callerID: callerID
      })

      if (response.data) {

        return {
          success: true,
          data: {
            verificationId: response.data.verificationId,
            method: response.data.method,
            message: response.data.message,
            expiresIn: response.data.expiresIn
          }
        }
      }

      return {
        success: false,
        error: 'No verification request data received'
      }
    } catch (error) {

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to request caller ID verification'
      }
    }
  }
}

// SIP Connection Helper Functions
export const sipUtils = {
  // Format phone number for SIP
  formatSIPNumber: (phoneNumber) => {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '')

    // US/Canada: 10 digits -> +1XXXXXXXXXX, 11 digits starting with 1 -> +1XXXXXXXXXX
    if (digits.length === 10) {
      return `+1${digits}`
    } else if (digits.length === 11 && digits.startsWith('1')) {
      return `+${digits}`
    }

    // Germany: 11-13 digits starting with 49 -> +49XXXXXXXXXX
    else if (digits.length >= 11 && digits.length <= 13 && digits.startsWith('49')) {
      return `+${digits}`
    }

    // Ukraine: 12 digits starting with 380 -> +380XXXXXXXXX
    else if (digits.length === 12 && digits.startsWith('380')) {
      return `+${digits}`
    }

    return phoneNumber
  },

  // Validate SIP extension format
  isValidExtension: (extension) => {
    // Extensions should be numeric and between 3-6 digits
    const extensionRegex = /^\d{3,6}$/
    return extensionRegex.test(extension)
  },

  // Validate caller ID format
  isValidCallerID: (callerID) => {
    // Should be in E.164 format for supported countries
    const usCanadaRegex = /^\+1[2-9]\d{9}$/
    const germanyRegex = /^\+49[1-9]\d{9,11}$/
    const ukraineRegex = /^\+380[1-9]\d{8}$/

    return true //UNDO! usCanadaRegex.test(callerID) || germanyRegex.test(callerID) || ukraineRegex.test(callerID)
  },

  // Parse SIP connection URL
  parseSIPURL: (url) => {
    try {
      const sipUrl = new URL(url)

      return {
        protocol: sipUrl.protocol,
        host: sipUrl.hostname,
        port: sipUrl.port || (sipUrl.protocol === 'wss:' ? 443 : 5060),
        path: sipUrl.pathname
      }
    } catch (error) {
      return null
    }
  },

  // Generate SIP user agent string
  generateUserAgent: () => {
    return `Solity-WebRTC/1.0 (${navigator.userAgent})`
  }
}

export default sipAPI