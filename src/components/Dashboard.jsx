import { useState } from 'react'
import Call from './Call'
import Support from './Support'
import BalanceModule from './BalanceModule'
import CallerID from './CallerID'
import Scaling from './Scaling'

function Dashboard() {
  const [activeModule, setActiveModule] = useState('Call')

  const menuItems = ['Call', 'Caller ID', 'Balance', 'About', 'Scaling', 'Support']

  const renderModule = () => {
    switch (activeModule) {
      case 'Call':
        return <Call />
      case 'Caller ID':
        return <CallerID />
      case 'Balance':
        return <BalanceModule />
      case 'Support':
        return <Support />
      case 'Scaling':
        return <Scaling />
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
                    <button
                      key={item}
                      onClick={() => setActiveModule(item)}
                      className={`w-full text-left px-4 py-3 rounded-xl ring-1 ring-white/10 font-medium transition-all duration-200 ${activeModule === item
                        ? 'bg-white/10 border border-white/20 text-white'
                        : 'hover:bg-white/5 text-white/70'
                        }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Server Status Card */}
              <div className="card p-4">
                <div className="flex items-center gap-3">
                  <span className="text-white/70 text-sm">Solity API:</span>
                  <span className="text-green-300 text-sm font-medium">Online</span>
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
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