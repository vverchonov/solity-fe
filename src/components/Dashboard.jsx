import { useState } from 'react'
import Call from './Call'
import Support from './Support'
import BalanceModule from './BalanceModule'

function Dashboard() {
  const [activeModule, setActiveModule] = useState('Call')

  const menuItems = ['Call', 'Caller ID', 'Balance', 'About', 'Scaling', 'Support']

  const renderModule = () => {
    switch (activeModule) {
      case 'Call':
        return <Call />
      case 'Balance':
        return <BalanceModule />
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
      {/* Navbar */}
      <nav className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <img src="/logo.png" alt="Logo" className="h-12 w-auto" />
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm transition-all"
            >
              Log out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Layout */}
      <div className="px-6 pb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex gap-6">
            {/* Menu Card */}
            <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4 w-[200px] h-fit">
              <div className="flex flex-col gap-3">
                {menuItems.map((item) => (
                  <button
                    key={item}
                    onClick={() => setActiveModule(item)}
                    className={`px-4 py-2 rounded-lg text-sm text-start font-medium transition-all duration-200 ${activeModule === item
                      ? 'bg-white text-gray-900 shadow-lg'
                      : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                      }`}
                  >
                    {item}
                  </button>
                ))}
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