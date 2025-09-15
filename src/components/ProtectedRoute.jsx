import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '../contexts/UserContext'

const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useUser()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/')
    }
  }, [user, isLoading, navigate])

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading...</p>
        </div>
      </div>
    )
  }

  // Don't render children if not authenticated
  if (!user) {
    return null
  }

  return children
}

export default ProtectedRoute