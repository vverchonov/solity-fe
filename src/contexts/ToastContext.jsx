import { createContext, useContext, useEffect } from 'react'
import { useToast } from '../hooks/useToast'
import { ToastContainer } from '../components/ToastContainer'
import { setGlobalToast } from '../lib/axios'

const ToastContext = createContext()

export const useToastContext = () => {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}

export const ToastProvider = ({ children }) => {
  const toast = useToast()

  // Set global toast function for axios interceptor
  useEffect(() => {
    setGlobalToast(toast.showError)
  }, [toast.showError])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
    </ToastContext.Provider>
  )
}