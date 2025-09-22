import { useState, useEffect, useRef, useMemo } from 'react'
import Balance from './Balance'
import { useCall } from '../contexts/CallProvider'
import { useUser } from '../contexts/UserContext'
import { useBalance } from '../contexts/BalanceProvider'
import { useLogs } from '../contexts/LogsProvider'
import { useTele } from '../contexts/TeleProvider'
import { useI18n } from '../contexts/I18nProvider'
import apiClient from '../lib/axios'
import { apiDebouncer } from '../utils/debounce'
import { PHONE_REGEX, getRandomCallerID } from '../constants/callerIds'
import sipService from '../services/sip'

function Call({ onNavigateToInvoices, onNavigateToSupport, onCallStateChange, onShowModal, isModalVisible, soundDisabled, onSoundToggle, callDuration, phoneNumber, onPhoneNumberChange }) {
  // Get initial random caller ID
  const initialCallerID = getRandomCallerID()

  const [phoneNumberError, setPhoneNumberError] = useState(null)
  const [callerID, setCallerID] = useState(initialCallerID)
  const [editableCallerID, setEditableCallerID] = useState(initialCallerID)
  const [callerIDError, setCallerIDError] = useState(null)
  const [isUpdatingCallerID, setIsUpdatingCallerID] = useState(false)
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
    callConfig,
    setCallConfig
  } = useCall()

  // Use UserProvider
  const { user, isUserInactive } = useUser()

  // Use BalanceProvider to check internal balance
  const { balance } = useBalance()

  const { t } = useI18n()

  // Validation function for international phone numbers
  const validatePhoneNumber = (phoneStr, setError) => {
    // Extract only digits
    const digitsOnly = phoneStr.replace(/[^\d]/g, '')

    // Check minimum length (at least 7 digits for shortest international numbers)
    if (digitsOnly.length < 7) {
      setError('Phone number must be at least 7 digits long')
      return false
    }

    // Check maximum length (15 digits is ITU-T E.164 standard)
    if (digitsOnly.length > 15) {
      setError('Phone number cannot exceed 15 digits')
      return false
    }

    // const countryCheck = (callerID) => {
    //   // Should be in E.164 format for supported countries
    //   const usCanadaRegex = /^\+1[2-9]\d{9}$/
    //   const germanyRegex = /^\+49[1-9]\d{9,11}$/
    //   const ukraineRegex = /^\+380[1-9]\d{8}$/
    //   const italyRegex = /^\+39[1-9]\d{9,11}$/
    //   const spainRegex = /^\+34[1-9]\d{9,11}$/
    //   const portugalRegex = /^\+351[1-9]\d{9,11}$/

    //   return usCanadaRegex.test(callerID) || germanyRegex.test(callerID) || ukraineRegex.test(callerID) || italyRegex.test(callerID) || spainRegex.test(callerID) || portugalRegex.test(callerID)
    // };

    // Use country validation from sip service
    // Format the phone number with + prefix for validation
    // const formattedPhone = '+' + digitsOnly
    // if (!countryCheck(formattedPhone)) {
    //   setError('Phone number format not supported for this country')
    //   return false
    // }

    setError(null)
    return true
  }

  // Helper function to check if phone number is valid
  const isValidPhoneNumber = (phoneStr) => {
    const digitsOnly = phoneStr.replace(/[^\d]/g, '')
    return digitsOnly.length >= 7 && digitsOnly.length <= 15
  }

  // Derived state from CallProvider
  const isInCall = callState.callStatus === 'in-call'
  const isCallActive = useMemo(() => {
    const activeStates = ['in-call', 'calling', 'ringing', 'preparing', 'creating-call', 'pending']
    return activeStates.includes(callState.callStatus) || activeStates.includes(callStatus)
  }, [callState.callStatus, callStatus])
  const isMuted = callState.isMuted

  // Check if internal balance is insufficient for calls (less than 0.01 SOL)
  const hasInsufficientInternalBalance = useMemo(() => {
    return balance && balance.solBalance < 0.01
  }, [balance])

  // Sync with CallProvider state changes
  useEffect(() => {
    // Don't interfere during call initialization states
    if (callStatus === 'creating-call' || callStatus === 'pending') {
      return
    }

    if (callState.callStatus === 'in-call' && callStatus !== 'in-call') {
      setCallStatus('in-call')
    } else if (callState.callStatus === 'calling' && callStatus !== 'ringing' && callStatus !== 'in-call') {
      // When CallProvider reports 'calling', sync our local status to 'ringing'
      setCallStatus('ringing')
    } else if (callState.callStatus === 'idle' && callStatus !== 'ready' && callStatus !== 'ended') {
      if (callStatus === 'in-call' || callStatus === 'ringing') {
        setCallStatus('ended')
        setTimeout(() => setCallStatus('ready'), 5000)
      } else {
        setCallStatus('ready')
      }
    }
  }, [callState.callStatus, callStatus])


  // Sync caller ID with TeleProvider credentials only on initial load
  // Don't override user's manually selected caller ID
  const hasInitializedCallerID = useRef(false)
  useEffect(() => {
    if (credentials && credentials.callerID && !hasInitializedCallerID.current) {
      setCallerID(credentials.callerID)
      setEditableCallerID(credentials.callerID)
      hasInitializedCallerID.current = true
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

      const isValid = validatePhoneNumber(newCallerID, setCallerIDError)
      if (isValid) {
        // Update local caller ID state for display
        setCallerID(newCallerID)
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
        status: callStatus
      })
    }
  }, [callStatus, onCallStateChange])

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
    const newPhoneNumber = phoneNumber + num
    onPhoneNumberChange(newPhoneNumber)
    validatePhoneNumber(newPhoneNumber, setPhoneNumberError)
  }


  const randomizeCallerID = () => {
    setEditableCallerID(getRandomCallerID())
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
      const response = await apiDebouncer.debounce(`resolveRate-${numbersOnly}`, async () => {
        return await apiClient.get(`/rates/resolve/?number=${encodeURIComponent(numbersOnly)}`)
      })
      setRateInfo(response.data)
    } catch (error) {
      setRateError(error.response?.data?.error || t('call.rateCheckFailed'))
    } finally {
      setIsCheckingRate(false)
    }
  }

  const handleStartCall = async () => {
    // Capture current phone number value to ensure we use the latest
    const currentPhoneNumber = phoneNumber.trim()

    if (currentPhoneNumber) {
      // Ensure the phone number state is up to date for the modal
      if (phoneNumber !== currentPhoneNumber) {
        onPhoneNumberChange(currentPhoneNumber)
      }

      // Set status to show "creating call" during API requests
      setCallStatus('creating-call')

      // Immediately notify parent with call status
      if (onCallStateChange) {
        onCallStateChange({
          status: 'creating-call'
        })
      }

      try {
        // Step 1: Request extension setup
        const callerIDDigits = editableCallerID.replace(/[^\d]/g, '')

        try {
          const extensionResponse = await apiClient.patch('/tele/extension', {
            callerID: callerIDDigits
          })

          if (extensionResponse.status === 200) {
          }
        } catch (error) {
          // Check if error is "CallerID is the same" - this is OK, continue
          const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || ''
          if (errorMessage.includes('CallerID is the same')) {
          } else {
            throw new Error(`Failed to setup extension: ${errorMessage}`)
          }
        }

        // Step 2: Get fresh credentials
        const credentialsResponse = await apiClient.get('/tele/credentials')
        console.log('here');

        if (credentialsResponse.status !== 200) {
          throw new Error('Failed to get credentials')
        }

        const freshCredentials = credentialsResponse.data

        // All API requests successful, now show pending status
        setCallStatus('pending') // Change to pending when API requests are done

        // Step 3: Make call with fresh credentials
        await makeCall(currentPhoneNumber, freshCredentials.callerID || callerID, freshCredentials)

        // After makeCall is initiated, set to ringing
        setCallStatus('ringing')
      } catch (error) {
        setCallStatus('ready')
      }
    }
  }

  const handleEndCall = async () => {
    try {
      await hangupCall()

      // Show "Call Ended" status
      setCallStatus('ended')

      // Return to "Ready" after 5 seconds
      setTimeout(() => {
        setCallStatus('ready')
      }, 5000)
    } catch (error) {
    }
  }

  const handleDTMF = (digit) => {
    sendDTMF(digit)
  }

  const handleMute = async () => {
    try {
      await toggleMute()
    } catch (error) {
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
              <div className="flex items-center gap-2">
                <span className={`${getStatusPill().className} self-start`}>{getStatusPill().text}</span>
                {isCallActive && !isModalVisible && (
                  <button
                    onClick={onShowModal}
                    className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/40 border border-blue-400/30 hover:border-blue-400/60 text-blue-300 hover:text-blue-200 rounded-full text-xs font-medium transition-all duration-200 flex items-center gap-1"
                    title={t('call.showCallModal')}
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    {t('call.showCallModal')}
                  </button>
                )}
              </div>
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
                <div className={`flex-1 relative bg-white/5 border ${callerIDError ? 'border-red-400' : 'border-white/10'} rounded-xl overflow-hidden ${isCallActive || callStatus === 'ended' ? 'opacity-50' : ''}`}>
                  <div className="absolute left-0 top-0 h-full flex items-center justify-center w-8 text-white/60 pointer-events-none">
                    +
                  </div>
                  <input
                    type="text"
                    value={editableCallerID}
                    onChange={(e) => {
                      // Remove all non-numeric characters
                      const sanitized = e.target.value.replace(/[^\d]/g, '')
                      setEditableCallerID(sanitized)
                    }}
                    placeholder={t('call.callerIDPlaceholder')}
                    disabled={isCallActive || callStatus === 'ended'}
                    className={`w-full bg-transparent border-none pl-8 pr-4 py-3 text-white placeholder-white/40 focus:outline-none min-h-[50px] ${isCallActive || callStatus === 'ended' ? 'cursor-not-allowed' : ''}`}
                  />
                </div>
                <button
                  onClick={randomizeCallerID}
                  disabled={isCallActive || callStatus === 'ended'}
                  className={`bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-xl text-sm transition-all whitespace-nowrap sm:w-32 h-[50px] ${isCallActive || callStatus === 'ended' ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                <div className={`flex-1 relative bg-white/5 border ${phoneNumberError ? 'border-red-400' : 'border-white/10'} rounded-xl overflow-hidden ${isCallActive ? 'opacity-50' : ''}`}>
                  <div className="absolute left-0 top-0 h-full flex items-center justify-center w-8 text-white/60 pointer-events-none">
                    +
                  </div>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => {
                      // Remove all non-numeric characters
                      const sanitized = e.target.value.replace(/[^\d]/g, '')
                      onPhoneNumberChange(sanitized)
                      validatePhoneNumber(sanitized, setPhoneNumberError)
                    }}
                    placeholder={t('call.phoneNumberPlaceholder')}
                    disabled={isCallActive}
                    className={`w-full bg-transparent border-none pl-8 pr-4 py-3 text-white placeholder-white/40 focus:outline-none ${isCallActive ? 'cursor-not-allowed' : ''}`}
                  />
                </div>
                <button
                  onClick={isCallActive ? handleEndCall : handleStartCall}
                  disabled={callStatus === 'ended' || (!isCallActive && (!phoneNumber.trim() || phoneNumberError || callerIDError || !isValidPhoneNumber(phoneNumber) || !isValidPhoneNumber(editableCallerID) || hasInsufficientInternalBalance))}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap sm:w-32 h-[50px] border ${isCallActive
                    ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/30 hover:border-red-600/50'
                    : callStatus === 'ended' || !phoneNumber.trim() || phoneNumberError || callerIDError || !isValidPhoneNumber(phoneNumber) || !isValidPhoneNumber(editableCallerID) || hasInsufficientInternalBalance
                      ? 'bg-gray-600/20 text-gray-500 border-gray-600/30 cursor-not-allowed'
                      : 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-600/30 hover:border-green-600/50'
                    }`}
                  title={hasInsufficientInternalBalance && !isCallActive ? t('call.insufficientBalance') || 'Insufficient balance for calls' : ''}
                >
                  {isCallActive ? t('call.endCall') : hasInsufficientInternalBalance ? (t('call.insufficientBalance') || 'Insufficient Balance') : t('call.startCall')}
                </button>
              </div>

              {/* Phone number error display */}
              {phoneNumberError && (
                <div className="mt-2">
                  <span className="text-red-400 text-xs">{phoneNumberError}</span>
                </div>
              )}

              {/* Check Rate Button */}
              <div className="mt-3 flex items-center gap-3">
                <button
                  onClick={handleCheckRate}
                  disabled={isCheckingRate || !phoneNumber.trim() || isCallActive}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${isCheckingRate || !phoneNumber.trim() || isCallActive
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
                    `${rateInfo.rates[0].displaycost} ${rateInfo.rates[0].displaycurrency || 'SOL'}/min | ${rateInfo.rates[0].direction}`
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
                  onClick={onSoundToggle}
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
                  onClick={() => isInCall ? handleDTMF(btn) : handleNumberClick(btn)}
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
              logs.slice().reverse().map((log) => (
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
