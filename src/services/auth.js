import apiClient from '../lib/axios'

// Token management utilities (access token + user data in localStorage)
export const tokenUtils = {
  setAccessToken: (accessToken) => {
    localStorage.setItem('accessToken', accessToken)
  },

  getAccessToken: () => localStorage.getItem('accessToken'),

  clearAccessToken: () => {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('userData')
  },

  hasAccessToken: () => {
    const accessToken = tokenUtils.getAccessToken()
    return !!accessToken
  },

  // Store user data
  setUserData: (userData) => {
    localStorage.setItem('userData', JSON.stringify(userData))
  },

  getUserData: () => {
    try {
      const data = localStorage.getItem('userData')
      return data ? JSON.parse(data) : null
    } catch {
      return null
    }
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
  login: async (username, password, recaptchaToken) => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
        recaptchaToken
      })

      const { accessToken, id, status, userRole, username: responseUsername, accessTokenExpiry } = response.data

      if (accessToken) {
        tokenUtils.setAccessToken(accessToken)
      }

      const user = {
        id,
        status,
        userRole,
        username: responseUsername,
        accessTokenExpiry
      }

      // Store user data in localStorage
      tokenUtils.setUserData(user)

      return {
        success: true,
        data: {
          user,
          accessToken
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed'
      }
    }
  },

  // Create new account
  register: async (username, password, recaptchaToken) => {
    try {
      const response = await apiClient.post('/auth/signup', {
        username,
        password,
        recaptchaToken
      })

      const { accessToken, id, status, userRole, username: responseUsername, accessTokenExpiry } = response.data

      if (accessToken) {
        tokenUtils.setAccessToken(accessToken)
      }

      const user = {
        id,
        status,
        userRole,
        username: responseUsername,
        accessTokenExpiry
      }

      // Store user data in localStorage
      tokenUtils.setUserData(user)

      return {
        success: true,
        data: {
          user,
          accessToken
        }
      }
    } catch (error) {
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

      const { accessToken: newAccessToken, id, status, userRole, username, balances, accessTokenExpiry } = response.data

      tokenUtils.setAccessToken(newAccessToken)

      // Create user object from refresh response
      const user = {
        id,
        status,
        userRole,
        username,
        balances,
        accessTokenExpiry
      }

      // Store updated user data in localStorage
      tokenUtils.setUserData(user)

      return {
        success: true,
        data: {
          accessToken: newAccessToken,
          id,
          status,
          userRole,
          username,
          balances,
          accessTokenExpiry,
          user
        }
      }
    } catch (error) {
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