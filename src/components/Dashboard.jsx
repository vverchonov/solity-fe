import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Call from './Call'
import Support from './Support'
import BalanceModule from './BalanceModule'
import Scaling from './Scaling'
import { CallModal } from './CallModal'
import LanguageToggle from './LanguageToggle'
import { useHealth } from '../contexts/HealthProvider'
import { useUser } from '../contexts/UserContext'
import { useCall } from '../contexts/CallProvider'
import { useI18n } from '../contexts/I18nProvider'
import { authAPI } from '../services/auth'

function Dashboard() {
  const [activeModule, setActiveModule] = useState('Call')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [isModalMinimized, setIsModalMinimized] = useState(false)
  const [callStartTime, setCallStartTime] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState('ready')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [soundDisabled, setSoundDisabled] = useState(false)
  const [ringingTimeout, setRingingTimeout] = useState(null)
  const navigate = useNavigate()
  const { health, isServerHealthy, getUnhealthyServices } = useHealth()
  const { user, clearUser } = useUser()
  const { callState, hangupCall, toggleMute, sendDTMF } = useCall()
  const { t } = useI18n()

  const menuItems = [
    { key: 'Call', label: t('navigation.call') },
    { key: 'Balance', label: t('navigation.balance') },
    { key: 'About', label: t('navigation.about') },
    { key: 'E-SIM', label: t('navigation.esim') },
    { key: 'Support', label: t('navigation.support') }
  ]

  // Derived state for call
  const isInCall = callState.callStatus === 'in-call'
  const isCallActive = callState.callStatus === 'in-call' || callState.callStatus === 'calling' || callStatus === 'ringing'
  const isMuted = callState.isMuted

  // Call duration effect
  useEffect(() => {
    let interval = null
    if (isInCall && callStartTime) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime) / 1000))
      }, 1000)
    } else {
      setCallDuration(0)
    }
    return () => clearInterval(interval)
  }, [isInCall, callStartTime])

  // Sync with CallProvider state changes
  useEffect(() => {
    if (callState.callStatus === 'in-call' && callStatus !== 'in-call') {
      // Clear ringing timeout when call connects
      if (ringingTimeout) {
        clearTimeout(ringingTimeout)
        setRingingTimeout(null)
      }
      if (!callStartTime) {
        setCallStartTime(Date.now())
      }
      // Only show modal if user hasn't explicitly minimized it
      if (!isModalMinimized) {
        setIsModalVisible(true)
      }
      setCallStatus('in-call')
    } else if (callState.callStatus === 'calling' && callStatus !== 'ringing' && callStatus !== 'in-call') {
      setCallStatus('ringing')
      // Only show modal if user hasn't explicitly minimized it
      if (!isModalMinimized) {
        setIsModalVisible(true)
      }
      // Set 3-minute timeout for ringing calls
      const timeout = setTimeout(async () => {
        try {
          await hangupCall()
          setCallStatus('ended')
          setCallStartTime(null)
          setCallDuration(0)
          setIsModalVisible(false)
          setIsModalMinimized(false)
          setTimeout(() => setCallStatus('ready'), 3000)
        } catch (error) {
        }
      }, 3 * 60 * 1000) // 3 minutes
      setRingingTimeout(timeout)
    } else if (callState.callStatus === 'idle' && (callStatus === 'in-call' || callStatus === 'ringing')) {
      // Only transition to 'ended' if we were actually in a call or ringing
      // Clear ringing timeout when call ends
      if (ringingTimeout) {
        clearTimeout(ringingTimeout)
        setRingingTimeout(null)
      }
      setCallStartTime(null)
      setCallDuration(0)
      setIsModalVisible(false)
      setIsModalMinimized(false) // Reset minimize state when call ends
      setCallStatus('ended')
      setTimeout(() => setCallStatus('ready'), 5000)
    }
  }, [callState.callStatus, callStartTime, callStatus, isModalMinimized, ringingTimeout, hangupCall])

  // Call handlers
  const handleEndCall = async () => {
    try {
      // Clear ringing timeout if active
      if (ringingTimeout) {
        clearTimeout(ringingTimeout)
        setRingingTimeout(null)
      }
      await hangupCall()
      setCallStatus('ended')
      setCallStartTime(null)
      setCallDuration(0)
      setSoundDisabled(false)
      setIsModalVisible(false)
      setTimeout(() => {
        setCallStatus('ready')
      }, 5000)
    } catch (error) {
    }
  }

  const handleMute = async () => {
    try {
      await toggleMute()
    } catch (error) {
    }
  }

  const handleSoundToggle = () => {
    setSoundDisabled(!soundDisabled)
  }

  const handleDTMF = (digit) => {
    sendDTMF(digit)
  }

  const handleMinimizeModal = () => {
    setIsModalVisible(false)
    setIsModalMinimized(true)
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (ringingTimeout) {
        clearTimeout(ringingTimeout)
      }
    }
  }, [ringingTimeout])

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      clearUser()
      navigate('/')
    } catch (error) {
      // Clear user state and redirect even if logout fails
      clearUser()
      navigate('/')
    }
  }

  // Function to navigate to Balance module and scroll to invoices
  const navigateToInvoices = () => {
    setActiveModule('Balance')
    // Scroll to invoices table after module changes
    setTimeout(() => {
      const invoicesSection = document.getElementById('recent-invoices-section')
      if (invoicesSection) {
        invoicesSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    }, 100) // Small delay to allow module to render
  }

  const renderModule = () => {
    switch (activeModule) {
      case 'Call':
        return <Call
          onNavigateToInvoices={navigateToInvoices}
          onNavigateToSupport={() => setActiveModule('Support')}
          onCallStateChange={({ phoneNumber: phone, startTime, status }) => {
            if (phone !== undefined) setPhoneNumber(phone)
            if (startTime !== undefined) setCallStartTime(startTime)
            if (status !== undefined) setCallStatus(status)
          }}
        />
      case 'Balance':
        return <BalanceModule onNavigateToSupport={() => setActiveModule('Support')} />
      case 'About':
        return (
          <div className="h-full space-y-6">
            {/* About Cards */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-white mb-6">{t('about.aboutSolity')}</h2>
              <div>
                <p className="text-white/80 text-base leading-relaxed">
                  {t('about.aboutDescription')}
                </p>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-bold text-white mb-4">{t('about.solityNet')}</h3>
              <p className="text-white/80 text-base leading-relaxed">
                {t('about.solityNetDescription')}
              </p>
            </div>

            {/* Scaling Content */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-white mb-3">
                {t('about.scaling')}
              </h2>
              <p className="text-white/70 text-base mb-6">
                {t('about.scalingDescription')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white/10 border border-white/20 text-white/80 px-4 py-2 rounded-full text-sm w-fit">
                  {t('about.lastUpdated')}
                </div>
                <div className="bg-white/10 border border-white/20 text-white/80 px-4 py-2 rounded-full text-sm w-fit">
                  {t('about.environment')}
                </div>
              </div>
            </div>

            <Scaling />
          </div>
        )
      case 'Support':
        return <Support />
      default:
        return (
          <div className="flex items-center justify-center min-h-[calc(100vh-200px)]">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-white mb-4">
                {activeModule}
              </h1>
              <p className="text-lg text-white/70">
{activeModule} {t('navigation.module')} - {t('common.comingSoon')}
              </p>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-black">
      {/* Background Overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#0e1b4f] via-[#0b0f23] to-black opacity-90"></div>
      <div className="pointer-events-none fixed -top-48 -left-24 h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-[#0A43FF]/30 to-transparent blur-3xl"></div>
      <div className="pointer-events-none fixed -bottom-48 -right-24 h-[40rem] w-[40rem] rounded-full bg-gradient-to-bl from-[#0A43FF]/30 to-transparent blur-3xl"></div>

      {/* Main Layout */}
      <div className="relative p-6">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Navigation Bar - Shows on screens < 650px */}
          <div className="max-[649px]:block hidden mb-6">
            <div className="card p-3">
              <div className="flex items-center gap-4">
                {/* Logo */}
                <div className="flex items-center">
                  <img src="/logo.png" alt="Logo" className="h-6 w-auto" />
                </div>

                {/* Hamburger Menu Button */}
                <button
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="px-2 py-2 font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200 flex items-center rounded-lg"
                  title="Menu"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {isMobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                  </svg>
                </button>

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Username, Language Toggle, Status & Logout - Always Visible */}
                <div className="flex items-center gap-3">
                  {/* Username */}
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-white/80 text-[0.5rem] text-center font-medium">
                      {user?.username || t('account.username')}
                    </span>
                    {/* In Call Indicator - Compact */}
                    {(callStatus === 'in-call' || callStatus === 'ringing') && (
                      <button
                        onClick={() => {
                          setIsModalVisible(true)
                          setIsModalMinimized(false)
                        }}
                        className="w-2 h-2 bg-green-500 hover:bg-green-400 rounded-full transition-all"
                        title="In call - Click to show call modal"
                      >
                      </button>
                    )}
                  </div>

                  {/* Language Toggle - Compact */}
                  <LanguageToggle compact={true} />

                  {/* Compact Server Status */}
                  <div className="flex items-center gap-2 relative group" title={`${t('server.solityNet')}: ${isServerHealthy() ? t('common.online') : t('common.offline')}`}>
                    <div className="flex items-end gap-0.5">
                      <div className={`w-0.5 h-1.5 rounded-sm ${health.api ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className={`w-0.5 h-2 rounded-sm ${health.db ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className={`w-0.5 h-2.5 rounded-sm ${health.tele ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className={`w-0.5 h-3 rounded-sm ${isServerHealthy() ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    </div>
                    {!isServerHealthy() && (
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                        Offline: {getUnhealthyServices().join(', ')}
                      </div>
                    )}
                  </div>

                  {/* Compact Logout Button */}
                  <button
                    onClick={handleLogout}
                    className="px-2 py-2 font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200 flex items-center rounded-lg"
                    title="Log Out"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Collapsible Menu Items */}
              <div className={`transition-all duration-300 overflow-hidden ${isMobileMenuOpen ? 'max-h-96 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                <div className="border-t border-white/10 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    {menuItems.map((item) => (
                      <div key={item.key} className={`relative ${item.key === 'E-SIM' ? 'group' : ''}`}>
                        <button
                          onClick={item.key === 'E-SIM' ? undefined : () => {
                            setActiveModule(item.key)
                            setIsMobileMenuOpen(false)
                          }}
                          disabled={item.key === 'E-SIM'}
                          className={`w-full text-center px-3 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${item.key === 'E-SIM'
                            ? 'opacity-50 cursor-not-allowed text-white/50'
                            : activeModule === item.key
                              ? 'bg-white/10 border border-white/20 text-white'
                              : 'hover:bg-white/5 text-white/70'
                            }`}
                        >
                          {item.label}
                          {item.key === 'E-SIM' && (
                            <svg className="w-3 h-3 text-white/40 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </button>
                        {item.key === 'E-SIM' && (
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            {t('common.comingSoon')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Layout - Shows on screens >= 650px */}
          <div className="min-[650px]:flex hidden gap-6">
            {/* Sidebar Column */}
            <div className="w-[200px] flex flex-col gap-6">
              {/* Logo Card */}
              <div className="card p-2 flex items-center justify-center">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
              </div>

              {/* Menu Card */}
              <div className="card p-2">
                <div className="flex flex-col gap-3">
                  {menuItems.map((item) => (
                    <div key={item.key} className={`relative ${item.key === 'E-SIM' ? 'group' : ''}`}>
                      <button
                        onClick={item.key === 'E-SIM' ? undefined : () => setActiveModule(item.key)}
                        disabled={item.key === 'E-SIM'}
                        className={`w-full text-left px-4 py-3 rounded-xl ring-1 ring-white/10 font-medium transition-all duration-200 flex items-center justify-between ${item.key === 'E-SIM'
                          ? 'opacity-50 cursor-not-allowed text-white/50'
                          : activeModule === item.key
                            ? 'bg-white/10 border border-white/20 text-white'
                            : 'hover:bg-white/5 text-white/70'
                          }`}
                      >
                        <span>{item.label}</span>
                        {item.key === 'E-SIM' && (
                          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </button>
                      {item.key === 'E-SIM' && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          {t('common.comingSoon')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Server Status Card */}
              <div className="card px-4 py-2 flex flex-col gap-2">
                <div className="w-full flex items-baseline justify-start gap-1 px-3 py-3 relative group">
                  <span className="text-white/70 text-sm">{t('server.solityNet')}:</span>
                  <span className={`text-sm font-medium ${isServerHealthy() ? 'text-green-300' : 'text-red-300'}`}>
                    {isServerHealthy() ? t('common.online') : t('common.offline')}
                  </span>
                  <div className="flex items-end gap-0.5">
                    <div className={`w-0.5 h-1.5 rounded-sm ${health.api ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div className={`w-0.5 h-2 rounded-sm ${health.db ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div className={`w-0.5 h-2.5 rounded-sm ${health.tele ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div className={`w-0.5 h-3 rounded-sm ${isServerHealthy() ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  </div>
                  {!isServerHealthy() && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                      Offline: {getUnhealthyServices().join(', ')}
                    </div>
                  )}
                </div>


                {/* Username Section */}
                <div className="w-full px-3 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <div className="text-white/80 text-sm font-medium">
                        {user?.username || t('account.username')}
                      </div>
                    </div>
                    {/* In Call Indicator - Expanded */}
                    {(callStatus === 'in-call' || callStatus === 'ringing') && (
                      <button
                        onClick={() => {
                          setIsModalVisible(true)
                          setIsModalMinimized(false)
                        }}
                        className="w-3 h-3 bg-green-500 hover:bg-green-400 rounded-full transition-all"
                        title="In call - Click to show call modal"
                      >
                      </button>
                    )}
                  </div>
                </div>

                {/* Language Toggle - Styled like logout button */}
                <LanguageToggle />

                {/* Logout Button */}
                <button
                  onClick={handleLogout}
                  className="w-full text-sm px-3 py-3 font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200 flex items-center justify-start gap-3 rounded-lg"
                >
                  <div className="w-6 h-6 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <span>{t('navigation.logout')}</span>
                </button>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {renderModule()}
            </div>
          </div>

          {/* Mobile Main Content - Shows on screens < 650px */}
          <div className="max-[649px]:block hidden">
            {renderModule()}
          </div>
        </div>
      </div>

      {/* Global Call Modal - Appears on all pages when call is active */}
      <CallModal
        isVisible={isCallActive && isModalVisible}
        phoneNumber={phoneNumber}
        callDuration={callDuration}
        isMuted={isMuted}
        soundDisabled={soundDisabled}
        callStatus={callState.callStatus === 'calling' ? 'ringing' : callStatus}
        onEndCall={handleEndCall}
        onMute={handleMute}
        onSoundToggle={handleSoundToggle}
        onDTMF={handleDTMF}
        onMinimize={handleMinimizeModal}
      />
    </div>
  )
}

export default Dashboard
