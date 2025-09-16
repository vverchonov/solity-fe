import { useState } from 'react'
import { useLogs } from '../contexts/LogsProvider'

function Support() {
  const { logs } = useLogs()

  const handleCopyLogs = () => {
    if (logs.length === 0) {
      const noLogsMessage = 'No logs available - session just started'
      navigator.clipboard.writeText(noLogsMessage)
      console.log('No logs message copied to clipboard')
      return
    }

    // Format logs for copying
    const formattedLogs = logs.map(log => {
      let logText = `${log.timestamp} ${log.message}`
      if (log.details) {
        logText += `\n  Details: ${typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : log.details}`
      }
      return logText
    }).join('\n')

    navigator.clipboard.writeText(formattedLogs)
    console.log('Session logs copied to clipboard', `${logs.length} logs copied`)
  }

  const socialLinks = [
    {
      icon: '✓',
      name: 'Telegram',
      description: 'Join our community chat for quick support and updates',
      handle: '@Solityapp_Bot',
      buttonText: 'Join Telegram',
      url: 'https://t.me/Solityapp_Bot'
    },
    {
      icon: '#',
      name: 'Discord',
      description: 'Connect with other users and get technical help',
      handle: 'discord.gg/EHz8Yjy2',
      buttonText: 'Join Discord',
      url: 'https://discord.gg/EHz8Yjy2'
    },
    {
      icon: 'X',
      name: 'X (Twitter)',
      description: 'Follow us for the latest news and announcements',
      handle: '@solity_sol',
      buttonText: 'Join X (Twitter)',
      url: 'https://x.com/solity_sol'
    }
  ]

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Social Links - Responsive Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {socialLinks.map((link) => (
          <div key={link.name} className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                {link.name === 'Telegram' ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                  </svg>
                ) : link.name === 'Discord' ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0003 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1568 2.4189Z"/>
                  </svg>
                ) : link.name === 'X (Twitter)' ? (
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                ) : (
                  <span className="text-white font-bold">{link.icon}</span>
                )}
              </div>
              <h3 className="text-xl font-semibold text-white">{link.name}</h3>
            </div>

            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              {link.description}
            </p>

            <div className="mb-4">
              <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-white/80 font-mono text-sm break-all">{link.handle}</span>
              </div>
            </div>

            <button
              onClick={() => window.open(link.url, '_blank')}
              className="w-full bg-white/10 hover:bg-white/15 text-white py-3 rounded-xl transition-all font-medium min-h-[48px] touch-manipulation"
            >
              {link.buttonText}
            </button>
          </div>
        ))}
      </div>

      {/* Copy Session Logs */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-white mb-2">Attach session logs</h3>
            <p className="text-white/60 text-sm">
              If you contact support, include your session logs to help us resolve issues faster.
            </p>
          </div>
          <button
            onClick={handleCopyLogs}
            className="bg-white hover:bg-gray-100 text-gray-900 px-8 py-3 rounded-xl font-semibold transition-all whitespace-nowrap min-h-[48px] touch-manipulation w-full sm:w-auto"
          >
            Copy session logs
          </button>
        </div>
      </div>

      {/* Response Time Info */}
      <div className="card p-6 text-center">
        <div className="text-white/60 space-y-1">
          <p className="text-lg">We typically respond within 24 hours</p>
          <p className="text-sm">Support available in multiple timezones</p>
        </div>
      </div>
    </div>
  )
}

export default Support