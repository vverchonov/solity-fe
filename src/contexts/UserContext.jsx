import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/auth'

const UserContext = createContext()

export const useUser = () => {
  const context = useContext(UserContext)
  if (!context) {
    throw new Error('useUser must be used within a UserProvider')
  }
  return context
}

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldRedirectToDashboard, setShouldRedirectToDashboard] = useState(false)

  // Check for existing session on mount
  useEffect(() => {
    const initializeUser = async () => {
      try {
        if (authAPI.isAuthenticated()) {
          // Try to refresh token to validate session and get user data
          const refreshResult = await authAPI.refreshToken()
          if (refreshResult.success) {
            console.log('Session restored via token refresh')
            
            // Create user object from refresh response
            const userData = {
              status: refreshResult.data.status,
              userRole: refreshResult.data.userRole,
              balances: refreshResult.data.balances
            }
            
            setUser(userData)
            console.log('User data restored:', userData)
            
            // Set flag to redirect to dashboard
            setShouldRedirectToDashboard(true)
          } else {
            // Token refresh failed, clear token
            console.log('Token refresh failed, user needs to login')
          }
        }
      } catch (error) {
        console.error('Failed to initialize user:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeUser()
  }, [])

  const updateUser = (userData) => {
    setUser(userData)
  }

  const clearUser = () => {
    setUser(null)
  }

  const isUserActive = () => {
    return user?.status === 'active'
  }

  const isUserInactive = () => {
    return user?.status === 'inactive'
  }

  const clearRedirectFlag = () => {
    setShouldRedirectToDashboard(false)
  }

  return (
    <UserContext.Provider value={{
      user,
      isLoading,
      setIsLoading,
      updateUser,
      clearUser,
      isUserActive,
      isUserInactive,
      shouldRedirectToDashboard,
      clearRedirectFlag
    }}>
      {children}
    </UserContext.Provider>
  )
}

export default UserProvider