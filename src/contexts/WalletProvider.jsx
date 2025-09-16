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
            console.log('🔗 WalletProvider: Restored wallet connection:', response.publicKey.toString())
            setIsWalletConnected(true)
            setWalletAddress(response.publicKey.toString())
          } else {
            // Clear stale session data
            sessionStorage.removeItem('walletConnected')
            sessionStorage.removeItem('walletAddress')
          }
        }
      } catch (error) {
        console.log('🔗 WalletProvider: No trusted connection found or wallet not available')
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
    console.log('🔗 WalletProvider: Attempting to connect wallet...')

    try {
      if (window.phantom?.solana) {
        const response = await window.phantom.solana.connect()
        console.log('🔗 WalletProvider: Wallet connected:', response.publicKey.toString())

        const address = response.publicKey.toString()
        setIsWalletConnected(true)
        setWalletAddress(address)

        // Persist connection state in session storage
        sessionStorage.setItem('walletConnected', 'true')
        sessionStorage.setItem('walletAddress', address)

        return { success: true, address }
      } else {
        console.log('🔗 WalletProvider: Phantom wallet not found, redirecting to install page')
        window.open('https://phantom.app/', '_blank')
        return { success: false, error: 'Phantom wallet not installed' }
      }
    } catch (error) {
      console.error('🔗 WalletProvider: Failed to connect wallet:', error)
      return { success: false, error: error.message || 'Failed to connect wallet' }
    } finally {
      setIsConnecting(false)
    }
  }

  const disconnectWallet = async () => {
    console.log('🔗 WalletProvider: Disconnecting wallet...')

    try {
      if (window.phantom?.solana && isWalletConnected) {
        await window.phantom.solana.disconnect()
        console.log('🔗 WalletProvider: Wallet disconnected')
      }
    } catch (error) {
      console.error('🔗 WalletProvider: Error disconnecting wallet:', error)
    } finally {
      // Always clear local state and session storage
      setIsWalletConnected(false)
      setWalletAddress(null)
      sessionStorage.removeItem('walletConnected')
      sessionStorage.removeItem('walletAddress')
    }
  }

  // Listen for wallet account changes
  useEffect(() => {
    if (window.phantom?.solana) {
      const handleAccountChange = (publicKey) => {
        if (publicKey) {
          console.log('🔗 WalletProvider: Account changed:', publicKey.toString())
          const address = publicKey.toString()
          setWalletAddress(address)
          sessionStorage.setItem('walletAddress', address)
        } else {
          console.log('🔗 WalletProvider: Account disconnected')
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
    walletProvider: isWalletConnected ? window.phantom?.solana : null // Add the actual wallet provider
  }

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  )
}

export default WalletProvider