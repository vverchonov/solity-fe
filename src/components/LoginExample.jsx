import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'

function LoginExample() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '' // for registration
  })
  const [isRegisterMode, setIsRegisterMode] = useState(false)
  const [error, setError] = useState('')
  
  const { login, register, loading } = useAuth()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.username || !formData.password) {
      setError('Username and password are required')
      return
    }

    try {
      let result
      if (isRegisterMode) {
        result = await register(formData.username, formData.password, formData.email)
      } else {
        result = await login(formData.username, formData.password)
      }

      if (!result.success) {
        setError(result.error)
      }
      // On success, the useAuth hook will handle navigation/state updates
    } catch (error) {
      setError('An unexpected error occurred')
    }
  }

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode)
    setError('')
    setFormData({ username: '', password: '', email: '' })
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">
          {isRegisterMode ? 'Create Account' : 'Login'}
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-400/30 text-red-100 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/70 text-sm mb-2">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-white/70 text-sm mb-2">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
              placeholder="Enter password"
              required
            />
          </div>

          {isRegisterMode && (
            <div>
              <label className="block text-white/70 text-sm mb-2">Email (optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                placeholder="Enter email"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white py-3 rounded-xl font-medium transition-all"
          >
            {loading ? 'Please wait...' : (isRegisterMode ? 'Create Account' : 'Login')}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={toggleMode}
            className="text-blue-400 hover:text-blue-300 text-sm"
          >
            {isRegisterMode 
              ? 'Already have an account? Login' 
              : "Don't have an account? Sign up"
            }
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginExample