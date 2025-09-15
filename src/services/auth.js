import apiClient from '../lib/axios'

// Token management utilities (only access token in localStorage)
export const tokenUtils = {
  setAccessToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken)
  },

  getAccessToken: () => localStorage.getItem('accessToken'),

  clearAccessToken: () => {
    localStorage.removeItem('accessToken')
  },

  hasAccessToken: () => {
    const accessToken = tokenUtils.getAccessToken()
    return !!accessToken
  },

  // Decode JWT token to check expiration
  isTokenExpired: (token) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]))
      const currentTime = Date.now() / 1000
      return payload.exp < currentTime
    } catch (error) {
      return true
    }
  }
}

// Authentication API functions
export const authAPI = {
  // Login with username and password
  login: async (username, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password
      })

      const { accessToken, id, status, userRole, accessTokenExpiry } = response.data

      if (accessToken) {
        tokenUtils.setAccessToken(accessToken)
      }

      const user = {
        id,
        status,
        userRole,
        accessTokenExpiry
      }

      return {
        success: true,
        data: {
          user,
          accessToken
        }
      }
    } catch (error) {
      console.error('Login failed:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      }
    }
  },

  // Create new account
  register: async (username, password) => {
    try {
      const response = await apiClient.post('/auth/signup', {
        username,
        password
      })

      const { accessToken, id, status, userRole, accessTokenExpiry } = response.data

      if (accessToken) {
        tokenUtils.setAccessToken(accessToken)
      }

      const user = {
        id,
        status,
        userRole,
        accessTokenExpiry
      }

      return {
        success: true,
        data: {
          user,
          accessToken
        }
      }
    } catch (error) {
      console.error('Registration failed:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Registration failed'
      }
    }
  },

  // Refresh access token using httpOnly refresh token cookie
  refreshToken: async () => {
    try {
      // The refresh token is sent as an httpOnly cookie automatically
      const response = await apiClient.post('/auth/refresh')

      const { accessToken: newAccessToken, id, status, userRole, accessTokenExpiry } = response.data

      tokenUtils.setAccessToken(newAccessToken)

      // Check if user data is included in refresh response
      let user = null
      if (id && status && userRole) {
        user = {
          id,
          status,
          userRole,
          accessTokenExpiry
        }
      }

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
          user
        }
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      tokenUtils.clearAccessToken()
      return {
        success: false,
        error: error.response?.data?.message || 'Token refresh failed'
      }
    }
  },

  // Logout user
  logout: async () => {
    try {
      // Notify server about logout to invalidate httpOnly refresh token cookie
      await apiClient.post('/auth/logout')

      tokenUtils.clearAccessToken()

      return {
        success: true
      }
    } catch (error) {
      console.error('Logout failed:', error)
      // Clear access token even if server request fails
      tokenUtils.clearAccessToken()
      return {
        success: true // Consider logout successful even if server call fails
      }
    }
  },


  // Check if user is authenticated
  isAuthenticated: () => {
    const accessToken = tokenUtils.getAccessToken()
    if (!accessToken) return false

    // Check if access token is expired
    return !tokenUtils.isTokenExpired(accessToken)
  },

  // Force refresh token if access token is expired
  ensureValidToken: async () => {
    const accessToken = tokenUtils.getAccessToken()
    
    if (!accessToken) {
      return { success: false, error: 'No access token' }
    }

    if (tokenUtils.isTokenExpired(accessToken)) {
      return await authAPI.refreshToken()
    }

    return { success: true }
  }
}

export default authAPI