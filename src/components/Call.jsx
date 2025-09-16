import { useState, useEffect } from 'react'
import Balance from './Balance'
import { CallModal } from './CallModal'
import { useCall } from '../contexts/CallProvider'
import { useUser } from '../contexts/UserContext'
import { useLogs } from '../contexts/LogsProvider'
import { useTele } from '../contexts/TeleProvider'
import apiClient from '../lib/axios'

function Call({ onNavigateToInvoices, onNavigateToSupport }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callerID, setCallerID] = useState('+12025550123')
  const [editableCallerID, setEditableCallerID] = useState('+12025550123')
  const [callerIDError, setCallerIDError] = useState(null)
  const [isUpdatingCallerID, setIsUpdatingCallerID] = useState(false)
  const [soundDisabled, setSoundDisabled] = useState(false)
  const [callStartTime, setCallStartTime] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState('ready') // 'ready', 'ringing', 'in-call', 'ended'
  const [isModalVisible, setIsModalVisible] = useState(false)
  // Use LogsProvider for displaying wallet interaction logs
  const { logs, clearLogs } = useLogs()

  // Use TeleProvider for SIP credentials management
  const { credentials } = useTele()

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


  // Sync caller ID with TeleProvider credentials
  useEffect(() => {
    if (credentials && credentials.callerID) {
      setCallerID(credentials.callerID)
      setEditableCallerID(credentials.callerID)
    }
  }, [credentials])

  // Debounced caller ID validation - validate format only, no API calls
  useEffect(() => {
    // Skip validation if editableCallerID hasn't changed or is same as current
    if (!editableCallerID.trim() || editableCallerID === callerID) {
      setCallerIDError(null)
      return
    }

    const validateCallerID = (newCallerID) => {
      setIsUpdatingCallerID(true)
      setCallerIDError(null)

      // Validate format: 7-15 characters, digits only (removing + and spaces)
      const digitsOnly = newCallerID.replace(/[^\d]/g, '')
      if (digitsOnly.length < 7 || digitsOnly.length > 15) {
        setCallerIDError('Caller ID must be 7-15 digits')
      } else {
        // Update local caller ID state for display
        setCallerID(newCallerID)
        console.log('Caller ID validated:', newCallerID)
      }

      setIsUpdatingCallerID(false)
    }

    // Debounce the validation by 2 seconds
    const timeoutId = setTimeout(() => {
      validateCallerID(editableCallerID)
    }, 2000)

    return () => clearTimeout(timeoutId)
  }, [editableCallerID, callerID])

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


  const randomizeCallerID = () => {
    const randomNum = '+1' + Math.floor(Math.random() * 9000000000 + 1000000000)
    setEditableCallerID(randomNum)
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
        // Step 1: Request extension setup
        console.log('📞 Requesting extension setup...')
        const callerIDDigits = editableCallerID.replace(/[^\d]/g, '')
        const extensionResponse = await apiClient.patch('/tele/extension', {
          callerID: callerIDDigits
        })

        if (extensionResponse.status !== 200) {
          throw new Error('Failed to setup extension')
        }

        console.log('📞 Extension setup successful, fetching credentials...')

        // Step 2: Get fresh credentials
        console.log('📞 Fetching fresh credentials...')
        const credentialsResponse = await apiClient.get('/tele/credentials')

        if (credentialsResponse.status !== 200) {
          throw new Error('Failed to get credentials')
        }

        const freshCredentials = credentialsResponse.data

        console.log('📞 Using credentials for call:', {
          extension: freshCredentials.extension,
          domain: freshCredentials.domain,
          wss: freshCredentials.wss,
          callerID: freshCredentials.callerID
        })

        // Step 3: Make call with fresh credentials
        await makeCall(phoneNumber, freshCredentials.callerID || callerID, freshCredentials)
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
    clearLogs()
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
                <input
                  type="text"
                  value={editableCallerID}
                  onChange={(e) => setEditableCallerID(e.target.value)}
                  placeholder="e.g. +1 555 0123"
                  disabled={isInCall || callState.callStatus === 'calling' || callStatus === 'ended'}
                  className={`flex-1 bg-white/5 border ${callerIDError ? 'border-red-400' : 'border-white/10'} rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 min-h-[50px] ${isInCall || callState.callStatus === 'calling' || callStatus === 'ended' ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  onClick={randomizeCallerID}
                  disabled={isInCall || callState.callStatus === 'calling' || callStatus === 'ended'}
                  className={`bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-xl text-sm transition-all whitespace-nowrap sm:w-32 h-[50px] ${isInCall || callState.callStatus === 'calling' || callStatus === 'ended' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  Randomize
                </button>
              </div>
              {/* Status indicators */}
              <div className="text-gray-400 text-xs mt-2">
                {isUpdatingCallerID ? (
                  <span className="text-blue-400">Validating caller ID...</span>
                ) : callerIDError ? (
                  <span className="text-red-400">{callerIDError}</span>
                ) : (
                  <span>Enter your caller ID (7-15 digits)</span>
                )}
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
                  disabled={callStatus === 'ended' || (!isInCall && callState.callStatus !== 'calling' && !phoneNumber.trim())}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap sm:w-32 h-[50px] ${isInCall || callState.callStatus === 'calling'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : callStatus === 'ended' || !phoneNumber.trim()
                      ? 'bg-gray-500 text-gray-300 cursor-not-allowed'
                      : 'bg-slate-500 hover:bg-gray-100 text-gray-900'
                    }`}
                >
                  {isInCall || callState.callStatus === 'calling' ? 'End Call' : 'Call'}
                </button>
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
          <div className="w-3/12 justify-center h-fit my-auto hidden">
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
        <Balance onNavigateToInvoices={onNavigateToInvoices} onNavigateToSupport={onNavigateToSupport} />
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
              logs.map((log) => (
                <div
                  key={log.id}
                  className={
                    log.type === 'success' ? 'text-green-400' :
                      log.type === 'error' ? 'text-red-400' :
                        log.type === 'warning' ? 'text-yellow-400' :
                          'text-white/60'
                  }
                >
                  <span className="text-blue-300">{log.timestamp}</span> {log.message}
                  {log.details && (
                    <div className="ml-4 text-xs text-white/40 mt-1">
                      {typeof log.details === 'object' ? JSON.stringify(log.details) : log.details}
                    </div>
                  )}
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