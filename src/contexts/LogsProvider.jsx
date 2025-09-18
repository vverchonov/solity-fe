import { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LogsContext = createContext()

const STORAGE_KEY = 'solity_user_logs'
const MAX_LOGS = 300

export const useLogs = () => {
  const context = useContext(LogsContext)
  if (!context) {
    throw new Error('useLogs must be used within a LogsProvider')
  }
  return context
}

export const LogsProvider = ({ children }) => {
  // Initialize logs from localStorage
  const [logs, setLogs] = useState(() => {
    try {
      const storedLogs = localStorage.getItem(STORAGE_KEY)
      if (storedLogs) {
        const parsed = JSON.parse(storedLogs)
        // Validate the structure and convert dates
        return parsed.map(log => ({
          ...log,
          createdAt: new Date(log.createdAt)
        })).slice(0, MAX_LOGS) // Ensure we don't exceed limit
      }
    } catch (error) {
      console.warn('Failed to load logs from localStorage:', error)
    }
    return []
  })

  // Save logs to localStorage whenever they change
  const saveLogsToStorage = useCallback((logsToSave) => {
    try {
      const serializable = logsToSave.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString()
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
    } catch (error) {
      console.warn('Failed to save logs to localStorage:', error)
      // If localStorage is full, try to clear some space
      try {
        const reducedLogs = logsToSave.slice(0, Math.floor(MAX_LOGS * 0.7)) // Keep 70%
        const serializable = reducedLogs.map(log => ({
          ...log,
          createdAt: log.createdAt.toISOString()
        }))
        localStorage.setItem(STORAGE_KEY, JSON.stringify(serializable))
      } catch (fallbackError) {
        console.error('Failed to save even reduced logs to localStorage:', fallbackError)
      }
    }
  }, [])

  // Update localStorage whenever logs change
  useEffect(() => {
    if (logs.length > 0) {
      saveLogsToStorage(logs)
    }
  }, [logs, saveLogsToStorage])

  // Add a new log entry
  const addLog = (type, message, details = null) => {
    const timestamp = new Date().toLocaleTimeString([], {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })

    const logEntry = {
      id: Date.now() + Math.random(), // Simple unique ID
      timestamp: `[${timestamp}]`,
      type, // 'info', 'success', 'error', 'warning'
      message,
      details,
      createdAt: new Date()
    }

    setLogs(prevLogs => [logEntry, ...prevLogs].slice(0, MAX_LOGS)) // Keep last 300 logs

    // Also log to browser console with appropriate method
    const consoleMessage = `${logEntry.timestamp} ${message}`
    switch (type) {
      case 'success':
        break
      case 'error':
        break
      case 'warning':
        break
      case 'info':
      default:
        break
    }
  }

  // Specific logging methods for different types of interactions
  const logPhantomConnection = (success, walletAddress = null) => {
    if (success) {
      addLog('success', 'Phantom wallet connected', { walletAddress })
    } else {
      addLog('error', 'Failed to connect Phantom wallet')
    }
  }

  const logPhantomDisconnection = () => {
    addLog('info', 'Phantom wallet disconnected')
  }

  const logInvoicePrepare = (amount, success, invoiceId = null) => {
    if (success) {
      addLog('success', `Invoice prepared for ${amount} SOL`, { invoiceId })
    } else {
      addLog('error', `Failed to prepare invoice for ${amount} SOL`)
    }
  }

  const logTransactionStart = (invoiceId, amount) => {
    addLog('info', `Starting transaction for invoice ${invoiceId}`, { amount })
  }

  const logTransactionSigned = (signature, invoiceId) => {
    addLog('success', `Transaction signed by Phantom`, { signature, invoiceId })
  }

  const logTransactionSent = (signature, invoiceId) => {
    addLog('success', `Transaction sent to Solana network`, { signature, invoiceId })
  }

  const logTransactionConfirmed = (signature, invoiceId) => {
    addLog('success', `Transaction confirmed on-chain`, { signature, invoiceId })
  }

  const logTransactionRejected = (invoiceId) => {
    addLog('warning', 'Transaction rejected by user', { invoiceId })
  }

  const logTransactionError = (error, invoiceId) => {
    addLog('error', 'Transaction failed', { error, invoiceId })
  }

  const logInvoiceStatusUpdate = (invoiceId, oldStatus, newStatus) => {
    addLog('info', `Invoice status updated: ${oldStatus} → ${newStatus}`, { invoiceId })
  }

  const logBalanceUpdate = (oldBalance, newBalance) => {
    addLog('success', `Balance updated: ${oldBalance} → ${newBalance} SOL`)
  }

  const logInvoiceCancel = (invoiceId, success) => {
    if (success) {
      addLog('success', `Invoice cancelled`, { invoiceId })
    } else {
      addLog('error', `Failed to cancel invoice`, { invoiceId })
    }
  }

  // Balance refresh logging
  const logBalanceRefresh = (success, error = null) => {
    if (success) {
      addLog('success', 'Balance refreshed successfully')
    } else {
      addLog('error', 'Failed to refresh balance', { error })
    }
  }

  // Call-related logging methods
  const logCallInitiation = (phoneNumber, callerID) => {
    addLog('info', `Initiating call to ${phoneNumber}`, { phoneNumber, callerID })
  }

  const logCallSipConnection = (status, details = null) => {
    const statusMessages = {
      connecting: 'Connecting to Solity server...',
      connected: 'Connected to Solity server',
      registered: 'Solity client registered',
      failed: 'Solity connection failed',
      disconnected: 'Disconnected from Solity server'
    }

    const logType = status === 'failed' ? 'error' : status === 'connected' || status === 'registered' ? 'success' : 'info'
    addLog(logType, statusMessages[status] || `Solity status: ${status}`, details)
  }

  const logCallStateChange = (oldState, newState, phoneNumber = null) => {
    const stateMessages = {
      idle: 'Call ended',
      calling: 'Placing call...',
      ringing: 'Phone ringing',
      'in-call': 'Call connected',
      connecting: 'Connecting call...'
    }

    const message = `Call status: ${stateMessages[newState] || newState}`
    const logType = newState === 'in-call' ? 'success' : newState === 'idle' ? 'info' : 'info'
    addLog(logType, message, { oldState, newState, phoneNumber })
  }

  const logCallDuration = (phoneNumber, duration) => {
    const minutes = Math.floor(duration / 60)
    const seconds = duration % 60
    const formattedDuration = `${minutes}m ${seconds}s`
    addLog('info', `Call completed - Duration: ${formattedDuration}`, { phoneNumber, duration })
  }

  const logCallControl = (action, details = null) => {
    const messages = {
      mute: 'Call muted',
      unmute: 'Call unmuted',
      hold: 'Call put on hold',
      unhold: 'Call resumed from hold',
      dtmf: 'DTMF tone sent',
      hangup: 'Call ended by user'
    }

    addLog('info', messages[action] || `Call control: ${action}`, details)
  }

  const logCallError = (error, context = null) => {
    addLog('error', 'Call error occurred', { error, context })
  }

  // Enhanced error logging with context
  const logError = (message, error, component = null, action = null) => {
    addLog('error', message, {
      error: error?.message || error,
      component,
      action,
      stack: error?.stack,
      timestamp: new Date().toISOString()
    })
  }

  // Clear all logs
  const clearLogs = () => {
    setLogs([])
    addLog('info', 'Logs cleared')
  }

  // Get logs by type
  const getLogsByType = (type) => {
    return logs.filter(log => log.type === type)
  }

  // Get recent logs (last N entries)
  const getRecentLogs = (count = 10) => {
    return logs.slice(0, count)
  }

  const value = {
    // State
    logs,

    // Generic logging
    addLog,
    clearLogs,
    getLogsByType,
    getRecentLogs,

    // Wallet logging methods
    logPhantomConnection,
    logPhantomDisconnection,

    // Invoice & Transaction logging methods
    logInvoicePrepare,
    logTransactionStart,
    logTransactionSigned,
    logTransactionSent,
    logTransactionConfirmed,
    logTransactionRejected,
    logTransactionError,
    logInvoiceStatusUpdate,
    logInvoiceCancel,

    // Balance logging methods
    logBalanceUpdate,
    logBalanceRefresh,

    // Call logging methods
    logCallInitiation,
    logCallSipConnection,
    logCallStateChange,
    logCallDuration,
    logCallControl,
    logCallError,

    // Enhanced error logging
    logError
  }

  return (
    <LogsContext.Provider value={value}>
      {children}
    </LogsContext.Provider>
  )
}

export default LogsProvider