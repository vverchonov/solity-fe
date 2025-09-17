import { useState, useEffect, useRef } from 'react'
import Balance from './Balance'
import { useCall } from '../contexts/CallProvider'
import { useUser } from '../contexts/UserContext'
import { useLogs } from '../contexts/LogsProvider'
import { useTele } from '../contexts/TeleProvider'
import { useI18n } from '../contexts/I18nProvider'
import apiClient from '../lib/axios'

function Call({ onNavigateToInvoices, onNavigateToSupport, onCallStateChange }) {
  const [phoneNumber, setPhoneNumber] = useState('')
  const [callerID, setCallerID] = useState('+17349303030')
  const [editableCallerID, setEditableCallerID] = useState('+17349303030')
  const [callerIDError, setCallerIDError] = useState(null)
  const [isUpdatingCallerID, setIsUpdatingCallerID] = useState(false)
  const [soundDisabled, setSoundDisabled] = useState(false)
  const [callStartTime, setCallStartTime] = useState(null)
  const [callDuration, setCallDuration] = useState(0)
  const [callStatus, setCallStatus] = useState('ready') // 'ready', 'ringing', 'in-call', 'ended'
  const [rateInfo, setRateInfo] = useState(null)
  const [isCheckingRate, setIsCheckingRate] = useState(false)
  const [rateError, setRateError] = useState(null)
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
  const { t } = useI18n()


  // Derived state from CallProvider
  const isInCall = callState.callStatus === 'in-call'
  const isCallActive = callState.callStatus === 'in-call' || callState.callStatus === 'calling' || callStatus === 'ringing'
  const isMuted = callState.isMuted

  // Sync with CallProvider state changes
  useEffect(() => {
    if (callState.callStatus === 'in-call' && callStatus !== 'in-call') {
      if (!callStartTime) {
        setCallStartTime(Date.now())
      }
      setCallStatus('in-call')
    } else if (callState.callStatus === 'calling' && callStatus !== 'ringing' && callStatus !== 'in-call') {
      // When CallProvider reports 'calling', sync our local status to 'ringing'
      setCallStatus('ringing')
    } else if (callState.callStatus === 'idle' && callStatus !== 'ready' && callStatus !== 'ended') {
      setCallStartTime(null)
      setCallDuration(0)
      if (callStatus === 'in-call' || callStatus === 'ringing') {
        setCallStatus('ended')
        setTimeout(() => setCallStatus('ready'), 5000)
      } else {
        setCallStatus('ready')
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
        setCallerIDError(t('call.callerIDError'))
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

  // Communicate call state changes to parent Dashboard
  useEffect(() => {
    if (onCallStateChange) {
      onCallStateChange({
        phoneNumber: phoneNumber,
        startTime: callStartTime,
        status: callStatus
      })
    }
  }, [phoneNumber, callStartTime, callStatus, onCallStateChange])

  // Reset rate info when phone number actually changes
  const previousPhoneNumberRef = useRef(phoneNumber)
  useEffect(() => {
    if (phoneNumber !== previousPhoneNumberRef.current) {
      setRateInfo(null)
      setRateError(null)
      previousPhoneNumberRef.current = phoneNumber
    }
  }, [phoneNumber])

  const formatCallDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getStatusPill = () => {
    // Use CallProvider status when available, fallback to local status
    const status = isInCall ? 'in-call' : (callState.callStatus === 'calling' ? 'ringing' : callStatus)

    switch (status) {
      case 'preparing':
        return { text: t('status.preparing'), className: 'bg-blue-500/20 border border-blue-400/30 text-blue-100 px-3 py-1 rounded-full text-sm' }
      case 'ringing':
      case 'calling':
        return { text: t('status.ringing'), className: 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-100 px-3 py-1 rounded-full text-sm' }
      case 'in-call':
        return { text: t('status.inCall'), className: 'bg-green-500/20 border border-green-400/30 text-green-100 px-3 py-1 rounded-full text-sm' }
      case 'ended':
        return { text: t('status.callEnded'), className: 'bg-red-500/20 border border-red-400/30 text-red-100 px-3 py-1 rounded-full text-sm' }
      case 'connecting':
        return { text: t('status.connecting'), className: 'bg-blue-500/20 border border-blue-400/30 text-blue-100 px-3 py-1 rounded-full text-sm' }
      default:
        return { text: t('status.idle'), className: 'chip' }
    }
  }

  const handleNumberClick = (num) => {
    setPhoneNumber(prev => prev + num)
  }


  const randomizeCallerID = () => {
    const phoneNumbers = [
      '17349303030', '18009488488', '18775477272', '18007223727', '14198857000',
      '18334800148', '18887706637', '14252149903', '18004235709', '19259693900',
      '18665535554', '16265845880', '14169671010', '14164390000', '15194390000',
      '18663100001', '18557693779', '17804983490', '19058482700'
    ]
    const randomIndex = Math.floor(Math.random() * phoneNumbers.length)
    const randomNum = '+' + phoneNumbers[randomIndex]
    setEditableCallerID(randomNum)
  }


  const handleSoundToggle = () => {
    setSoundDisabled(!soundDisabled)
  }

  const handleCheckRate = async () => {
    if (!phoneNumber.trim()) {
      setRateError(t('call.enterPhoneFirst'))
      return
    }

    setIsCheckingRate(true)
    setRateError(null)
    setRateInfo(null)

    try {
      // Remove all non-numeric characters from phone number
      const numbersOnly = phoneNumber.replace(/[^\d]/g, '')
      const response = await apiClient.get(`/rates/resolve/?number=${encodeURIComponent(numbersOnly)}`)
      console.log('Rate check response:', response.data)
      setRateInfo(response.data)
    } catch (error) {
      console.error('Rate check error:', error)
      setRateError(error.response?.data?.error || t('call.rateCheckFailed'))
    } finally {
      setIsCheckingRate(false)
    }
  }

  const handleStartCall = async () => {
    if (phoneNumber.trim()) {
      setCallStatus('preparing')
      setCallStartTime(Date.now())
      console.log('Starting call...')

      try {
        // Step 1: Request extension setup
        console.log('📞 Requesting extension setup...')
        const callerIDDigits = editableCallerID.replace(/[^\d]/g, '')

        try {
          const extensionResponse = await apiClient.patch('/tele/extension', {
            callerID: callerIDDigits
          })

          if (extensionResponse.status === 200) {
            console.log('📞 Extension setup successful, fetching credentials...')
          }
        } catch (error) {
          // Check if error is "CallerID is the same" - this is OK, continue
          const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || ''
          if (errorMessage.includes('CallerID is the same')) {
            console.log('📞 CallerID already set, continuing to credentials...')
          } else {
            throw new Error(`Failed to setup extension: ${errorMessage}`)
          }
        }

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
        setCallStatus('ringing') // Now actually start ringing
        await makeCall(phoneNumber, freshCredentials.callerID || callerID, freshCredentials)
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
              {isInCall && (
                <span className="text-white/70 text-sm">
                  {t('call.callDuration')}: {formatCallDuration(callDuration)}
                </span>
              )}
            </div>

            {/* Caller ID */}
            <div className="mb-6">
              <label className="text-white/70 text-sm block mb-3">{t('call.callerID')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={editableCallerID}
                  onChange={(e) => setEditableCallerID(e.target.value)}
                  placeholder={t('call.callerIDPlaceholder')}
                  disabled={isInCall || callState.callStatus === 'calling' || callStatus === 'ended'}
                  className={`flex-1 bg-white/5 border ${callerIDError ? 'border-red-400' : 'border-white/10'} rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 min-h-[50px] ${isInCall || callState.callStatus === 'calling' || callStatus === 'ended' ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  onClick={randomizeCallerID}
                  disabled={isInCall || callState.callStatus === 'calling' || callStatus === 'ended'}
                  className={`bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-xl text-sm transition-all whitespace-nowrap sm:w-32 h-[50px] ${isInCall || callState.callStatus === 'calling' || callStatus === 'ended' ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {t('call.randomize')}
                </button>
              </div>
              {/* Status indicators */}
              <div className="text-gray-400 text-xs mt-2">
                {isUpdatingCallerID ? (
                  <span className="text-blue-400">{t('call.validatingCallerID')}</span>
                ) : callerIDError ? (
                  <span className="text-red-400">{callerIDError}</span>
                ) : (
                  <span>{t('call.enterCallerID')}</span>
                )}
              </div>
            </div>

            {/* Phone Input */}
            <div className="mb-6">
              <label className="text-white/70 text-sm block mb-3">{t('call.phoneNumber')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder={t('call.phoneNumberPlaceholder')}
                  disabled={isInCall || callState.callStatus === 'calling' || callStatus === 'preparing'}
                  className={`flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-blue-400 ${isInCall || callState.callStatus === 'calling' || callStatus === 'preparing' ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
                <button
                  onClick={(isInCall || callState.callStatus === 'calling' || callStatus === 'preparing') ? handleEndCall : handleStartCall}
                  disabled={callStatus === 'ended' || (!(isInCall || callState.callStatus === 'calling' || callStatus === 'preparing') && !phoneNumber.trim())}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap sm:w-32 h-[50px] border ${(isInCall || callState.callStatus === 'calling' || callStatus === 'preparing')
                    ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/30 hover:border-red-600/50'
                    : callStatus === 'ended' || !phoneNumber.trim()
                      ? 'bg-gray-600/20 text-gray-500 border-gray-600/30 cursor-not-allowed'
                      : 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-600/30 hover:border-green-600/50'
                    }`}
                >
                  {(isInCall || callState.callStatus === 'calling' || callStatus === 'preparing') ? t('call.endCall') : t('call.startCall')}
                </button>
              </div>

              {/* Check Rate Button */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={handleCheckRate}
                  disabled={isCheckingRate || !phoneNumber.trim() || isInCall || callState.callStatus === 'calling' || callStatus === 'preparing'}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${isCheckingRate || !phoneNumber.trim() || isInCall || callState.callStatus === 'calling' || callStatus === 'preparing'
                    ? 'bg-gray-600/20 text-gray-500 border border-gray-600/30 cursor-not-allowed'
                    : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-600/30 hover:border-blue-600/50'
                    }`}
                >
                  {isCheckingRate ? t('call.checking') : t('call.checkRate')}
                </button>

                {/* Rate Display */}
                <div className="text-white/60 text-xs">
                  {isCheckingRate ? (
                    '...'
                  ) : rateInfo && rateInfo.rates && rateInfo.rates.length > 0 && rateInfo.rates[0].displaycost !== undefined ? (
                    `${rateInfo.rates[0].displaycost} ${rateInfo.rates[0].displaycurrency || 'SOL'}/min`
                  ) : rateError ? (
                    '~'
                  ) : (
                    ''
                  )}
                </div>
              </div>
            </div>

            {/* Call Control Buttons - Only show when in call */}
            {isInCall && (
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleMute}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${isMuted
                    ? 'bg-red-500/20 border border-red-400/30 text-red-100'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    }`}
                >
                  {isMuted ? t('call.unmute') : t('call.mute')}
                </button>

                <button
                  onClick={handleSoundToggle}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${soundDisabled
                    ? 'bg-yellow-500/20 border border-yellow-400/30 text-yellow-100'
                    : 'bg-white/10 hover:bg-white/15 text-white border border-white/10'
                    }`}
                >
                  {soundDisabled ? t('call.enableSound') : t('call.disableSound')}
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
              <h3 className="text-xl font-semibold text-white mb-2">{t('account.accountInactive')}</h3>
              <p className="text-white/70 text-base">
                {t('account.accountInactiveMessage')}
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
          <h3 className="text-lg text-white/70">{t('call.logs')}</h3>
          <button
            onClick={handleClearLogs}
            className="text-white/60 hover:text-white text-sm transition-all"
          >
            {t('call.clear')}
          </button>
        </div>
        <div className="bg-black/20 rounded-xl p-3 h-48 overflow-y-auto">
          <div className="space-y-1 text-sm font-mono">
            {logs.length === 0 ? (
              <div className="text-white/40 text-center py-8">
                {t('call.noLogs')}
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

    </div>
  )
}

export default Call
