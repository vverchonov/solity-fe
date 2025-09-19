import { createContext, useContext, useState, useEffect } from 'react'

const WalletContext = createContext()

export const useWallet = () => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}

export const WalletProvider = ({ children }) => {
  const [isWalletConnected, setIsWalletConnected] = useState(false)
  const [walletAddress, setWalletAddress] = useState(null)
  const [isConnecting, setIsConnecting] = useState(false)

  // Check for existing wallet connection on mount
  useEffect(() => {
    const checkWalletConnection = async () => {
      try {
        // Check session storage for wallet state
        const savedWalletState = sessionStorage.getItem('walletConnected')
        const savedWalletAddress = sessionStorage.getItem('walletAddress')

        if (savedWalletState === 'true' && savedWalletAddress && window.phantom?.solana) {
          // Check if wallet is still actually connected
          const response = await window.phantom.solana.connect({ onlyIfTrusted: true })
          if (response.publicKey) {
            setIsWalletConnected(true)
            setWalletAddress(response.publicKey.toString())
          } else {
            // Clear stale session data
            sessionStorage.removeItem('walletConnected')
            sessionStorage.removeItem('walletAddress')
          }
        }
      } catch (error) {
        // Clear stale session data on error
        sessionStorage.removeItem('walletConnected')
        sessionStorage.removeItem('walletAddress')
      }
    }

    checkWalletConnection()
  }, [])

  const connectWallet = async () => {
    if (isConnecting) return

    setIsConnecting(true)

    try {
      if (window.phantom?.solana) {
        const response = await window.phantom.solana.connect()

        const address = response.publicKey.toString()
        setIsWalletConnected(true)
        setWalletAddress(address)

        // Persist connection state in session storage
        sessionStorage.setItem('walletConnected', 'true')
        sessionStorage.setItem('walletAddress', address)

        return { success: true, address }
      } else {
        window.open('https://phantom.app/', '_blank')
        return { success: false, error: 'Phantom wallet not installed' }
      }
    } catch (error) {
      return { success: false, error: error.message || 'Failed to connect wallet' }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {

    try {
      if (window.phantom?.solana && isWalletConnected) {
        await window.phantom.solana.disconnect()
      }
    } catch (error) {
    } finally {
      // Always clear local state and session storage
      setIsWalletConnected(false)
      setWalletAddress(null)
      sessionStorage.removeItem('walletConnected')
      sessionStorage.removeItem('walletAddress')
    }
  }

  // Force wallet reconnection - ensures user signs both login and transaction manually
  const reconnectWallet = async () => {
    try {
      // First disconnect the current session
      if (window.phantom?.solana && isWalletConnected) {
        await window.phantom.solana.disconnect()
      }
    } catch (error) {
      // Continue with reconnection even if disconnect fails
    }

    // Clear all wallet state
    setIsWalletConnected(false)
    setWalletAddress(null)
    sessionStorage.removeItem('walletConnected')
    sessionStorage.removeItem('walletAddress')

    // Now reconnect with fresh user approval
    return await connectWallet()
  }

  // Listen for wallet account changes
  useEffect(() => {
    if (window.phantom?.solana) {
      const handleAccountChange = (publicKey) => {
        if (publicKey) {
          const address = publicKey.toString()
          setWalletAddress(address)
          sessionStorage.setItem('walletAddress', address)
        } else {
          setIsWalletConnected(false)
          setWalletAddress(null)
          sessionStorage.removeItem('walletConnected')
          sessionStorage.removeItem('walletAddress')
        }
      }

      window.phantom.solana.on('accountChanged', handleAccountChange)

      return () => {
        window.phantom.solana.off('accountChanged', handleAccountChange)
      }
    }
  }, [])

  const value = {
    isWalletConnected,
    walletAddress,
    isConnecting,
    connectWallet,
    disconnectWallet,
    reconnectWallet,
    walletProvider: isWalletConnected ? window.phantom?.solana : null // Add the actual wallet provider
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export default WalletProvider