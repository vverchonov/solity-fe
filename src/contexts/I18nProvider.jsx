import { createContext, useContext } from 'react'
import { useTranslation } from 'react-i18next'
import '../i18n/config'

const I18nContext = createContext()

export const useI18n = () => {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}

export const I18nProvider = ({ children }) => {
  const { t, i18n } = useTranslation()

  const changeLanguage = (language) => {
    i18n.changeLanguage(language)
  }

  const getCurrentLanguage = () => {
    return i18n.language
  }

  const getAvailableLanguages = () => {
    return [
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'zh', name: 'Chinese', nativeName: '中文' },
      { code: 'ko', name: 'Korean', nativeName: '한국어' }
    ]
  }

  const value = {
    t,
    changeLanguage,
    getCurrentLanguage,
    getAvailableLanguages,
    currentLanguage: i18n.language
  }

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  )
}

export default I18nProvider