import { useState } from 'react'

function CallerID() {
  const [callerID, setCallerID] = useState('+12025550123')

  const handleUse = () => {
    console.log('Using caller ID:', callerID)
  }

  const handleRandomize = () => {
    const randomNum = '+1' + Math.floor(Math.random() * 9000000000 + 1000000000)
    setCallerID(randomNum)
  }

  return (
    <div className="h-full">
      <div className="card p-8">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-white mb-3">Caller ID</h1>
            <p className="text-white/60">
              Choose the identifier shown to recipients. You can change it any time before placing a call.
            </p>
          </div>

          {/* Input and Buttons */}
          <div className="mb-8">
            <div className="flex gap-3">
              <input
                type="text"
                value={callerID}
                onChange={(e) => setCallerID(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                placeholder="Enter caller ID"
              />
              <button
                onClick={handleUse}
                className="bg-white hover:bg-gray-100 text-gray-900 px-6 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
              >
                Use
              </button>
              <button
                onClick={handleRandomize}
                className="bg-white/10 hover:bg-white/15 text-white px-6 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap"
              >
                Randomize
              </button>
            </div>
          </div>

          {/* Footer Text */}
          <div className="space-y-2 text-sm text-white/50">
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-white/50 rounded-full mt-2 flex-shrink-0"></div>
              <span>Caller ID is ephemeral to the session and not saved.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1 h-1 bg-white/50 rounded-full mt-2 flex-shrink-0"></div>
              <span>Respect local regulations when presenting caller information.</span>
            </div>
          </div>
        </div>
    </div>
  )
}

export default CallerID