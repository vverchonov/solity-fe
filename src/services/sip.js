import apiClient from '../lib/axios'

// SIP Credentials Service - Handles telephone credentials and caller ID management
export const sipAPI = {
  // Get SIP credentials for user
  getCredentials: async () => {
    try {
      console.log('📞 SIP: Getting SIP credentials...')

      const response = await apiClient.get('/tele/credentials')

      if (response.data) {
        console.log('📞 SIP: Credentials retrieved successfully')

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
      console.error('📞 SIP: Error getting credentials:', error)

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get SIP credentials'
      }
    }
  },

  // Update caller ID using the new extension endpoint
  updateCallerID: async (callerID) => {
    try {
      console.log('📞 SIP: Updating caller ID...', callerID)

      const response = await apiClient.patch('/tele/extension', {
        callerID: callerID
      })

      if (response.data) {
        console.log('📞 SIP: Caller ID updated successfully')

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
      console.error('📞 SIP: Error updating caller ID:', error)

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to update caller ID'
      }
    }
  },

  // Refresh/rotate SIP password
  refreshPassword: async () => {
    try {
      console.log('📞 SIP: Refreshing SIP password...')

      const response = await apiClient.post('/tele/refresh-password')

      if (response.data) {
        console.log('📞 SIP: Password refreshed successfully')

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
      console.error('📞 SIP: Error refreshing password:', error)

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to refresh SIP password'
      }
    }
  },

  // Get SIP connection status
  getConnectionStatus: async () => {
    try {
      console.log('📞 SIP: Getting connection status...')

      const response = await apiClient.get('/tele/status')

      if (response.data) {
        console.log('📞 SIP: Status retrieved successfully')

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
      console.error('📞 SIP: Error getting status:', error)

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get SIP status'
      }
    }
  },

  // Test SIP connection
  testConnection: async () => {
    try {
      console.log('📞 SIP: Testing SIP connection...')

      const response = await apiClient.post('/tele/test-connection')

      if (response.data) {
        console.log('📞 SIP: Connection test completed')

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
      console.error('📞 SIP: Error testing connection:', error)

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to test SIP connection'
      }
    }
  },

  // Get available caller ID numbers
  getAvailableCallerIDs: async () => {
    try {
      console.log('📞 SIP: Getting available caller IDs...')

      const response = await apiClient.get('/tele/available-caller-ids')

      if (response.data) {
        console.log('📞 SIP: Available caller IDs retrieved successfully')

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
      console.error('📞 SIP: Error getting available caller IDs:', error)

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to get available caller IDs'
      }
    }
  },

  // Verify caller ID ownership
  verifyCallerID: async (callerID, verificationCode) => {
    try {
      console.log('📞 SIP: Verifying caller ID...', callerID)

      const response = await apiClient.post('/tele/verify-caller-id', {
        callerID: callerID,
        verificationCode: verificationCode
      })

      if (response.data) {
        console.log('📞 SIP: Caller ID verification completed')

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
      console.error('📞 SIP: Error verifying caller ID:', error)

      return {
        success: false,
        error: error.response?.data?.message || error.message || 'Failed to verify caller ID'
      }
    }
  },

  // Request caller ID verification
  requestCallerIDVerification: async (callerID) => {
    try {
      console.log('📞 SIP: Requesting caller ID verification...', callerID)

      const response = await apiClient.post('/tele/request-caller-id-verification', {
        callerID: callerID
      })

      if (response.data) {
        console.log('📞 SIP: Caller ID verification requested successfully')

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
      console.error('📞 SIP: Error requesting caller ID verification:', error)

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

    // Add country code if missing (default to US +1)
    if (digits.length === 10) {
      return `+1${digits}`
    } else if (digits.length === 11 && digits.startsWith('1')) {
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
    // Should be in E.164 format or US format
    const e164Regex = /^\+[1-9]\d{1,14}$/
    const usFormatRegex = /^\+1[2-9]\d{2}[2-9]\d{2}\d{4}$/

    return e164Regex.test(callerID) || usFormatRegex.test(callerID)
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
      console.error('📞 SIP: Error parsing SIP URL:', error)
      return null
    }
  },

  // Generate SIP user agent string
  generateUserAgent: () => {
    return `Solity-WebRTC/1.0 (${navigator.userAgent})`
  }
}

export default sipAPI