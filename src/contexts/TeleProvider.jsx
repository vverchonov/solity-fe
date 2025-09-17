import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { sipAPI } from '../services/sip'
import { useUser } from './UserContext'

const TeleContext = createContext()

export const useTele = () => {
  const context = useContext(TeleContext)
  if (!context) {
    throw new Error('useTele must be used within a TeleProvider')
  }
  return context
}

export const TeleProvider = ({ children }) => {
  const { user } = useUser()

  // SIP credentials state
  const [credentials, setCredentials] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState(null)
  const [availableCallerIDs, setAvailableCallerIDs] = useState([])

  // Auto-refresh credentials when they expire
  const [credentialsExpiry, setCredentialsExpiry] = useState(null)
  const [refreshTimer, setRefreshTimer] = useState(null)

  // Fetch SIP credentials
  const fetchCredentials = useCallback(async (forceRefresh = false) => {
    if (!user) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await sipAPI.getCredentials()

      if (result.success) {
        setCredentials(result.data)

        // Calculate expiry time if TTL is provided
        if (result.data.ttl) {
          const expiryTime = Date.now() + (result.data.ttl * 1000)
          setCredentialsExpiry(expiryTime)
          scheduleCredentialsRefresh(result.data.ttl)
        }

        // Cache credentials in session storage
        sessionStorage.setItem('sipCredentials', JSON.stringify({
          ...result.data,
          cachedAt: Date.now()
        }))
      } else {
        setError(result.error)
      }
    } catch (error) {
      setError('Failed to fetch SIP credentials')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  // Schedule automatic credentials refresh
  const scheduleCredentialsRefresh = useCallback((ttlSeconds) => {
    // Clear existing timer
    if (refreshTimer) {
      clearTimeout(refreshTimer)
    }

    // Refresh 5 minutes before expiry, or halfway through if TTL is less than 10 minutes
    const refreshIn = ttlSeconds > 600 ? (ttlSeconds - 300) * 1000 : (ttlSeconds / 2) * 1000


    const timer = setTimeout(() => {
      fetchCredentials(true)
    }, refreshIn)

    setRefreshTimer(timer)
  }, [refreshTimer, fetchCredentials])

  // Refresh/rotate SIP password
  const refreshPassword = useCallback(async () => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await sipAPI.refreshPassword()

      if (result.success) {

        // Update credentials with new password
        if (credentials) {
          const updatedCredentials = {
            ...credentials,
            password: result.data.password
          }
          setCredentials(updatedCredentials)

          // Update cached credentials
          sessionStorage.setItem('sipCredentials', JSON.stringify({
            ...updatedCredentials,
            cachedAt: Date.now()
          }))

          // Schedule next refresh if TTL provided
          if (result.data.ttl) {
            const expiryTime = Date.now() + (result.data.ttl * 1000)
            setCredentialsExpiry(expiryTime)
            scheduleCredentialsRefresh(result.data.ttl)
          }
        }

        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMsg = 'Failed to refresh SIP password'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [user, credentials, scheduleCredentialsRefresh])

  // Update caller ID
  const updateCallerID = useCallback(async (callerID) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await sipAPI.updateCallerID(callerID)

      if (result.success) {

        // Update credentials with new caller ID
        if (credentials) {
          const updatedCredentials = {
            ...credentials,
            callerID: result.data.callerID
          }
          setCredentials(updatedCredentials)

          // Update cached credentials
          sessionStorage.setItem('sipCredentials', JSON.stringify({
            ...updatedCredentials,
            cachedAt: Date.now()
          }))
        }

        return { success: true, data: result.data }
      } else {
        setError(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      const errorMsg = 'Failed to update caller ID'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [user, credentials])

  // Get connection status
  const getConnectionStatus = useCallback(async () => {
    if (!user) {
      return { success: false, error: 'User not authenticated' }
    }


    try {
      const result = await sipAPI.getConnectionStatus()

      if (result.success) {
        setConnectionStatus(result.data)
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to get connection status' }
    }
  }, [user])

  // Fetch available caller IDs
  const fetchAvailableCallerIDs = useCallback(async () => {
    if (!user) {
      return
    }


    try {
      const result = await sipAPI.getAvailableCallerIDs()

      if (result.success) {
        setAvailableCallerIDs(result.data.callerIDs || [])
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to fetch available caller IDs' }
    }
  }, [user])

  // Test SIP connection
  const testConnection = useCallback(async () => {
    if (!user || !credentials) {
      return { success: false, error: 'User not authenticated or no credentials' }
    }

    setIsLoading(true)

    try {
      const result = await sipAPI.testConnection()

      if (result.success) {
        return { success: true, data: result.data }
      } else {
        return { success: false, error: result.error }
      }
    } catch (error) {
      return { success: false, error: 'Failed to test connection' }
    } finally {
      setIsLoading(false)
    }
  }, [user, credentials])

  // Clear credentials
  const clearCredentials = useCallback(() => {
    setCredentials(null)
    setConnectionStatus(null)
    setAvailableCallerIDs([])
    setCredentialsExpiry(null)
    setError(null)

    // Clear cached credentials
    sessionStorage.removeItem('sipCredentials')

    // Clear refresh timer
    if (refreshTimer) {
      clearTimeout(refreshTimer)
      setRefreshTimer(null)
    }
  }, [refreshTimer])

  // Initialize credentials when user is available - clear old credentials but don't fetch new ones
  useEffect(() => {
    if (!user) {
      clearCredentials()
      return
    }


    // Clear any old cached credentials when user logs in
    sessionStorage.removeItem('sipCredentials')
  }, [user, clearCredentials])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimer) {
        clearTimeout(refreshTimer)
      }
    }
  }, [refreshTimer])

  // Helper functions
  const isCredentialsExpired = useCallback(() => {
    if (!credentialsExpiry) return false
    return Date.now() > credentialsExpiry
  }, [credentialsExpiry])

  const hasValidCredentials = useCallback(() => {
    return credentials && credentials.wss && credentials.extension && credentials.password && !isCredentialsExpired()
  }, [credentials, isCredentialsExpired])

  const value = {
    // State
    credentials,
    isLoading,
    error,
    connectionStatus,
    availableCallerIDs,
    credentialsExpiry,

    // Actions
    fetchCredentials,
    refreshPassword,
    updateCallerID,
    getConnectionStatus,
    fetchAvailableCallerIDs,
    testConnection,
    clearCredentials,

    // Helper functions
    isCredentialsExpired,
    hasValidCredentials,

    // Direct API access (for advanced use)
    sipAPI
  }

  return (
    <TeleContext.Provider value={value}>
      {children}
    </TeleContext.Provider>
  )
}

export default TeleProvider