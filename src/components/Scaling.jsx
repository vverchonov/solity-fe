import { useI18n } from '../contexts/I18nProvider'

function Scaling() {
  const { t } = useI18n()
  const serverUpdates = [
    {
      titleKey: "solityNetCall",
      category: "telephony",
      status: "done",
      impact: 5,
      eta: "2026-02-01",
      overdue: ""
    },
    {
      titleKey: "coverageIncrease",
      category: "performance",
      status: "inProgress",
      impact: 4,
      eta: "2026-03-15",
      overdue: ""
    },
    {
      titleKey: "solityNetApi",
      category: "technology",
      status: "inProgress",
      impact: 5,
      eta: "2026-04-01",
      overdue: ""
    },
    {
      titleKey: "solityNetSms",
      category: "telephony",
      status: "planned",
      impact: 4,
      eta: "2026-05-15",
      overdue: ""
    },
    {
      titleKey: "aiAssistant",
      category: "ai",
      status: "planned",
      impact: 5,
      eta: "2026-06-01",
      overdue: ""
    },
    {
      titleKey: "esimUs",
      category: "telephony",
      status: "planned",
      impact: 5,
      eta: "2026-07-01",
      overdue: ""
    }
  ]

  const roadmapPhases = [
    {
      phaseKey: "phase1",
      progress: 80
    },
    {
      phaseKey: "phase2",
      progress: 40
    },
    {
      phaseKey: "phase3",
      progress: 10
    },
    {
      phaseKey: "phase4",
      progress: 5
    }
  ]

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? 'text-yellow-400' : 'text-gray-600'}>
        ★
      </span>
    ))
  }

  const getStatusStyle = (status) => {
    switch (status) {
      case 'done':
        return 'bg-green-600/20 text-green-300 border-green-600/30'
      case 'inProgress':
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30'
      case 'planned':
        return 'bg-blue-600/20 text-blue-300 border-blue-600/30'
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-600/30'
    }
  }

  const getStatusText = (status) => {
    return t(`scaling.status.${status}`)
  }

  const getCategoryText = (category) => {
    return t(`scaling.categories.${category}`)
  }

  return (
    <div className="space-y-6">

      {/* Server Updates Card */}
      <div className="card p-6">
        {/* Updates Header */}
        <div className="flex items-center gap-2 mb-3">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-xl font-bold text-white">
            {t('scaling.upcomingUpdates')}
          </h3>
        </div>

        <p className="text-white/60 text-sm mb-6">
          {t('scaling.updateDescription')}
        </p>

        {/* 6 Update Cards Grid - Responsive: 1 column on mobile, 2 on tablet, 3 on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serverUpdates.map((update, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col">
              {/* Content Container */}
              <div className="flex-grow">
                {/* Update Header */}
                <div className="mb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <h4 className="text-lg font-semibold text-white">
                      {t(`scaling.updates.${update.titleKey}.title`)}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs border w-fit text-center ${getStatusStyle(update.status)}`}>
                      {getStatusText(update.status)}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-white/60 text-sm">
                      {getCategoryText(update.category)}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/70 text-sm mb-3 leading-relaxed">
                  {t(`scaling.updates.${update.titleKey}.description`)}
                </p>

                {/* Details List */}
                <ul className="space-y-1 mb-4">
                  {t(`scaling.updates.${update.titleKey}.details`, { returnObjects: true }).map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start gap-2">
                      <span className="text-white/60 text-sm mt-0.5">•</span>
                      <span className="text-white/60 text-sm leading-relaxed">
                        {detail}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Footer with ETA - Always at bottom */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 text-sm mt-auto">
                <div className="flex items-center gap-2">
                  <span className="text-white/60">{t('scaling.eta')}:</span>
                  <div className="flex items-center gap-1">
                    <span className="bg-white/10 border border-white/20 text-white/80 px-2 py-1 rounded-full text-xs">
                      {update.eta}
                    </span>
                    {update.overdue && (
                      <span className="text-red-400 text-xs">{update.overdue}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap Card */}
      {/*
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-xl font-bold text-white">
            {t('scaling.scalingRoadmap')}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmapPhases.map((phase, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1">
                    {t(`scaling.phases.${phase.phaseKey}.title`)}
                  </h4>
                  <p className="text-white/60 text-sm">
                    {t(`scaling.phases.${phase.phaseKey}.subtitle`)}
                  </p>
                </div>
                <span className="text-white/80 text-sm font-medium bg-white/10 px-2 py-1 rounded-full w-fit">
                  {phase.progress}%
                </span>
              </div>

              <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                <div
                  className="bg-white/60 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${phase.progress}%` }}
                ></div>
              </div>

              <ul className="space-y-2">
                {t(`scaling.phases.${phase.phaseKey}.features`, { returnObjects: true }).map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start gap-2">
                    <span className="text-white/60 text-sm mt-0.5">•</span>
                    <span className="text-white/70 text-sm leading-relaxed">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      */}
    </div >
  )
}

export default Scaling