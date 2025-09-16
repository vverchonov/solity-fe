import { createContext, useContext, useState, useEffect } from 'react'
import { healthAPI } from '../services/health'

const HealthContext = createContext()

export const useHealth = () => {
  const context = useContext(HealthContext)
  if (!context) {
    throw new Error('useHealth must be used within a HealthProvider')
  }
  return context
}

export const HealthProvider = ({ children }) => {
  const [health, setHealth] = useState({
    api: false,
    db: false,
    tele: false
  })
  const [isLoading, setIsLoading] = useState(true)
  const [lastChecked, setLastChecked] = useState(null)

  // Check health on mount and periodically
  useEffect(() => {
    const checkHealth = async () => {
      try {
        setIsLoading(true)
        const result = await healthAPI.checkHealth()
        
        if (result.success) {
          setHealth(result.data)
        } else {
          // If health check fails, assume all services are down
          setHealth({
            api: false,
            db: false,
            tele: false
          })
        }
        
        setLastChecked(new Date())
      } catch (error) {
        console.error('Error checking health:', error)
        setHealth({
          api: false,
          db: false,
          tele: false
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Initial health check
    checkHealth()

    // Set up periodic health checks every 30 seconds
    const interval = setInterval(checkHealth, 30000)

    return () => clearInterval(interval)
  }, [])

  // Helper functions
  const isServerHealthy = () => {
    return health.api && health.db && health.tele
  }

  const getUnhealthyServices = () => {
    const unhealthy = []
    if (!health.api) unhealthy.push('API')
    if (!health.db) unhealthy.push('Database')
    if (!health.tele) unhealthy.push('Telephony')
    return unhealthy
  }

  const refreshHealth = async () => {
    setIsLoading(true)
    try {
      const result = await healthAPI.checkHealth()
      if (result.success) {
        setHealth(result.data)
      } else {
        setHealth({
          api: false,
          db: false,
          tele: false
        })
      }
      setLastChecked(new Date())
    } catch (error) {
      console.error('Error refreshing health:', error)
      setHealth({
        api: false,
        db: false,
        tele: false
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <HealthContext.Provider value={{
      health,
      isLoading,
      lastChecked,
      isServerHealthy,
      getUnhealthyServices,
      refreshHealth
    }}>
      {children}
    </HealthContext.Provider>
  )
}

export default HealthProvider
