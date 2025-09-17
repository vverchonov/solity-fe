import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { authAPI } from '../services/auth'
import { useToastContext } from '../contexts/ToastContext'
import { useUser } from '../contexts/UserContext'
import { useHealth } from '../contexts/HealthProvider'
import { useI18n } from '../contexts/I18nProvider'
import ReCAPTCHA from 'react-google-recaptcha'
import LanguageToggle from './LanguageToggle'

function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { addToast } = useToastContext()
  const { updateUser, user, isLoading, shouldRedirectToDashboard, clearRedirectFlag } = useUser()
  const { health, isServerHealthy, getUnhealthyServices } = useHealth()
  const { t } = useI18n()
  const recaptchaRef = useRef(null)
  const [recaptchaToken, setRecaptchaToken] = useState(null)

  // Redirect if already authenticated or after successful refresh
  useEffect(() => {
    if (!isLoading && (user || shouldRedirectToDashboard)) {
      navigate('/dashboard')
      if (shouldRedirectToDashboard) {
        clearRedirectFlag()
      }
    }
  }, [user, isLoading, shouldRedirectToDashboard, navigate, clearRedirectFlag])


  // Reset reCAPTCHA when switching between login/register
  useEffect(() => {
    if (recaptchaRef.current) {
      recaptchaRef.current.reset()
      setRecaptchaToken(null)
    }
  }, [isLogin])

  // Show loading screen while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">{t('login.loading')}</p>
        </div>
      </div>
    )
  }

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token)
  }

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null)
  }

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const validatePassword = (password, isSignup = false) => {
    if (password.length < 12) {
      return t('login.passwordTooShort')
    }

    if (isSignup) {
      if (!/[A-Z]/.test(password)) {
        return t('login.passwordNeedsUppercase')
      }
      if (!/[a-z]/.test(password)) {
        return t('login.passwordNeedsLowercase')
      }
      if (!/[0-9]/.test(password)) {
        return t('login.passwordNeedsDigit')
      }
      if (!/[^A-Za-z0-9]/.test(password)) {
        return t('login.passwordNeedsSpecial')
      }
    }

    return null
  }

  const validateUsername = (username) => {
    if (username.length < 3) {
      return t('login.usernameTooShort')
    }
    if (username.length > 30) {
      return t('login.usernameTooLong')
    }
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    console.log('Form submitted:', { isLogin, formData })

    if (!formData.username || !formData.password) {
      addToast(t('login.fillAllFields'), 'error')
      return
    }

    // Validate username
    const usernameError = validateUsername(formData.username)
    if (usernameError) {
      addToast(usernameError, 'error')
      return
    }

    // Validate password
    const passwordError = validatePassword(formData.password, !isLogin)
    if (passwordError) {
      addToast(passwordError, 'error')
      return
    }

    if (!isLogin && formData.password !== formData.confirmPassword) {
      addToast(t('login.passwordsDoNotMatch'), 'error')
      return
    }

    // Check reCAPTCHA
    if (!recaptchaToken) {
      addToast(t('login.recaptchaRequired'), 'error')
      return
    }

    setLoading(true)
    console.log('Starting authentication request...')

    try {
      let result
      if (isLogin) {
        console.log('Making login request...')
        result = await authAPI.login(formData.username, formData.password, recaptchaToken)
      } else {
        console.log('Making register request...')
        result = await authAPI.register(formData.username, formData.password, recaptchaToken)
      }

      console.log('Authentication result:', result)

      if (result.success) {
        // Store user data in context
        console.log('Current user:', result.data.user)
        updateUser(result.data.user)
        addToast(isLogin ? t('login.loginSuccessful') : t('login.accountCreated'), 'success')
        navigate('/dashboard')
      } else {
        addToast(result.error || t('login.authenticationFailed'), 'error')
      }
    } catch (error) {
      console.error('Authentication error:', error)
      addToast(error.message || t('login.authenticationFailed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-950 via-blue-950 to-black overflow-x-hidden">
      {/* Background Overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#0e1b4f] via-[#0b0f23] to-black opacity-90"></div>
      <div className="pointer-events-none fixed -top-48 -left-24 h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-[#0A43FF]/30 to-transparent blur-3xl"></div>

      {/* Navbar */}
      <nav className="relative w-full px-4 py-4 lg:p-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <img src="/logo.png" alt="Logo" className="h-8 sm:h-10 lg:h-12 w-auto" />
            <LanguageToggle />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative w-full flex items-center justify-center px-4 py-2 min-h-[calc(100vh-120px)]">
        <div className="w-full max-w-7xl flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-12 mx-auto">

          {/* Welcome Card */}
          <div className="w-full lg:w-1/2 card p-4 sm:p-6 lg:p-12 min-w-0 flex-shrink-0 mx-auto">
            <div className="space-y-4 sm:space-y-6 lg:space-y-8 w-full">
              <div className="w-full text-center lg:text-left">
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold text-white mb-3 lg:mb-4 break-words">
                  {t('login.solityMobile')}
                </h1>
                <h2 className="text-lg sm:text-xl lg:text-3xl text-blue-300 mb-4 lg:mb-6 break-words">
                  {t('login.solanaEcosystem')}
                </h2>
                <p className="text-white/70 text-sm sm:text-base lg:text-lg leading-relaxed">
                  {t('login.description')}
                </p>
              </div>

              <div className="space-y-4 lg:space-y-6 w-full">
                <div className="flex items-center justify-center lg:justify-start gap-3 lg:gap-4">
                  <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <span className="text-blue-300 font-semibold text-sm lg:text-base">{t('login.onChain')}</span>
                    <p className="text-white/60 text-xs lg:text-sm">{t('login.transparentFees')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-3 lg:gap-4">
                  <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <span className="text-green-300 font-semibold text-sm lg:text-base">{t('login.private')}</span>
                    <p className="text-white/60 text-xs lg:text-sm">{t('login.noKyc')}</p>
                  </div>
                </div>

                <div className="flex items-center justify-center lg:justify-start gap-3 lg:gap-4">
                  <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                  <div className="min-w-0 flex-1">
                    <span className="text-purple-300 font-semibold text-sm lg:text-base">{t('login.decentralised')}</span>
                    <p className="text-white/60 text-xs lg:text-sm">{t('login.anyNumbers')}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 lg:pt-8 border-t border-white/10">
                <div className="space-y-2 flex flex-col items-center lg:items-start">
                  <p className="text-white/50 text-xs lg:text-sm">{t('login.companyRegistration')}</p>
                  <p className="text-white font-mono text-sm lg:text-lg">CA</p>
                  <div className="flex items-center gap-2 mt-3 lg:mt-4">
                    <div className="flex items-end gap-0.5">
                      <div className={`w-1 h-2 rounded-sm ${health.api ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className={`w-1 h-3 rounded-sm ${health.db ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className={`w-1 h-4 rounded-sm ${health.tele ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className={`w-1 h-5 rounded-sm ${isServerHealthy() ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    </div>
                    <div className="flex flex-col relative group">
                      <span className={`text-xs font-medium ${isServerHealthy() ? 'text-green-300' : 'text-red-300'}`}>
                        {isServerHealthy() ? t('login.servicesOnline') : t('login.someServicesOffline')}
                      </span>
                      {!isServerHealthy() && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                          {t('login.offline')}: {getUnhealthyServices().join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Auth Card */}
          <div className="w-full lg:w-1/2 card p-4 sm:p-6 lg:p-12 min-w-0 flex-shrink-0 mx-auto">
            <div className="space-y-6 lg:space-y-8 w-full">
              <div className="text-center w-full">
                <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-6 lg:mb-8">
                  {isLogin ? t('login.signIn') : t('login.createAccount')}
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
                  {t('login.login')}
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-4 rounded-xl text-sm font-medium transition-all ${!isLogin
                    ? 'bg-white text-gray-900 shadow-lg'
                    : 'text-white/60 hover:text-white'
                    }`}
                >
                  {t('login.signUp')}
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="username" className="block text-white/70 text-sm font-medium mb-2">
                    {t('login.username')}
                  </label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
                    placeholder={t('login.enterUsername')}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-white/70 text-sm font-medium mb-2">
                    {t('login.password')}
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
                    placeholder={t('login.enterPassword')}
                    required
                  />
                </div>

                {!isLogin && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-white/70 text-sm font-medium mb-2">
                      {t('login.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/10 transition-all"
                      placeholder={t('login.confirmYourPassword')}
                      required
                    />
                  </div>
                )}

                {/* reCAPTCHA */}
                <div className="flex justify-center">
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={import.meta.env.VITE_RECAPTCHA_SITE_KEY}
                    onChange={handleRecaptchaChange}
                    onExpired={handleRecaptchaExpired}
                    theme="dark"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !recaptchaToken}
                  className={`w-full py-3 px-6 font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl ${loading || !recaptchaToken
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-white hover:bg-gray-100 text-gray-900'
                    }`}
                >
                  {loading ? t('login.pleaseWait') : (isLogin ? t('login.signIn') : t('login.createAccount'))}
                </button>
              </form>

            </div>
            {isLogin && (
              <div className="text-center">
                <button
                  onClick={() => addToast(t('login.contactSupport'), 'info')}
                  className="text-sm mt-2 text-white/70 hover:text-white"
                >
                  {t('login.forgotPassword')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
