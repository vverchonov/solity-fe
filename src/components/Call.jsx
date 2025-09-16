import { useState, useEffect } from 'react'
import Balance from './Balance'
import { CallModal } from './CallModal'
import { useCall } from '../contexts/CallProvider'
import { useUser } from '../contexts/UserContext'
import { useRates } from '../contexts/RatesProvider'
import { ratesAPI } from '../services/rates'

function Call() {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callerID, setCallerID] = useState('+12025550123')
  const [soundDisabled, setSoundDisabled] = useState(false)
  const [callStartTime, setCallStartTime] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState('ready') // 'ready', 'ringing', 'in-call', 'ended'
  const [isModalVisible, setIsModalVisible] = useState(false)
  const [currentRate, setCurrentRate] = useState(null)
  const [isResolvingRate, setIsResolvingRate] = useState(false)
  const [rateError, setRateError] = useState(null)
  const [logs, setLogs] = useState([
    { timestamp: '[12:34:56]', message: 'Session initialized', type: 'info' },
    { timestamp: '[12:35:12]', message: 'Balance updated: 0.0000 SOL', type: 'success' }
  ])

  // Use CallProvider
  const {
    callState,
    makeCall,
    hangupCall,
    toggleMute,
    sendDTMF,
    connectToServer,
    callConfig,
    setCallConfig
  } = useCall()

  // Use UserProvider
  const { user, isUserInactive } = useUser()
  
  // Use RatesProvider
  const { rates, getRateByCode } = useRates()

  // Derived state from CallProvider
  const isInCall = callState.callStatus === 'in-call'
  const isMuted = callState.isMuted

  // Sync with CallProvider state changes
  useEffect(() => {
    if (callState.callStatus === 'in-call' && !callStartTime) {
      setCallStartTime(Date.now())
      setIsModalVisible(true)
      setCallStatus('in-call')
    } else if (callState.callStatus === 'idle') {
      setCallStartTime(null)
      setCallDuration(0)
      setIsModalVisible(false)
      if (callStatus === 'in-call') {
        setCallStatus('ended')
        setTimeout(() => setCallStatus('ready'), 5000)
      }
    }
  }, [callState.callStatus, callStartTime, callStatus])

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

  // Debounced rate resolution - resolve rate 2 seconds after user stops typing
  useEffect(() => {
    if (!phoneNumber.trim()) {
      setCurrentRate(null)
      setRateError(null)
      return
    }

    const resolveRate = async (phone) => {
      try {
        setIsResolvingRate(true)
        setRateError(null)
        
        const result = await ratesAPI.resolveRate(phone)
        console.log('Rate resolve result:', result)
        if (result.success && result.data.id !== undefined) {
          // Find the rate details using the ID from rates provider
          const rateDetails = rates.find(rate => rate.id === result.data.id)
          if (rateDetails) {
            setCurrentRate(rateDetails)
          } else {
            setRateError('Rate not found')
            setCurrentRate(null)
          }
        } else {
          setRateError(result.error || 'Could not resolve rate')
          setCurrentRate(null)
        }
      } catch (error) {
        console.error('Error resolving rate:', error)
        setRateError('Rate resolution failed')
        setCurrentRate(null)
      } finally {
        setIsResolvingRate(false)
      }
    }

    // Debounce the rate resolution by 2 seconds
    const timeoutId = setTimeout(() => {
      resolveRate(phoneNumber)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [phoneNumber, getRateByCode])

  const formatCallDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStatusPill = () => {
    // Use CallProvider status when available, fallback to local status
    const status = isInCall ? 'in-call' : (callState.callStatus === 'calling' ? 'ringing' : callStatus)

    switch (status) {
      case 'ringing':
      case 'calling':
        return { text: 'Ringing...', className: 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-100 px-3 py-1 rounded-full text-sm' }
      case 'in-call':
        return { text: 'In Call', className: 'bg-green-500/20 border border-green-400/30 text-green-100 px-3 py-1 rounded-full text-sm' }
      case 'ended':
        return { text: 'Call Ended', className: 'bg-red-500/20 border border-red-400/30 text-red-100 px-3 py-1 rounded-full text-sm' }
      case 'connecting':
        return { text: 'Connecting...', className: 'bg-blue-500/20 border border-blue-400/30 text-blue-100 px-3 py-1 rounded-full text-sm' }
      default:
        return { text: callState.isRegistered ? 'Ready' : 'Connecting...', className: 'chip' }
    }
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


  const handleSoundToggle = () => {
    setSoundDisabled(!soundDisabled)
  }

  const handleStartCall = async () => {
    if (phoneNumber.trim()) {
      setCallStatus('ringing')
      setCallStartTime(Date.now())
      console.log('Starting call...')

      try {
        await makeCall(phoneNumber, callerID)
        setIsModalVisible(true)
        console.log('Call initiated')
      } catch (error) {
        setCallStatus('ready')
        console.error('Call failed:', error)
      }
    }
  }

  const handleEndCall = async () => {
    console.log('Call ended')

    try {
      await hangupCall()

      // Show "Call Ended" status
      setCallStatus('ended')
      setCallStartTime(null)
      setCallDuration(0)
      setSoundDisabled(false)
      setIsModalVisible(false)

      // Return to "Ready" after 5 seconds
      setTimeout(() => {
        setCallStatus('ready')
      }, 5000)
    } catch (error) {
      console.error('Error ending call:', error)
    }
  }

  const handleDTMF = (digit) => {
    console.log('DTMF digit pressed:', digit)
    sendDTMF(digit)
  }

  const handleMute = async () => {
    try {
      await toggleMute()
    } catch (error) {
      console.error('Error toggling mute:', error)
    }
  }

  const handleMinimizeModal = () => {
    setIsModalVisible(false)
  }

  const handleShowModal = () => {
    setIsModalVisible(true)
  }

  const handleClearLogs = () => {
    setLogs([])
  }

  const numberPadButtons = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['*', '0', '#']
  ]

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-2 gap-6 h-full">
      {/* Call Card - Top (or full width on mobile) */}
      <div className={`lg:col-span-8 card p-4 flex justify-center relative ${isUserInactive() ? 'overflow-hidden' : ''}`}>
        {/* Always show the call interface */}
        <div className={`flex flex-row w-full gap-4 ${isUserInactive() ? 'blur-sm pointer-events-none' : ''}`}>
          <div className='w-full'>
            {/* Status */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <span className={getStatusPill().className}>{getStatusPill().text}</span>
              {isInCall && !isModalVisible && (
                <button
                  onClick={handleShowModal}
                  className="bg-green-500/20 border border-green-400/30 text-green-100 px-3 py-1 rounded-full text-sm hover:bg-green-500/30 hover:scale-105 transition-all cursor-pointer flex items-center gap-2 w-fit"
                >
                  <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span className="hidden sm:inline">{formatCallDuration(callDuration)} • Click to expand</span>
                  <span className="sm:hidden">{formatCallDuration(callDuration)}</span>
                </button>
              )}
              {isInCall && isModalVisible && (
                <span className="text-white/70 text-sm">
                  Call duration: {formatCallDuration(callDuration)}
                </span>
              )}
            </div>

            {/* Caller ID */}
            <div className="mb-6">
              <label className="text-white/70 text-sm block mb-3">Caller ID</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white min-h-[50px] flex items-center">
                  {callerID}
                </div>
                <button
                  onClick={randomizeCallerID}
                  disabled={isInCall || callState.callStatus === 'calling' || callStatus === 'ended'}
                  className={`bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-xl text-sm transition-all whitespace-nowrap sm:w-32 h-[50px] ${isInCall || callState.callStatus === 'calling' || callStatus === 'ended' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Randomize
                </button>
              </div>
            </div>

            {/* Phone Input */}
            <div className="mb-6">
              <label className="text-white/70 text-sm block mb-3">To (phone)</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. +44 20 7946 0958"
                  disabled={isInCall || callState.callStatus === 'calling'}
                  className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 ${isInCall || callState.callStatus === 'calling' ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  onClick={isInCall || callState.callStatus === 'calling' ? handleEndCall : handleStartCall}
                  disabled={callStatus === 'ended' || (!isInCall && callState.callStatus !== 'calling' && phoneNumber.trim() && (!currentRate || isResolvingRate))}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap sm:w-32 h-[50px] ${isInCall || callState.callStatus === 'calling'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : callStatus === 'ended' || (!currentRate && phoneNumber.trim() && !isResolvingRate)
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-100 text-gray-900'
                    }`}
                >
                  {isInCall || callState.callStatus === 'calling' ? 'End Call' : 'Call'}
                </button>
              </div>
              <div className="text-gray-400 text-xs mt-2">
                {isResolvingRate ? (
                  <span className="text-blue-400">Resolving rate...</span>
                ) : currentRate ? (
                  <span>
                    {currentRate.displaycost > 0 ? (
                      `${currentRate.displaycurrency}${currentRate.displaycost} per minute`
                    ) : (
                      'Rate not available'
                    )}
                    {currentRate.routename && (
                      <span className="ml-2 text-white/40">via {currentRate.routename}</span>
                    )}
                  </span>
                ) : phoneNumber.trim() ? (
                  <span className="text-red-400">
                    {rateError || 'Enter valid phone number'}
                  </span>
                ) : (
                  <span>Enter phone number to see rate</span>
                )}
              </div>
            </div>

            {/* Call Control Buttons - Only show when in call and modal is not visible */}
            {isInCall && !isModalVisible && (
              <div className="flex flex-col sm:flex-row gap-3">
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

          {/* Number Pad - Hidden on mobile, available on larger screens */}
          <div className="w-3/12 justify-center h-fit my-auto hidden lg:flex">
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

        {/* Inactive User Overlay */}
        {isUserInactive() && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-none z-10">
            <div className="text-center px-4">
              <h3 className="text-xl font-semibold text-white mb-2">Account Inactive</h3>
              <p className="text-white/70 text-base">
                Please top up your balance to activate your account and start making calls.
              </p>
            </div>
          </div>
        )}

      </div>

      {/* Balance Card - Below Call Card on mobile/tablet, Right side on desktop */}
      <div className="lg:col-span-4">
        <Balance />
      </div>

      {/* Logs Card - Bottom (spans full width) */}
      <div className="lg:col-span-12 card p-4 h-fit">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg text-white/70">Logs</h3>
          <button
            onClick={handleClearLogs}
            className="text-white/60 hover:text-white text-sm transition-all"
          >
            Clear
          </button>
        </div>
        <div className="bg-black/20 rounded-xl p-3 h-48 overflow-y-auto">
          <div className="space-y-1 text-sm font-mono">
            {logs.length === 0 ? (
              <div className="text-white/40 text-center py-8">
                No logs to display
              </div>
            ) : (
              logs.map((log, index) => (
                <div
                  key={index}
                  className={log.type === 'success' ? 'text-green-400' : 'text-white/60'}
                >
                  <span className="text-blue-300">{log.timestamp}</span> {log.message}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Call Modal */}
      <CallModal
        isVisible={isInCall && isModalVisible}
        phoneNumber={phoneNumber}
        callDuration={callDuration}
        isMuted={isMuted}
        soundDisabled={soundDisabled}
        onEndCall={handleEndCall}
        onMute={handleMute}
        onSoundToggle={handleSoundToggle}
        onDTMF={handleDTMF}
        onMinimize={handleMinimizeModal}
      />
    </div>
  )
}

export default Call