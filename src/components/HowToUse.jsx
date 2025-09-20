import { useState } from 'react'
import { useI18n } from '../contexts/I18nProvider'

function HowToUse() {
  const [selectedDevice, setSelectedDevice] = useState('PC')
  const { t } = useI18n()

  const getDeviceSteps = () => {
    if (selectedDevice === 'PC') {
      return [
        {
          title: t('howToUse.pcSteps.step1.title'),
          description: t('howToUse.pcSteps.step1.description'),
          image: "/pc/1.png"
        },
        {
          title: t('howToUse.pcSteps.step2.title'),
          description: t('howToUse.pcSteps.step2.description'),
          image: "/pc/2.png"
        },
        {
          title: t('howToUse.pcSteps.step3.title'),
          description: t('howToUse.pcSteps.step3.description'),
          image: "/pc/3.png"
        },
        {
          title: t('howToUse.pcSteps.step4.title'),
          description: t('howToUse.pcSteps.step4.description'),
          image: "/pc/4.png"
        },
        {
          title: t('howToUse.pcSteps.step5.title'),
          description: t('howToUse.pcSteps.step5.description'),
          image: "/pc/5.png"
        }
      ]
    } else {
      return [
        {
          title: t('howToUse.phoneSteps.step1.title'),
          description: t('howToUse.phoneSteps.step1.description'),
          video: "/1.mp4"
        }
      ]
    }
  }

  const steps = getDeviceSteps()

  return (
    <div className="space-y-6 h-full overflow-y-auto">
      {/* Single Card Layout */}
      <div className="card p-6">
        <h2 className="text-2xl font-bold text-white mb-6">{t('howToUse.title')}</h2>

        <div className="space-y-6">
          {/* Header Section */}
          <div>
            <h3 className="text-xl font-semibold text-white mb-4">{t('howToUse.instructions')}</h3>
            <p className="text-white/80 text-base leading-relaxed">
              {t('howToUse.description')}
            </p>
          </div>

          {/* Device Toggle Section */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">{t('howToUse.chooseDevice')}</h4>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 w-fit">
              <div className="flex gap-4">
                <button
                  onClick={() => setSelectedDevice('PC')}
                  className={`px-4 py-2 rounded-lg transition-all font-medium ${selectedDevice === 'PC'
                    ? 'bg-blue-500/30 border border-blue-400/50 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                >
                  {t('howToUse.pc')}
                </button>
                <button
                  onClick={() => setSelectedDevice('Phone')}
                  className={`px-4 py-2 rounded-lg transition-all font-medium ${selectedDevice === 'Phone'
                    ? 'bg-blue-500/30 border border-blue-400/50 text-white'
                    : 'bg-white/5 hover:bg-white/10 text-white/70'
                    }`}
                >
                  {t('howToUse.phone')}
                </button>
              </div>

            </div>
          </div>

          {/* Steps Section */}
          <div>
            <h4 className="text-lg font-medium text-white mb-3">{t('howToUse.gettingStarted')} ({selectedDevice})</h4>
            <div className="space-y-6">
              {steps.map((step, index) => (
                <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h5 className="text-white font-medium mb-2">{step.title}</h5>
                      <p
                        className="text-white/70 text-sm mb-3 whitespace-pre-line"
                        dangerouslySetInnerHTML={{
                          __html: step.description.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-semibold">$1</strong>')
                        }}
                      ></p>
                      {step.image && (
                        <div className="mt-3">
                          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden cursor-zoom-in hover:bg-white/10 transition-all">
                            <img
                              src={step.image}
                              alt={`${t('howToUse.stepAlt')} ${index + 1}: ${step.title}`}
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        </div>
                      )}
                      {step.video && (
                        <div className="mt-3 flex justify-center">
                          <div className="bg-white/5 border border-white/10 rounded-lg overflow-hidden w-fit">
                            <video
                              src={step.video}
                              controls
                              className="max-h-[600px]"
                              preload="metadata"
                            >
                              <p className="text-white/70 text-sm p-4">
                                {t('howToUse.videoFallback')}{' '}
                                <a href={step.video} className="text-blue-400 underline">
                                  {t('howToUse.linkToVideo')}
                                </a>{' '}
                                {t('howToUse.instead')}
                              </p>
                            </video>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-white mb-4">{t('howToUse.faq')}</h3>
        <div className="space-y-3">
          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all">
              <span className="text-white font-semibold">{t('howToUse.faqItems.activateAccount.question')}</span>
              <svg className="w-5 h-5 text-blue-200 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white/80 text-sm">
                {t('howToUse.faqItems.activateAccount.answer')}
              </p>
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all">
              <span className="text-white font-semibold">{t('howToUse.faqItems.supportedTokens.question')}</span>
              <svg className="w-5 h-5 text-blue-200 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-lg">
              <p
                className="text-white/80 text-sm"
                dangerouslySetInnerHTML={{
                  __html: t('howToUse.faqItems.supportedTokens.answer')
                }}
              ></p>
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all">
              <span className="text-white font-semibold">{t('howToUse.faqItems.creditsAppear.question')}</span>
              <svg className="w-5 h-5 text-blue-200 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white/80 text-sm">
                {t('howToUse.faqItems.creditsAppear.answer')}
              </p>
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all">
              <span className="text-white font-semibold">{t('howToUse.faqItems.storeLogs.question')}</span>
              <svg className="w-5 h-5 text-blue-200 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white/80 text-sm">
                {t('howToUse.faqItems.storeLogs.answer')}
              </p>
            </div>
          </details>

          <details className="group">
            <summary className="flex items-center justify-between cursor-pointer p-4 bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/30 rounded-lg transition-all">
              <span className="text-white font-semibold">{t('howToUse.faqItems.withdrawCredits.question')}</span>
              <svg className="w-5 h-5 text-blue-200 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="mt-2 p-4 bg-white/5 border border-white/10 rounded-lg">
              <p className="text-white/80 text-sm">
                {t('howToUse.faqItems.withdrawCredits.answer')}
              </p>
            </div>
          </details>
        </div>
      </div>
    </div>
  )
}

export default HowToUse