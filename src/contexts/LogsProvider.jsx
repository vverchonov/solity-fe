import { createContext, useContext, useState } from 'react'

const LogsContext = createContext()

export const useLogs = () => {
  const context = useContext(LogsContext)
  if (!context) {
    throw new Error('useLogs must be used within a LogsProvider')
  }
  return context
}

export const LogsProvider = ({ children }) => {
  const [logs, setLogs] = useState([])

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

    setLogs(prevLogs => [logEntry, ...prevLogs].slice(0, 100)) // Keep last 100 logs

    // Also log to browser console with appropriate method
    const consoleMessage = `${logEntry.timestamp} ${message}`
    switch (type) {
      case 'success':
        console.log(`✅ ${consoleMessage}`, details || '')
        break
      case 'error':
        console.error(`❌ ${consoleMessage}`, details || '')
        break
      case 'warning':
        console.warn(`⚠️ ${consoleMessage}`, details || '')
        break
      case 'info':
      default:
        console.log(`ℹ️ ${consoleMessage}`, details || '')
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

    // Specific logging methods
    logPhantomConnection,
    logPhantomDisconnection,
    logInvoicePrepare,
    logTransactionStart,
    logTransactionSigned,
    logTransactionSent,
    logTransactionConfirmed,
    logTransactionRejected,
    logTransactionError,
    logInvoiceStatusUpdate,
    logBalanceUpdate,
    logInvoiceCancel
  }

  return (
    <LogsContext.Provider value={value}>
      {children}
    </LogsContext.Provider>
  )
}

export default LogsProvider