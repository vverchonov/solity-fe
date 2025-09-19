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

  // Clear any stale wallet data on mount - no auto-connection
  useEffect(() => {
    // Always start with clean wallet state - require explicit user connection
    sessionStorage.removeItem('walletConnected')
    sessionStorage.removeItem('walletAddress')
    setIsWalletConnected(false)
    setWalletAddress(null)
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

        // Don't persist connection state - require manual connection each time
        // sessionStorage.setItem('walletConnected', 'true')
        // sessionStorage.setItem('walletAddress', address)

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
      // Always clear local state (no session storage persistence)
      setIsWalletConnected(false)
      setWalletAddress(null)
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

    // Clear all wallet state (no session storage persistence)
    setIsWalletConnected(false)
    setWalletAddress(null)

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
          // Don't persist to session storage
        } else {
          setIsWalletConnected(false)
          setWalletAddress(null)
          // No session storage to clear
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