import { useState, useEffect, useCallback } from 'react'
import { authAPI, tokenUtils } from '../services/auth'

export const useAuth = () => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = useCallback(async () => {
    try {
      if (!tokenUtils.hasAccessToken()) {
        setLoading(false)
        return
      }

      const result = await authAPI.getCurrentUser()
      if (result.success) {
        setUser(result.data)
        setIsAuthenticated(true)
      } else {
        setUser(null)
        setIsAuthenticated(false)
        tokenUtils.clearAccessToken()
      }
    } catch (error) {
      setUser(null)
      setIsAuthenticated(false)
      tokenUtils.clearAccessToken()
    } finally {
      setLoading(false)
    }
  }, [])

  const login = useCallback(async (username, password) => {
    setLoading(true)
    try {
      const result = await authAPI.login(username, password)
      if (result.success) {
        setUser(result.data.user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: 'Login failed' }
    } finally {
      setLoading(false)
    }
  }, [])

  const register = useCallback(async (username, password, email = null) => {
    setLoading(true)
    try {
      const result = await authAPI.register(username, password, email)
      if (result.success) {
        setUser(result.data.user)
        setIsAuthenticated(true)
        return { success: true }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: 'Registration failed' }
    } finally {
      setLoading(false)
    }
  }, [])

  const logout = useCallback(async () => {
    setLoading(true)
    try {
      await authAPI.logout()
      setUser(null)
      setIsAuthenticated(false)
      // Redirect to login page
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout error:', error)
      // Clear local state even if server call fails
      setUser(null)
      setIsAuthenticated(false)
      tokenUtils.clearAccessToken()
      window.location.href = '/login'
    } finally {
      setLoading(false)
    }
  }, [])

  const refreshAuth = useCallback(async () => {
    const result = await authAPI.ensureValidToken()
    if (!result.success) {
      setUser(null)
      setIsAuthenticated(false)
      tokenUtils.clearAccessToken()
      return false
    }
    return true
  }, [])

  return {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    refreshAuth,
    checkAuthStatus
  }
}

export default useAuth