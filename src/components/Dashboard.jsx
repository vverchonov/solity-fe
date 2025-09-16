import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Call from './Call'
import Support from './Support'
import BalanceModule from './BalanceModule'
import Scaling from './Scaling'
import { useHealth } from '../contexts/HealthProvider'
import { useUser } from '../contexts/UserContext'
import { authAPI } from '../services/auth'

function Dashboard() {
  const [activeModule, setActiveModule] = useState('Call')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const navigate = useNavigate()
  const { health, isServerHealthy, getUnhealthyServices } = useHealth()
  const { user, clearUser } = useUser()

  const menuItems = ['Call', 'Balance', 'About', 'E-SIM', 'Support']

  const handleLogout = async () => {
    try {
      await authAPI.logout()
      clearUser()
      navigate('/')
    } catch (error) {
      console.error('Logout error:', error)
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
        return <Call onNavigateToInvoices={navigateToInvoices} onNavigateToSupport={() => setActiveModule('Support')} />
      case 'Balance':
        return <BalanceModule onNavigateToSupport={() => setActiveModule('Support')} />
      case 'About':
        return (
          <div className="h-full space-y-6">
            {/* About Cards */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-white mb-6">About Solity</h2>
              <div>
                <p className="text-white/80 text-base leading-relaxed">
                  Solity is an on-chain mobility service provider built on Solana. Users fund account in SOL, which settle transparently to the Solity Treasury. Our flagship product, SolityNET, lets you place global, low-latency voice calls with flexible caller identity options. Next, we're rolling out a suite of innovative mobility products that reject the usual corporate limitations, making connectivity more open, programmable, and user-controlled.
                </p>
              </div>
            </div>

            <div className="card p-6">
              <h3 className="text-xl font-bold text-white mb-4">SolityNET</h3>
              <p className="text-white/80 text-base leading-relaxed">
                SolityNET is a comprehensive solution to decentralize global telephony. At launch, calling will be available in the US and Canada. We can onboard 80+ countries, but to avoid overloading the network we'll expand coverage gradually - adding regions day by day.
              </p>
            </div>

            {/* Scaling Content */}
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-white mb-3">
                Scaling
              </h2>
              <p className="text-white/70 text-base mb-6">
                What's planned for the server and our general scaling map.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white/10 border border-white/20 text-white/80 px-4 py-2 rounded-full text-sm w-fit">
                  Last updated 9/13/2025
                </div>
                <div className="bg-white/10 border border-white/20 text-white/80 px-4 py-2 rounded-full text-sm w-fit">
                  Environment: SolityNET
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
                {activeModule} module - Coming soon
              </p>
            </div>
          </div>
        )
    }
  }
  console.log("user = ", user)

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

                {/* Username, Status & Logout - Always Visible */}
                <div className="flex items-center gap-3">
                  {/* Username */}
                  <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 flex items-center gap-2">
                    <div className="w-5 h-5 bg-white/10 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <span className="text-white/80 text-[0.5rem] text-center font-medium">
                      {user?.userRole === 'admin' ? 'Admin User' :
                        user?.userRole === 'premium' ? 'Premium User' :
                          'Standard User'}
                    </span>
                  </div>

                  {/* Compact Server Status */}
                  <div className="flex items-center gap-2" title={`Solity NET: ${isServerHealthy() ? 'Online' : 'No Connection'}`}>
                    <div className="flex items-end gap-0.5">
                      <div className={`w-0.5 h-1.5 rounded-sm ${health.api ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className={`w-0.5 h-2 rounded-sm ${health.db ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className={`w-0.5 h-2.5 rounded-sm ${health.tele ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      <div className={`w-0.5 h-3 rounded-sm ${isServerHealthy() ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    </div>
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
                      <div key={item} className={`relative ${item === 'E-SIM' ? 'group' : ''}`}>
                        <button
                          onClick={item === 'E-SIM' ? undefined : () => {
                            setActiveModule(item)
                            setIsMobileMenuOpen(false)
                          }}
                          disabled={item === 'E-SIM'}
                          className={`w-full text-center px-3 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${item === 'E-SIM'
                            ? 'opacity-50 cursor-not-allowed text-white/50'
                            : activeModule === item
                              ? 'bg-white/10 border border-white/20 text-white'
                              : 'hover:bg-white/5 text-white/70'
                            }`}
                        >
                          {item}
                          {item === 'E-SIM' && (
                            <svg className="w-3 h-3 text-white/40 inline ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                          )}
                        </button>
                        {item === 'E-SIM' && (
                          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
                            Coming soon
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Server Status Details (when menu is open) */}
                  {!isServerHealthy() && (
                    <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <div className="text-xs text-red-400">
                        Issues: {getUnhealthyServices().join(', ')}
                      </div>
                    </div>
                  )}
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
                    <div key={item} className={`relative ${item === 'E-SIM' ? 'group' : ''}`}>
                      <button
                        onClick={item === 'E-SIM' ? undefined : () => setActiveModule(item)}
                        disabled={item === 'E-SIM'}
                        className={`w-full text-left px-4 py-3 rounded-xl ring-1 ring-white/10 font-medium transition-all duration-200 flex items-center justify-between ${item === 'E-SIM'
                          ? 'opacity-50 cursor-not-allowed text-white/50'
                          : activeModule === item
                            ? 'bg-white/10 border border-white/20 text-white'
                            : 'hover:bg-white/5 text-white/70'
                          }`}
                      >
                        <span>{item}</span>
                        {item === 'E-SIM' && (
                          <svg className="w-4 h-4 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        )}
                      </button>
                      {item === 'E-SIM' && (
                        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Coming soon
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Server Status Card */}
              <div className="card px-4 py-2 flex flex-col gap-2">
                <div className="w-full flex items-baseline justify-start gap-1 px-3 py-3">
                  <span className="text-white/70 text-sm">SolityNET:</span>
                  <span className={`text-sm font-medium ${isServerHealthy() ? 'text-green-300' : 'text-red-300'}`}>
                    {isServerHealthy() ? 'Online' : 'No Connection'}
                  </span>
                  <div className="flex items-end gap-0.5">
                    <div className={`w-0.5 h-1.5 rounded-sm ${health.api ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div className={`w-0.5 h-2 rounded-sm ${health.db ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div className={`w-0.5 h-2.5 rounded-sm ${health.tele ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <div className={`w-0.5 h-3 rounded-sm ${isServerHealthy() ? 'bg-green-400' : 'bg-red-400'}`}></div>
                  </div>
                </div>
                {!isServerHealthy() && (
                <div className="mb-3 text-xs text-red-400">
                    Issues: {getUnhealthyServices().join(', ')}
                </div>
                )}


                {/* Username Section */}
                <div className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center justify-start gap-3">
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="text-white/80 text-sm font-medium">
                      {user?.userRole === 'admin' ? 'Admin User' :
                        user?.userRole === 'premium' ? 'Premium User' :
                          'Standard User'}
                    </div>
                  </div>
                </div>

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
                  <span>Log Out</span>
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
    </div>
  )
}

export default Dashboard
