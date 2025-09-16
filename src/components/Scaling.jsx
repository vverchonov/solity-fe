function Scaling() {
  const serverUpdates = [
    {
      title: "SolityNET Call",
      category: "Telephony",
      status: "Done",
      description: "We're rolling out the SolityNET calling feature to the public. It took just three months to go from idea to live product - our first step toward becoming the leading crypto-native mobility provider.",
      details: ["Public launch complete", "3 months development", "Crypto-native mobility"],
      impact: 5,
      eta: "2026-02-01",
      overdue: ""
    },
    {
      title: "SolityNET Coverage Increase",
      category: "Performance",
      status: "In progress",
      description: "Daily coverage expansions are planned. 40+ countries are queued for rollout. We'll post day-by-day updates on X.",
      details: ["40+ countries queued", "Daily expansions", "X updates"],
      impact: 4,
      eta: "2026-03-15",
      overdue: ""
    },
    {
      title: "SolityNET API",
      category: "Technology",
      status: "In progress",
      description: "Opening up the SolityNET API brings full integration flexibility. Hook up your own systems - or connect an AI assistant that can place calls on your behalf, from ordering pizza to scheduling business meetings.",
      details: ["Full integration flexibility", "AI assistant support", "Business automation"],
      impact: 5,
      eta: "2026-04-01",
      overdue: ""
    },
    {
      title: "SolityNET SMS",
      category: "Telephony",
      status: "Planned",
      description: "Decentralized outbound SMS is fully feasible and in active development. As with calling, we're focusing on sending only; we won't support inbound SMS reception to avoid potential exposure of personal information.",
      details: ["Outbound SMS only", "Privacy focused", "Decentralized"],
      impact: 4,
      eta: "2026-05-15",
      overdue: ""
    },
    {
      title: "Solity AI Assistant",
      category: "AI",
      status: "Planned",
      description: "A test launch of the AI assistant is planned before eSIM, since it's a core mobility feature. It can replace voicemail, screen incoming calls as your gatekeeper, and handle simple tasks like \"book a table\" or \"order pizza.\"",
      details: ["Voicemail replacement", "Call screening", "Task automation"],
      impact: 5,
      eta: "2026-06-01",
      overdue: ""
    },
    {
      title: "Solity eSIM US",
      category: "Telephony",
      status: "Planned",
      description: "The United States will be our first eSIM market, offering direct telephony with unique/custom extension numbers. Global coverage is a key goal on our roadmap.",
      details: ["US first market", "Custom extensions", "Global coverage goal"],
      impact: 5,
      eta: "2026-07-01",
      overdue: ""
    }
  ]

  const roadmapPhases = [
    {
      title: "Phase 1 | Foundation",
      subtitle: "Now → 100 concurrent calls",
      progress: 80,
      features: [
        "Stable core dialer + billing in SOL",
        "Rate limiter v2",
        "Basic dashboards (P95)"
      ]
    },
    {
      title: "Phase 2 | Scale-out",
      subtitle: "100 → 1,000 concurrent calls",
      progress: 40,
      features: [
        "Autoscaling workers (HPA)",
        "Multi-region ingress + failover",
        "Background number reputation checks"
      ]
    },
    {
      title: "Phase 3 | Global",
      subtitle: "Multi-region + routing policies",
      progress: 10,
      features: [
        "Smart routing by latency/cost",
        "Customer traffic isolation",
        "Disaster recovery drills (quarterly)"
      ]
    },
    {
      title: "Phase 4 | Enterprise",
      subtitle: "Security & compliance uplift",
      progress: 5,
      features: [
        "KMS key management + rotations",
        "SAML SSO / SCIM",
        "Fine-grained org controls"
      ]
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
      case 'Done':
        return 'bg-green-600/20 text-green-300 border-green-600/30'
      case 'In progress':
        return 'bg-yellow-600/20 text-yellow-300 border-yellow-600/30'
      case 'Planned':
        return 'bg-blue-600/20 text-blue-300 border-blue-600/30'
      default:
        return 'bg-gray-600/20 text-gray-300 border-gray-600/30'
    }
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
            Upcoming server updates
          </h3>
        </div>

        <p className="text-white/60 text-sm mb-6">
          Edit the JSON in updatesData (near the bottom of this file) to keep this list fresh.
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
                      {update.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs border w-fit text-center ${getStatusStyle(update.status)}`}>
                      {update.status}
                    </span>
                  </div>
                  <div className="mb-2">
                    <span className="text-white/60 text-sm">
                      {update.category}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-white/70 text-sm mb-3 leading-relaxed">
                  {update.description}
                </p>

                {/* Details List */}
                <ul className="space-y-1 mb-4">
                  {update.details.map((detail, detailIndex) => (
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
                  <span className="text-white/60">ETA:</span>
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
      <div className="card p-6">
        {/* Roadmap Header */}
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-xl font-bold text-white">
            Scaling roadmap
          </h3>
        </div>

        {/* 4 Phase Cards Grid - Responsive: 1 column on mobile, 2 on tablet+ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roadmapPhases.map((phase, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
              {/* Phase Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-3">
                <div className="flex-1">
                  <h4 className="text-lg font-semibold text-white mb-1">
                    {phase.title}
                  </h4>
                  <p className="text-white/60 text-sm">
                    {phase.subtitle}
                  </p>
                </div>
                <span className="text-white/80 text-sm font-medium bg-white/10 px-2 py-1 rounded-full w-fit">
                  {phase.progress}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-2 mb-4">
                <div
                  className="bg-white/60 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${phase.progress}%` }}
                ></div>
              </div>

              {/* Features List */}
              <ul className="space-y-2">
                {phase.features.map((feature, featureIndex) => (
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
    </div>
  )
}

export default Scaling