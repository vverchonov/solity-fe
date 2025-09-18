import { useState, useEffect, useRef } from 'react'
import { useI18n } from '../contexts/I18nProvider'

export function CallModal({ isVisible, phoneNumber, callDuration, isMuted, soundDisabled, callStatus, onEndCall, onMute, onSoundToggle, onDTMF, onMinimize }) {
  const [showNumpad, setShowNumpad] = useState(false)
  const { t } = useI18n()

  const [position, setPosition] = useState({ x: window.innerWidth / 2 - 160, y: window.innerHeight / 2 - 300 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const modalRef = useRef(null)

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const handleMouseDown = (e) => {
    const target = e.target
    if (target.closest('.drag-handle')) {
      setIsDragging(true)
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      })
    }
  }

  const handleMouseMove = (e) => {
    if (isDragging) {
      const modalWidth = 320
      const modalHeight = showNumpad ? 700 : 600
      const newX = Math.max(0, Math.min(window.innerWidth - modalWidth, e.clientX - dragStart.x))
      const newY = Math.max(0, Math.min(window.innerHeight - modalHeight, e.clientY - dragStart.y))
      setPosition({ x: newX, y: newY })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

  const toggleNumpad = () => {
    setShowNumpad(!showNumpad)
  }

  const handleDTMF = (digit) => {
    if (onDTMF) onDTMF(digit)
  }

  if (!isVisible) {
    return null
  }

  return (
    <div
      ref={modalRef}
      className={`fixed z-50 w-80 bg-gray-900/40 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden cursor-move ${
        showNumpad ? 'h-[700px] sm:h-[650px]' : 'h-[600px] sm:h-[550px]'
      }`}
      style={{ left: position.x, top: position.y }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="relative p-6 text-center drag-handle">
        <button
          className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
          onClick={(e) => {
            e.stopPropagation()
            onMinimize()
          }}
          onMouseDown={(e) => {
            e.stopPropagation()
          }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>

        <div className="mt-8">
          <div className="text-sm text-white/60 mb-2">
            {callStatus === 'ringing' ? t('status.ringing') :
              callStatus === 'calling' ? t('status.connecting') :
                callStatus === 'in-call' ? t('status.inCall') :
                  callStatus === 'connecting' ? t('status.connecting') :
                    t('status.inCall')}
          </div>
          <div className="text-2xl font-medium text-white mb-2">{phoneNumber}</div>
          <div className="text-lg text-white/70">
            {formatDuration(callDuration)}
          </div>
          {(callStatus === 'ringing' || callStatus === 'calling') && (
            <div className="text-xs text-white/50 mt-3 text-center max-w-48 mx-auto">
              {t('call.connectionDelay')}
            </div>
          )}
        </div>
      </div>

      {/* Avatar/Visual or Numpad */}
      {showNumpad ? (
        <div className="px-6 py-4 mb-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium text-white/70">{t('call.numpad')}</h3>
            <button
              className="h-6 w-6 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/70 hover:text-white transition-all"
              onClick={toggleNumpad}
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-3 max-w-44 mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
              <button
                key={digit}
                className="h-12 w-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 text-white text-lg font-medium transition-all"
                onClick={() => handleDTMF(digit)}
              >
                {digit}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          {/* Avatar/Visual */}
          <div className="flex justify-center py-8">
            <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center">
              <svg className="h-16 w-16 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>

          {/* Call Status */}
          <div className="px-6 py-4 text-center">
            <div className="text-sm text-white/60">
              {isMuted && t('call.microphoneMuted')}
              {soundDisabled && !isMuted && t('call.soundDisabled')}
              {!isMuted && !soundDisabled && t('call.callInProgress')}
            </div>
          </div>
        </>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex justify-center items-center gap-6 mb-4">
          {/* Mute Button */}
          <button
            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full border transition-all ${isMuted
              ? 'bg-red-500 hover:bg-red-600 border-red-400 text-white'
              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            onClick={onMute}
          >
            {isMuted ? (
              <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            )}
          </button>

          {/* Speaker Button */}
          <button
            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full border transition-all ${soundDisabled
              ? 'bg-blue-500 hover:bg-blue-600 border-blue-400 text-white'
              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            onClick={onSoundToggle}
          >
            {soundDisabled ? (
              <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              </svg>
            ) : (
              <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            )}
          </button>

          {/* Numpad */}
          <button
            className={`h-12 w-12 sm:h-14 sm:w-14 rounded-full border transition-all ${showNumpad
              ? 'bg-blue-500 hover:bg-blue-600 border-blue-400 text-white'
              : 'bg-white/10 hover:bg-white/20 border-white/20 text-white'
              }`}
            onClick={toggleNumpad}
          >
            <svg className="h-6 w-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {/* End Call Button */}
        <div className="flex justify-center">
          <button
            className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all"
            onClick={onEndCall}
          >
            <svg className="h-6 w-6 sm:h-8 sm:w-8 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}