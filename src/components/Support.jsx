import { useState } from 'react'

function Support() {
  const handleCopyLogs = () => {
    const logs = `[12:34:56] Session initialized
[12:34:57] Wallet connected: SOL1TyA68.DuK9
[12:34:58] Ready for calls
[12:35:12] Balance updated: 0.0000 SOL`
    
    navigator.clipboard.writeText(logs)
    console.log('Session logs copied to clipboard')
  }

  const socialLinks = [
    {
      icon: '✓',
      name: 'Telegram',
      description: 'Join our community chat for quick support and updates',
      handle: '@solity_official',
      buttonText: 'Join Telegram',
      url: 'https://t.me/solity_official'
    },
    {
      icon: '#',
      name: 'Discord',
      description: 'Connect with other users and get technical help',
      handle: 'discord.gg/solity',
      buttonText: '# Join Discord',
      url: 'https://discord.gg/solity'
    },
    {
      icon: 'X',
      name: 'X (Twitter)',
      description: 'Follow us for the latest news and announcements',
      handle: '@solity_app',
      buttonText: 'Join X (Twitter)',
      url: 'https://twitter.com/solity_app'
    }
  ]

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Social Links Grid */}
      <div className="grid grid-cols-3 gap-6">
        {socialLinks.map((link) => (
          <div key={link.name} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">{link.icon}</span>
              </div>
              <h3 className="text-xl font-semibold text-white">{link.name}</h3>
            </div>
            
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              {link.description}
            </p>
            
            <div className="mb-4">
              <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-3">
                <span className="text-white/80 font-mono text-sm">{link.handle}</span>
              </div>
            </div>
            
            <button 
              onClick={() => window.open(link.url, '_blank')}
              className="w-full bg-white/10 hover:bg-white/15 text-white py-3 rounded-lg transition-all font-medium"
            >
              {link.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Copy Session Logs */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">Attach session logs</h3>
            <p className="text-white/60 text-sm">
              If you contact support, include your session logs to help us resolve issues faster.
            </p>
          </div>
          <button
            onClick={handleCopyLogs}
            className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-lg font-semibold transition-all whitespace-nowrap"
          >
            Copy session logs
          </button>
        </div>
      </div>

      {/* Response Time Info */}
      <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 text-center">
        <div className="text-white/60 space-y-1">
          <p className="text-lg">We typically respond within 24 hours</p>
          <p className="text-sm">Support available in multiple timezones</p>
        </div>
      </div>
    </div>
  )
}

export default Support