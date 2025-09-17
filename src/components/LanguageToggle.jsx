import { useState, useRef, useEffect } from 'react'
import { useI18n } from '../contexts/I18nProvider'

const LanguageToggle = ({ compact = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { getCurrentLanguage, getAvailableLanguages, changeLanguage } = useI18n()

  const currentLang = getCurrentLanguage()
  const languages = getAvailableLanguages()
  const currentLanguage = languages.find(lang => lang.code === currentLang) || languages[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLanguageChange = (langCode) => {
    changeLanguage(langCode)
    setIsOpen(false)
  }

  if (compact) {
    // Compact version for mobile - matches mobile logout button style
    return (
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="px-2 py-2 font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200 flex items-center rounded-lg"
          title="Change Language"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </button>

        {isOpen && (
          <div className="absolute top-full right-0 mt-2 bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 min-w-[140px]">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => handleLanguageChange(language.code)}
                className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/5 transition-all duration-200 ${
                  currentLang === language.code
                    ? 'bg-white/10 text-white border-l-2 border-blue-400'
                    : 'text-white/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{language.nativeName}</span>
                  {currentLang === language.code && (
                    <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Full version for desktop - matches logout button style exactly
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full text-sm px-3 py-3 font-medium text-white/70 hover:bg-white/5 hover:text-white transition-all duration-200 flex items-center justify-start gap-3 rounded-lg"
      >
        <div className="w-6 h-6 flex items-center justify-center">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
        </div>
        <span className="flex-1 text-left">{currentLanguage.nativeName}</span>
        <svg
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-lg border border-white/10 rounded-xl overflow-hidden shadow-2xl z-50">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={`w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/5 transition-all duration-200 ${
                currentLang === language.code
                  ? 'bg-white/10 text-white'
                  : 'text-white/70'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{language.nativeName}</div>
                  <div className="text-xs text-white/50">{language.name}</div>
                </div>
                {currentLang === language.code && (
                  <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default LanguageToggle