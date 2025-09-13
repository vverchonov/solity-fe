import { useState, useEffect } from 'react'
import Balance from './Balance'

function Call() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callerID, setCallerID] = useState('+12025550123')
  const [isMuted, setIsMuted] = useState(false)
  const [soundDisabled, setSoundDisabled] = useState(false)
  const [isInCall, setIsInCall] = useState(false)
  const [callStartTime, setCallStartTime] = useState(null)
  const [callDuration, setCallDuration] = useState(0)

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

  const formatCallDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleNumberClick = (num) => {
    setPhoneNumber(prev => prev + num)
  }

  const handleClear = () => {
    setPhoneNumber('')
  }

  const handleDelete = () => {
    setPhoneNumber(prev => prev.slice(0, -1))
  }

  const handleReset = () => {
    setPhoneNumber('')
    setCallerID('+12025550123')
  }

  const randomizeCallerID = () => {
    const randomNum = '+1' + Math.floor(Math.random() * 9000000000 + 1000000000)
    setCallerID(randomNum)
  }

  const handleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleSoundToggle = () => {
    setSoundDisabled(!soundDisabled)
  }

  const handleStartCall = () => {
    if (phoneNumber.trim()) {
      setIsInCall(true)
      setCallStartTime(Date.now())
      console.log('Call started')
    }
  }

  const handleEndCall = () => {
    console.log('Call ended')
    // Reset states
    setIsMuted(false)
    setSoundDisabled(false)
    setIsInCall(false)
    setCallStartTime(null)
    setCallDuration(0)
  }

  const numberPadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ]

  return (
    <div className="grid grid-cols-12 grid-rows-2 gap-6 h-full">
      {/* Call Card - Top Left */}
      <div className="col-span-8 card p-4 flex justify-center">
        <div className='flex flex-row w-full gap-4'>
          <div className='w-9/12'>
            {/* Status */}
            <div className="flex items-center gap-3 mb-6">
              <span className="chip">Ready</span>
              {isInCall && (
                <span className="text-white/70 text-sm">
                  Call duration: {formatCallDuration(callDuration)}
                </span>
              )}
            </div>

            {/* Phone Input */}
            <div className="mb-6">
              <label className="text-white/70 text-sm block mb-3">To (phone)</label>
              <div className="flex gap-3 items-center">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +44 20 7946 0958"
                  disabled={isInCall}
                  className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 ${isInCall ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button 
                  onClick={isInCall ? handleEndCall : handleStartCall}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap w-28 h-[50px] ${
                    isInCall 
                      ? 'bg-red-500 hover:bg-red-600 text-white' 
                      : 'bg-white hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  {isInCall ? 'End Call' : 'Call'}
                </button>
              </div>
            </div>

            {/* Caller ID */}
            <div className="mb-6">
              <label className="text-white/70 text-sm block mb-3">Caller ID</label>
              <div className="flex gap-3 items-center">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white">
                  {callerID}
                </div>
                <button
                  onClick={randomizeCallerID}
                  disabled={isInCall}
                  className={`bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-xl text-sm transition-all whitespace-nowrap w-28 h-[50px] ${isInCall ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Randomize
                </button>
              </div>
              <div className="text-gray-400 text-xs mt-2">
                ~0.0025 SOL per minute
              </div>
            </div>

            {/* Call Control Buttons - Only show when in call */}
            {isInCall && (
              <div className="flex gap-3">
                <button
                  onClick={handleMute}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isMuted
                    ? 'bg-red-500/20 border border-red-400/30 text-red-100'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    }`}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>

                <button
                  onClick={handleSoundToggle}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${soundDisabled
                    ? 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-100'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    }`}
                >
                  {soundDisabled ? 'Enable Sound' : 'Disable Sound'}
                </button>
              </div>
            )}

          </div>

          {/* Number Pad */}
          <div className="w-3/12 flex justify-center h-fit my-auto">
            <div className="grid grid-cols-3 gap-4">
              {numberPadButtons.flat().map((btn) => (
                <button
                  key={btn}
                  onClick={() => handleNumberClick(btn)}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg font-medium py-4 px-6 rounded-xl transition-all h-14 flex items-center justify-center"
                >
                  {btn}
                </button>
              ))}
            </div>
          </div>
        </div>

      </div>


      {/* Balance Card - Top Right */}
      <div className="col-span-4">
        <Balance />
      </div>

      {/* Logs Card - Bottom (spans both columns) */}
      <div className="col-span-12 card p-4 h-fit">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg text-white/70">Logs</h3>
          <button className="text-white/60 hover:text-white text-sm transition-all">
            Clear
          </button>
        </div>
        <div className="bg-black/20 rounded-xl p-3 h-48 overflow-y-auto">
          <div className="space-y-1 text-sm font-mono">
            <div className="text-white/60">
              <span className="text-blue-300">[12:34:56]</span> Session initialized
            </div>
            <div className="text-white/60">
              <span className="text-blue-300">[12:34:57]</span> Wallet connected: SOL1TyA68.DuK9
            </div>
            <div className="text-white/60">
              <span className="text-blue-300">[12:34:58]</span> Ready for calls
            </div>
            <div className="text-green-400">
              <span className="text-blue-300">[12:35:12]</span> Balance updated: 0.0000 SOL
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Call