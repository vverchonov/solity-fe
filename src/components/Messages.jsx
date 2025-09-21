import { useState, useMemo } from 'react'
import Balance from './Balance'
import { useUser } from '../contexts/UserContext'
import { useBalance } from '../contexts/BalanceProvider'
import { useLogs } from '../contexts/LogsProvider'
import { useI18n } from '../contexts/I18nProvider'
import apiClient from '../lib/axios'

// Phone validation constants for international numbers
const PHONE_REGEX = /^\d{7,15}$/

// Available caller ID numbers (same as Call component)
const CALLER_ID_NUMBERS = [
  '17349303030', '18009488488', '18775477272', '18007223727', '14198857000',
  '18334800148', '18887706637', '14252149903', '18004235709', '19259693900',
  '18665535554', '16265845880', '14169671010', '14164390000', '15194390000',
  '18663100001', '18557693779', '17804983490', '19058482700', '13857078616',
  '18007861000', '14793589274', '18012538600', '18667917626', '17024444800'
]

// Helper function to get a random caller ID
const getRandomCallerID = () => {
  const randomIndex = Math.floor(Math.random() * CALLER_ID_NUMBERS.length)
  return CALLER_ID_NUMBERS[randomIndex]
}

function Messages({ onNavigateToInvoices, onNavigateToSupport }) {
  // Get initial random caller ID
  const initialCallerID = getRandomCallerID()

  const [callerID, setCallerID] = useState(initialCallerID)
  const [callerIDError, setCallerIDError] = useState(null)
  const [toNumber, setToNumber] = useState('')
  const [toNumberError, setToNumberError] = useState(null)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(null)
  const [isSending, setIsSending] = useState(false)
  const [sendSuccess, setSendSuccess] = useState(false)
  const [sendError, setSendError] = useState(null)

  // Use LogsProvider for displaying logs
  const { logs, clearLogs, addLog } = useLogs()

  // Use UserProvider
  const { isUserInactive } = useUser()

  // Use BalanceProvider to check internal balance
  const { balance } = useBalance()

  const { t } = useI18n()

  // Constants for message limits
  const MAX_MESSAGE_LENGTH = 160 // Standard SMS length

  // Validation function for international phone numbers
  const validatePhoneNumber = (phoneStr, setError) => {
    // Extract only digits
    const digitsOnly = phoneStr.replace(/[^\d]/g, '')

    // Check minimum length (at least 7 digits for shortest international numbers)
    if (digitsOnly.length < 7) {
      setError(t('messages.phoneNumberTooShort'))
      return false
    }

    // Check maximum length (15 digits is ITU-T E.164 standard)
    if (digitsOnly.length > 15) {
      setError(t('messages.phoneNumberTooLong'))
      return false
    }

    // Basic check - must contain only digits and be non-empty
    if (!PHONE_REGEX.test(digitsOnly)) {
      setError(t('messages.phoneNumberOnlyDigits'))
      return false
    }

    setError(null)
    return true
  }

  // Helper function to check if phone number is valid
  const isValidPhoneNumber = (phoneStr) => {
    const digitsOnly = phoneStr.replace(/[^\d]/g, '')
    return digitsOnly.length >= 7 && digitsOnly.length <= 15
  }

  // Validate message length
  const validateMessage = (messageText) => {
    if (!messageText.trim()) {
      setMessageError(t('messages.messageEmpty'))
      return false
    }

    if (messageText.length > MAX_MESSAGE_LENGTH) {
      setMessageError(t('messages.messageTooLong', { maxLength: MAX_MESSAGE_LENGTH }))
      return false
    }

    setMessageError(null)
    return true
  }

  // Check if internal balance is insufficient for messages (less than 0.01 SOL)
  const hasInsufficientInternalBalance = useMemo(() => {
    return balance && balance.solBalance < 0.01
  }, [balance])

  // Helper function to randomize caller ID
  const randomizeCallerID = () => {
    setCallerID(getRandomCallerID())
    validatePhoneNumber(getRandomCallerID(), setCallerIDError)
  }

  // Handle sending message
  const handleSendMessage = async () => {
    // Reset previous states
    setSendSuccess(false)
    setSendError(null)

    // Validate all inputs
    const isCallerIDValid = validatePhoneNumber(callerID, setCallerIDError)
    const isToNumberValid = validatePhoneNumber(toNumber, setToNumberError)
    const isMessageValid = validateMessage(message)

    if (!isCallerIDValid || !isToNumberValid || !isMessageValid) {
      addLog('error', t('messages.validationFailed'), t('messages.checkAllFields'))
      return
    }

    setIsSending(true)
    addLog('info', t('messages.sendingMessage'), `From: +${callerID} To: +${toNumber}`)

    try {
      // Remove all non-numeric characters from phone numbers
      const callerIDDigits = callerID.replace(/[^\d]/g, '')
      const toNumberDigits = toNumber.replace(/[^\d]/g, '')

      const response = await apiClient.post('/tele/message', {
        callerID: callerIDDigits,
        to: toNumberDigits,
        message: message.trim()
      })

      if (response.status === 200 || response.status === 201) {
        setSendSuccess(true)
        addLog('success', t('messages.messageSentSuccess'), `Message ID: ${response.data?.messageId || 'N/A'}`)
        
        // Clear message field on success
        setMessage('')
        
        // Reset success state after 5 seconds
        setTimeout(() => {
          setSendSuccess(false)
        }, 5000)
      } else {
        throw new Error('Unexpected response status')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || t('messages.sendFailed')
      setSendError(errorMessage)
      addLog('error', t('messages.messageSendFailed'), errorMessage)
    } finally {
      setIsSending(false)
    }
  }

  const handleClearLogs = () => {
    clearLogs()
  }

  // Check if send button should be disabled
  const isSendDisabled = useMemo(() => {
    return isSending || 
           !callerID.trim() || 
           !toNumber.trim() || 
           !message.trim() || 
           callerIDError || 
           toNumberError || 
           messageError || 
           !isValidPhoneNumber(callerID) || 
           !isValidPhoneNumber(toNumber) || 
           hasInsufficientInternalBalance
  }, [isSending, callerID, toNumber, message, callerIDError, toNumberError, messageError, hasInsufficientInternalBalance])

  return (
    <div className="flex flex-col lg:grid lg:grid-cols-12 lg:grid-rows-2 gap-6 h-full">
      {/* Messages Card - Top (or full width on mobile) */}
      <div className={`lg:col-span-8 card p-4 flex justify-center relative ${isUserInactive() ? 'overflow-hidden' : ''}`}>
        {/* Always show the messages interface */}
        <div className={`flex flex-row w-full gap-4 ${isUserInactive() ? 'blur-sm pointer-events-none' : ''}`}>
          <div className='w-full'>
            {/* Status */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className={`chip ${sendSuccess ? 'bg-green-500/20 border border-green-400/30 text-green-100' : 
                                          isSending ? 'bg-blue-500/20 border border-blue-400/30 text-blue-100' : 
                                          sendError ? 'bg-red-500/20 border border-red-400/30 text-red-100' : 
                                          'chip'}`}>
                  {sendSuccess ? t('messages.messageSent') : 
                   isSending ? t('messages.sending') : 
                   sendError ? t('messages.sendFailed') : 
                   t('messages.readyToSend')}
                </span>
              </div>
            </div>

            {/* Caller ID */}
            <div className="mb-6">
              <label className="text-white/70 text-sm block mb-3">{t('messages.callerIdFrom')}</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className={`flex-1 relative bg-white/5 border ${callerIDError ? 'border-red-400' : 'border-white/10'} rounded-xl overflow-hidden ${isSending ? 'opacity-50' : ''}`}>
                  <div className="absolute left-0 top-0 h-full flex items-center justify-center w-8 text-white/60 pointer-events-none">
                    +
                  </div>
                  <input
                    type="text"
                    value={callerID}
                    onChange={(e) => {
                      // Remove all non-numeric characters
                      const sanitized = e.target.value.replace(/[^\d]/g, '')
                      setCallerID(sanitized)
                      validatePhoneNumber(sanitized, setCallerIDError)
                    }}
                    placeholder={t('messages.enterCallerIdPlaceholder')}
                    disabled={isSending}
                    className={`w-full bg-transparent border-none pl-8 pr-4 py-3 text-white placeholder-white/40 focus:outline-none min-h-[50px] ${isSending ? 'cursor-not-allowed' : ''}`}
                  />
                </div>
                <button
                  onClick={randomizeCallerID}
                  disabled={isSending}
                  className={`bg-white/10 hover:bg-white/15 text-white px-4 py-3 rounded-xl text-sm transition-all whitespace-nowrap sm:w-32 h-[50px] ${isSending ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {t('call.randomize')}
                </button>
              </div>
              {/* Status indicators */}
              <div className="text-gray-400 text-xs mt-2">
                {callerIDError ? (
                  <span className="text-red-400">{callerIDError}</span>
                ) : (
                  <span>{t('messages.callerIdHelp')}</span>
                )}
              </div>
            </div>

            {/* To Number */}
            <div className="mb-6">
              <label className="text-white/70 text-sm block mb-3">{t('messages.toNumber')}</label>
              <div className={`flex-1 relative bg-white/5 border ${toNumberError ? 'border-red-400' : 'border-white/10'} rounded-xl overflow-hidden ${isSending ? 'opacity-50' : ''}`}>
                <div className="absolute left-0 top-0 h-full flex items-center justify-center w-8 text-white/60 pointer-events-none">
                  +
                </div>
                <input
                  type="text"
                  value={toNumber}
                  onChange={(e) => {
                    // Remove all non-numeric characters
                    const sanitized = e.target.value.replace(/[^\d]/g, '')
                    setToNumber(sanitized)
                    validatePhoneNumber(sanitized, setToNumberError)
                  }}
                  placeholder={t('messages.enterRecipientPlaceholder')}
                  disabled={isSending}
                  className={`w-full bg-transparent border-none pl-8 pr-4 py-3 text-white placeholder-white/40 focus:outline-none ${isSending ? 'cursor-not-allowed' : ''}`}
                />
              </div>
              {/* Status indicators */}
              <div className="text-gray-400 text-xs mt-2">
                {toNumberError ? (
                  <span className="text-red-400">{toNumberError}</span>
                ) : (
                  <span>{t('messages.toNumberHelp')}</span>
                )}
              </div>
            </div>

            {/* Message Input */}
            <div className="mb-6">
              <label className="text-white/70 text-sm block mb-3">
                {t('messages.messageLabel', { current: message.length, max: MAX_MESSAGE_LENGTH })}
              </label>
              <div className={`relative bg-white/5 border ${messageError ? 'border-red-400' : 'border-white/10'} rounded-xl overflow-hidden ${isSending ? 'opacity-50' : ''}`}>
                <textarea
                  value={message}
                  onChange={(e) => {
                    setMessage(e.target.value)
                    validateMessage(e.target.value)
                  }}
                  placeholder={t('messages.enterMessagePlaceholder')}
                  disabled={isSending}
                  maxLength={MAX_MESSAGE_LENGTH}
                  rows={4}
                  className={`w-full bg-transparent border-none p-4 text-white placeholder-white/40 focus:outline-none resize-none ${isSending ? 'cursor-not-allowed' : ''}`}
                />
              </div>
              {/* Status indicators */}
              <div className="text-gray-400 text-xs mt-2">
                {messageError ? (
                  <span className="text-red-400">{messageError}</span>
                ) : (
                  <span>{t('messages.messageHelp', { maxLength: MAX_MESSAGE_LENGTH })}</span>
                )}
              </div>
            </div>

            {/* Send Button */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleSendMessage}
                disabled={isSendDisabled}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all h-[50px] border flex items-center justify-center gap-2 ${
                  isSendDisabled
                    ? 'bg-gray-600/20 text-gray-500 border-gray-600/30 cursor-not-allowed'
                    : 'bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border-blue-600/30 hover:border-blue-600/50'
                }`}
                title={hasInsufficientInternalBalance ? t('messages.insufficientBalance') : ''}
              >
                {isSending && (
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                )}
                {isSending ? t('messages.sending') : hasInsufficientInternalBalance ? t('call.insufficientBalance') : t('messages.sendMessage')}
              </button>

              {/* Success/Error Messages */}
              {sendSuccess && (
                <div className="flex items-center text-green-400 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {t('messages.messageSentSuccess')}
                </div>
              )}

              {sendError && (
                <div className="flex items-center text-red-400 text-sm">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  {sendError}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Inactive User Overlay */}
        {isUserInactive() && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-none z-10">
            <div className="text-center px-4">
              <h3 className="text-xl font-semibold text-white mb-2">{t('account.accountInactive')}</h3>
              <p className="text-white/70 text-base">
                {t('messages.accountInactiveMessage')}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Balance Card - Below Messages Card on mobile/tablet, Right side on desktop */}
      <div className="lg:col-span-4">
        <Balance onNavigateToInvoices={onNavigateToInvoices} onNavigateToSupport={onNavigateToSupport} />
      </div>

      {/* Logs Card - Bottom (spans full width) */}
      <div className="lg:col-span-12 card p-4 h-fit">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg text-white/70">{t('messages.logs')}</h3>
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
                {t('messages.noLogs')}
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

export default Messages
