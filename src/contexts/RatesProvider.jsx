import { createContext, useContext, useState, useEffect } from 'react'
import { ratesAPI } from '../services/rates'

const RatesContext = createContext()

export const useRates = () => {
  const context = useContext(RatesContext)
  if (!context) {
    throw new Error('useRates must be used within a RatesProvider')
  }
  return context
}

export const RatesProvider = ({ children }) => {
  const [rates, setRates] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  // Load rates on mount
  useEffect(() => {
    const loadRates = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        const result = await ratesAPI.getCurrentRates()
        if (result.success) {
          setRates(result.data.rates || result.data || [])
          console.log('Call rates loaded:', result.data)
        } else {
          setError(result.error)
          console.error('Failed to load rates:', result.error)
        }
      } catch (error) {
        setError('Failed to load rates')
        console.error('Error loading rates:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadRates()
  }, [])

  // Helper functions to work with rates
  const getRateByCode = (code) => {
    return rates.find(rate => rate.codes === code && rate.active)
  }

  const getRatesByDirection = (direction) => {
    return rates.filter(rate => rate.direction === direction && rate.active)
  }

  const getActiveRates = () => {
    return rates.filter(rate => rate.active)
  }

  const refreshRates = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const result = await ratesAPI.getCurrentRates()
      if (result.success) {
        setRates(result.data.rates || result.data || [])
        console.log('Rates refreshed:', result.data)
      } else {
        setError(result.error)
        console.error('Failed to refresh rates:', result.error)
      }
    } catch (error) {
      setError('Failed to refresh rates')
      console.error('Error refreshing rates:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <RatesContext.Provider value={{
      rates,
      isLoading,
      error,
      getRateByCode,
      getRatesByDirection,
      getActiveRates,
      refreshRates
    }}>
      {children}
    </RatesContext.Provider>
  )
}

export default RatesProvider