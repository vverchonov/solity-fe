import { useState } from 'react'
import Balance from './Balance'

function Call() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callerID, setCallerID] = useState('+12025550123')

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

  const numberPadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ]

  return (
    <div className="grid grid-cols-12 grid-rows-2 gap-6 h-full">
      {/* Call Card - Top Left */}
      <div className="col-span-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 flex items-center justify-center">
        <div className='flex flex-row w-full gap-4'>
          <div className='w-8/12'>
            {/* Status */}
            <div className="flex items-center gap-4 mb-6">
              <div className="bg-white/10 px-4 py-2 rounded-full">
                <span className="text-white/70 text-sm">Ready</span>
              </div>
              <span className="text-white/60 text-sm">0.0000 SOL</span>
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
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400"
                />
                <button className="bg-white hover:bg-gray-100 text-gray-900 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap">
                  Call
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
                  className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-lg text-sm transition-all whitespace-nowrap"
                >
                  Randomize
                </button>
              </div>
            </div>

          </div>

          {/* Number Pad */}
          <div className="w-4/12 flex justify-center">
            <div className="grid grid-cols-3 gap-2 mb-4">
            {numberPadButtons.flat().map((btn) => (
              <button
                key={btn}
                onClick={() => handleNumberClick(btn)}
                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white text-lg font-medium py-3 px-4 rounded-lg transition-all w-12 h-12 flex items-center justify-center"
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
      <div className="col-span-12 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg text-white/70">Logs</h3>
          <button className="text-white/60 hover:text-white text-sm transition-all">
            Clear
          </button>
        </div>
        <div className="bg-black/20 rounded-lg p-4 h-32 overflow-y-auto">
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