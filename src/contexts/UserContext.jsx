import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI, tokenUtils } from '../services/auth'

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
        const hasToken = authAPI.isAuthenticated()

        if (hasToken) {
          // First try to get cached user data
          const cachedUserData = tokenUtils.getUserData()

          if (cachedUserData && cachedUserData.username) {
            setUser(cachedUserData)
            setShouldRedirectToDashboard(true)
            setIsLoading(false)

            // Optionally refresh in background to get latest data
            authAPI.refreshToken().then((refreshResult) => {
              if (refreshResult.success) {
                const updatedUserData = refreshResult.data.user
                setUser(updatedUserData)
              }
            }).catch(() => {
              // Ignore background refresh failures
            })
          } else {
            // No cached data, need to refresh
            const refreshResult = await authAPI.refreshToken()
            if (refreshResult.success) {
              const userData = refreshResult.data.user

              setUser(userData)
              setShouldRedirectToDashboard(true)
            } else {
              authAPI.logout()
              setUser(null)
            }
          }
        } else {
          setUser(null)
        }
      } catch (error) {
        authAPI.logout()
        setUser(null)
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