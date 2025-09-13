import { useState, useCallback } from 'react'

export const useToast = () => {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'error') => {
    const id = Date.now() + Math.random()
    const newToast = { id, message, type }
    
    setToasts(prevToasts => [...prevToasts, newToast])
    
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id))
  }, [])

  const showError = useCallback((message) => {
    return addToast(message, 'error')
  }, [addToast])

  const showSuccess = useCallback((message) => {
    return addToast(message, 'success')
  }, [addToast])

  const showWarning = useCallback((message) => {
    return addToast(message, 'warning')
  }, [addToast])

  const showInfo = useCallback((message) => {
    return addToast(message, 'info')
  }, [addToast])

  return {
    toasts,
    addToast,
    removeToast,
    showError,
    showSuccess,
    showWarning,
    showInfo
  }
}

export default useToast