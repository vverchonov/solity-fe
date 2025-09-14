function Scaling() {
  const serverUpdates = [
    {
      title: "Edge caching for prompts",
      category: "Performance",
      status: "Done",
      description: "Cuts cold-start for popular prompts.",
      details: ["TTL 5m", "Stale-while-revalidate"],
      impact: 2,
      eta: "2026-03-01",
      overdue: ""
    },
    {
      title: "Rate limiter v2",
      category: "Reliability",
      status: "In progress",
      description: "Per-key burst control to avoid noisy neighbors.",
      details: ["Token bucket by CID", "Priority for verified callers"],
      impact: 4,
      eta: "2026-03-25",
      overdue: ""
    },
    {
      title: "Multi-region SIP ingress",
      category: "Telephony",
      status: "In progress",
      description: "Route calls to nearest POP to reduce latency; active-active failover.",
      details: ["New POP in FRA & SGP", "Geo DNS & health checks", "Failover runbooks"],
      impact: 5,
      eta: "2026-04-05",
      overdue: ""
    },
    {
      title: "Observability baseline",
      category: "Observability",
      status: "Planned",
      description: "Golden signals, tracing for call lifecycle.",
      details: ["Dashboards for P95/99", "Trace spans across services"],
      impact: 3,
      eta: "2026-04-12",
      overdue: ""
    },
    {
      title: "Autoscaling workers (HPA)",
      category: "Compute",
      status: "Planned",
      description: "Scale audio workers by CPU + queue depth.",
      details: ["Prometheus adapter metrics", "HPA v2 policy tuning"],
      impact: 4,
      eta: "2026-04-20",
      overdue: ""
    },
    {
      title: "Session encryption at rest",
      category: "Security",
      status: "Planned",
      description: "Rotate KMS keys; no call content stored.",
      details: ["KMS rotation schedule", "Key access audit"],
      impact: 5,
      eta: "2026-05-01",
      overdue: ""
    }
  ]

  const roadmapPhases = [
    {
      title: "Phase 1 — Foundation",
      subtitle: "Now → 100 concurrent calls",
      progress: 80,
      features: [
        "Stable core dialer + billing in SOL",
        "Rate limiter v2",
        "Basic dashboards (P95)"
      ]
    },
    {
      title: "Phase 2 — Scale-out",
      subtitle: "100 → 1,000 concurrent calls",
      progress: 40,
      features: [
        "Autoscaling workers (HPA)",
        "Multi-region ingress + failover",
        "Background number reputation checks"
      ]
    },
    {
      title: "Phase 3 — Global",
      subtitle: "Multi-region + routing policies",
      progress: 10,
      features: [
        "Smart routing by latency/cost",
        "Customer traffic isolation",
        "Disaster recovery drills (quarterly)"
      ]
    },
    {
      title: "Phase 4 — Enterprise",
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

        {/* 6 Update Cards Grid */}
        <div className="grid grid-cols-3 gap-4">
          {serverUpdates.map((update, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
              {/* Update Header */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-lg font-semibold text-white">
                    {update.title}
                  </h4>
                  <span className={`px-2 py-1 rounded-full text-xs border ${getStatusStyle(update.status)}`}>
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
              <p className="text-white/70 text-sm mb-3">
                {update.description}
              </p>

              {/* Details List */}
              <ul className="space-y-1 mb-4">
                {update.details.map((detail, detailIndex) => (
                  <li key={detailIndex} className="flex items-start gap-2">
                    <span className="text-white/60 text-sm mt-0.5">•</span>
                    <span className="text-white/60 text-sm">
                      {detail}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Footer with Impact and ETA */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-white/60">Impact</span>
                  <div className="flex">
                    {renderStars(update.impact)}
                  </div>
                </div>
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

        {/* 4 Phase Cards Grid */}
        <div className="grid grid-cols-2 gap-4">
          {roadmapPhases.map((phase, index) => (
            <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
              {/* Phase Header */}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-lg font-semibold text-white mb-1">
                    {phase.title}
                  </h4>
                  <p className="text-white/60 text-sm">
                    {phase.subtitle}
                  </p>
                </div>
                <span className="text-white/80 text-sm font-medium">
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
                    <span className="text-white/70 text-sm">
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