import { useState } from 'react'
import Call from './Call'
import Support from './Support'
import BalanceModule from './BalanceModule'
import Scaling from './Scaling'

function Dashboard() {
  const [activeModule, setActiveModule] = useState('Call')

  const menuItems = ['Call', 'Balance', 'About', 'E-SIM', 'Support']

  const renderModule = () => {
    switch (activeModule) {
      case 'Call':
        return <Call />
      case 'Balance':
        return <BalanceModule />
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
                SolityNET is a comprehensive solution to decentralize global telephony. At launch, calling will be available in the US and Canada. We can onboard 80+ countries, but to avoid overloading the network we'll expand coverage gradually—adding regions day by day.
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
              <div className="flex gap-3">
                <div className="bg-white/10 border border-white/20 text-white/80 px-4 py-2 rounded-full text-sm">
                  Last updated 9/13/2025
                </div>
                <div className="bg-white/10 border border-white/20 text-white/80 px-4 py-2 rounded-full text-sm">
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-black">
      {/* Background Overlay */}
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-[#0e1b4f] via-[#0b0f23] to-black opacity-90"></div>
      <div className="pointer-events-none fixed -top-48 -left-24 h-[40rem] w-[40rem] rounded-full bg-gradient-to-tr from-[#0A43FF]/30 to-transparent blur-3xl"></div>
      <div className="pointer-events-none fixed -bottom-48 -right-24 h-[40rem] w-[40rem] rounded-full bg-gradient-to-bl from-[#0A43FF]/30 to-transparent blur-3xl"></div>

      {/* Main Layout */}
      <div className="relative p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6">
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
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <span className="text-white/70 text-sm">Solity API:</span>
                  <span className="text-green-300 text-sm font-medium">Online</span>
                  <div className="flex items-end gap-0.5">
                    <div className="w-0.5 h-1.5 bg-green-400 rounded-sm"></div>
                    <div className="w-0.5 h-2 bg-green-400 rounded-sm"></div>
                    <div className="w-0.5 h-2.5 bg-green-400 rounded-sm"></div>
                    <div className="w-0.5 h-3 bg-green-400 rounded-sm"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1">
              {renderModule()}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard