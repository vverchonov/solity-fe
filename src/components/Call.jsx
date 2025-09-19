import { useState, useEffect, useRef, useMemo } from 'react'
import Balance from './Balance'
import { useCall } from '../contexts/CallProvider'
import { useUser } from '../contexts/UserContext'
import { useLogs } from '../contexts/LogsProvider'
import { useTele } from '../contexts/TeleProvider'
import { useI18n } from '../contexts/I18nProvider'
import apiClient from '../lib/axios'

// Phone validation constants for US/Canada
const PHONE_REGEX = /^1?\d{10}$/

// Available caller ID numbers
const CALLER_ID_NUMBERS = [
  '17349303030', '18009488488', '18775477272', '18007223727', '14198857000',
  '18334800148', '18887706637', '14252149903', '18004235709', '19259693900',
  '18665535554', '16265845880', '14169671010', '14164390000', '15194390000',
  '18663100001', '18557693779', '17804983490', '19058482700', '13857078616',
  '18007861000', '14793589274', '18012538600', '18667917626', '17024444800',
  '17027977777', '17252672262', '17026433060', '18888997770', '18185760003',
  '18187132707', '18189001017', '18187895937', '18008648377', '18188458586',
  '18182438999', '13237212100', '17142369300', '17145400404', '19494283900',
  '19498595611', '16192323861', '16194276701', '16192056140', '17603519800',
  '17603440961', '17603441579', '16022545154', '16022629916', '16023148470',
  '16022186001', '16022221111', '16024621563', '16024378400', '14808219447',
  '16023055500', '18559552534', '14802487002', '14809870888', '14804046469',
  '14808306900', '14808324996', '16029556600', '15053445911', '15053410831',
  '15058809800', '15058844928', '15055809693', '15055083091', '15053232594',
  '15052937272', '15052964871', '15057960311', '14696428868', '12142909090',
  '12142998982', '14693990081', '19728033903', '12144281555', '12142109098',
  '12149464711', '14699312280', '19729264180', '14694389223', '19722405017',
  '19722260725', '14698928883', '14693674200', '19724757511', '12148708201',
  '14698140185', '19725092700', '19724232303', '14694093123', '19728464255',
  '12143879500', '14692155740', '14043903009', '14047481912', '14049074452',
  '14707888255', '19172317217', '16154658300', '16156498009', '16153407500',
  '16156695440', '16158802001', '16152286794', '16158893032', '16158060187',
  '19315285988', '19315264231', '19315264660', '19315201225', '19315263344',
  '19318541378', '19314000044', '15029013831', '15027748555', '15027763713',
  '15026372424', '15029617600', '15027351215', '15024588888', '15029386262',
  '15025093033', '15022429311', '15022405555', '15022530085', '15022445800',
  '15022419996', '15132877000', '15137212787', '15136843262', '12123661182',
  '12123889474', '12122670860', '16465594878', '17183882216', '17862301441',
  '13058516773', '17342135625', '18572264942', '13239904301', '17738321300',
  '13052003190', '17867031451', '13056312265', '17542004857', '18778390526',
  '13033332453', '13036982811', '18588808778', '18588680925', '12029370001',
  '16172270765', '16172616600', '16177421713', '13463955233', '16147988802',
  '16144421888', '16147714800', '16143083333', '16148781200', '16142211600',
  '16143177798', '16148019130', '16149491078', '16148014300', '16142573000',
  '16142992180', '16142942545', '16142474000', '16142620988', '16144789999',
  '16148554900', '13307853724', '12347889135', '13306597118', '13307625877',
  '13309269774', '12343340124', '13309238232', '13306722640', '12169612560',
  '12163310338', '12168626427', '12166514007', '14405035506', '12162218127',
  '12165213280', '12162268828', '12165210301', '12162265200', '14408657773',
  '18006911699', '12165211155', '12163073205', '16172669210', '17812704212',
  '17813061222', '12129417994', '12129664100', '15623432300', '17734862280',
  '13122198510', '13037331616', '15128925550', '15122916056', '13252685906',
  '12063293008', '12064201548', '12064574274', '13124963792', '15122800900',
  '18326783010', '18326783105', '17137835780', '12817526044', '18326783104',
  '18325361155', '13853139766', '15208886858', '15208869573', '17732816688',
  '15124513708', '15123265533', '16172651272', '15128363344', '16172446997',
  '15125519334', '16176573603', '15123877642', '14254675575', '17733488058',
  '13129209332', '17735165833', '15124730222', '15124773472', '13057042126',
  '13056828889', '13034431822', '12124731452', '15032284651', '19549687747',
  '17039998701', '17186449536', '15048617454', '17708885500', '15403420222',
  '12625056279', '17817722017'
]

// Helper function to get a random caller ID
const getRandomCallerID = () => {
  const randomIndex = Math.floor(Math.random() * CALLER_ID_NUMBERS.length)
  return CALLER_ID_NUMBERS[randomIndex]
}

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
  const { t } = useI18n()

  // Validation function for phone numbers using schema validation
  const validatePhoneNumber = (phoneStr, setError) => {
    // Extract only digits
    const digitsOnly = phoneStr.replace(/[^\d]/g, '')

    // Check if number starts with 1 (US/Canada only)
    if (digitsOnly.length > 0 && !digitsOnly.startsWith('1')) {
      setError('Phone number must start with 1 (US/Canada only)')
      return false
    }

    // Check length (10-11 digits for US/Canada: 1 + 10 digits or 10 digits)
    if (digitsOnly.length < 10 || digitsOnly.length > 11) {
      setError('Phone number must be 10-11 digits long')
      return false
    }

    // For 10-digit numbers, ensure they're valid US format (area code can't start with 0 or 1)
    if (digitsOnly.length === 10) {
      const areaCode = digitsOnly.substring(0, 3)
      if (areaCode.startsWith('0') || areaCode.startsWith('1')) {
        setError('Invalid area code (cannot start with 0 or 1)')
        return false
      }
    }

    // For 11-digit numbers, ensure they start with 1 and have valid area code
    if (digitsOnly.length === 11) {
      if (!digitsOnly.startsWith('1')) {
        setError('11-digit numbers must start with 1')
        return false
      }
      const areaCode = digitsOnly.substring(1, 4)
      if (areaCode.startsWith('0') || areaCode.startsWith('1')) {
        setError('Invalid area code (cannot start with 0 or 1)')
        return false
      }
    }

    setError(null)
    return true
  }

  // Helper function to check if a number starts with 1
  const startsWithOne = (phoneStr) => {
    const digitsOnly = phoneStr.replace(/[^\d]/g, '')
    return digitsOnly.length > 0 && digitsOnly.startsWith('1')
  }

  // Derived state from CallProvider
  const isInCall = callState.callStatus === 'in-call'
  const isCallActive = useMemo(() => {
    const activeStates = ['in-call', 'calling', 'ringing', 'preparing', 'creating-call', 'pending']
    return activeStates.includes(callState.callStatus) || activeStates.includes(callStatus)
  }, [callState.callStatus, callStatus])
  const isMuted = callState.isMuted

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
      const response = await apiClient.get(`/rates/resolve/?number=${encodeURIComponent(numbersOnly)}`)
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
                  disabled={callStatus === 'ended' || (!isCallActive && (!phoneNumber.trim() || phoneNumberError || callerIDError || !startsWithOne(phoneNumber) || !startsWithOne(editableCallerID)))}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap sm:w-32 h-[50px] border ${isCallActive
                    ? 'bg-red-600/20 hover:bg-red-600/30 text-red-400 border-red-600/30 hover:border-red-600/50'
                    : callStatus === 'ended' || !phoneNumber.trim() || phoneNumberError || callerIDError || !startsWithOne(phoneNumber) || !startsWithOne(editableCallerID)
                      ? 'bg-gray-600/20 text-gray-500 border-gray-600/30 cursor-not-allowed'
                      : 'bg-green-600/20 hover:bg-green-600/30 text-green-400 border-green-600/30 hover:border-green-600/50'
                    }`}
                >
                  {isCallActive ? t('call.endCall') : t('call.startCall')}
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
