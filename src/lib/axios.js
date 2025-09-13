import axios from 'axios'

// Global toast function - will be set by ToastProvider
let globalShowError = null

export const setGlobalToast = (showError) => {
  globalShowError = showError
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 10000,
  withCredentials: true, // Include httpOnly cookies in all requests
  headers: {
    'Content-Type': 'application/json',
  },
})

// Token management (only access token in localStorage, refresh token is httpOnly cookie)
const getAccessToken = () => localStorage.getItem('accessToken')

const setAccessToken = (accessToken) => {
  localStorage.setItem('accessToken', accessToken)
}

const clearAccessToken = () => {
  localStorage.removeItem('accessToken')
}

// Flag to prevent multiple refresh attempts
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token)
    }
  })
  
  failedQueue = []
}

// Request interceptor for adding auth tokens
apiClient.interceptors.request.use(
  (config) => {
    const accessToken = getAccessToken()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for handling token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return apiClient(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        // Create a new axios instance for refresh to include cookies
        const refreshClient = axios.create({
          baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
          withCredentials: true // Include httpOnly cookies
        })

        const response = await refreshClient.post('/auth/refresh')

        const { accessToken: newAccessToken } = response.data

        setAccessToken(newAccessToken)
        
        // Update the authorization header for the failed request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
        
        processQueue(null, newAccessToken)
        
        return apiClient(originalRequest)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAccessToken()
        
        // Show toast for refresh token error
        if (globalShowError) {
          globalShowError('Session expired. Please login again.')
        }
        
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    // Show error toast for other errors (but not 401 during token refresh)
    if (error.response && globalShowError) {
      const message = error.response.data?.message || 
                     error.response.data?.error || 
                     `Error: ${error.response.status} ${error.response.statusText}`
      
      // Don't show toast for auth-related errors that redirect to login
      if (error.response.status !== 401) {
        globalShowError(message)
      }
    } else if (error.request && globalShowError) {
      // Network error
      globalShowError('Network error. Please check your connection.')
    } else if (globalShowError) {
      // Other errors
      globalShowError('An unexpected error occurred.')
    }

    return Promise.reject(error)
  }
)

export default apiClient