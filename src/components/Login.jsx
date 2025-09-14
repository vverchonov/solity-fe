import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    console.log('Form submitted:', formData)

    if (isLogin) {
      navigate('/dashboard')
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-black">
      {/* Background Overlay */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#0e1b4f] via-[#0b0f23] to-black opacity-90"></div>
      <div className="pointer-events-none absolute -top-48 -left-24 h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-[#0A43FF]/30 to-transparent blur-3xl"></div>

      {/* Navbar */}
      <nav className="relative p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative flex items-center justify-center p-4 min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Welcome Card */}
          <div className="w-full lg:w-1/2 card p-8 lg:p-12">
            <div className="space-y-8">
              <div>
                <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                  Solity Mobile
                </h1>
                <h2 className="text-2xl lg:text-3xl text-blue-300 mb-6">
                  Solana Ecosystem
                </h2>
                <p className="text-white/70 text-lg leading-relaxed">
                  Onchain telecommunication company providing worldwide service. Solana ecosystem based. Private calls any number to any number.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <div>
                    <span className="text-blue-300 font-semibold">on-chain</span>
                    <p className="text-white/60 text-sm">Transparent fees in SOL</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <div>
                    <span className="text-green-300 font-semibold">private</span>
                    <p className="text-white/60 text-sm">No KYC, no call history</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <div>
                    <span className="text-purple-300 font-semibold">decentralised</span>
                    <p className="text-white/60 text-sm">Any numbers to use</p>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/10">
                <div className="space-y-2">
                  <p className="text-white font-mono text-lg">CA: soon</p>
                  <div className="mt-4">

                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Card */}
          <div className="w-full lg:w-1/2 card p-8 lg:p-12">
            <div className="space-y-8">
              <div className="text-center">
                <h3 className="text-2xl lg:text-3xl font-bold text-white mb-8">
                  {isLogin ? 'Sign In' : 'Create Account'}
                </h3>
              </div>

              {/* Toggle Buttons */}
              <div className="flex bg-white/5 rounded-xl p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${isLogin
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-white/60 hover:text-white'
                    }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${!isLogin
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-white/60 hover:text-white'
                    }`}
                >
                  Sign Up
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-white/70 text-sm font-medium mb-2">
                    Username
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
                    placeholder="Enter your username"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-white/70 text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-white/70 text-sm font-medium mb-2">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
                      placeholder="Confirm your password"
                      required
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-6 bg-white hover:bg-gray-100 text-gray-900 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  {isLogin ? 'Sign In' : 'Create Account'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login