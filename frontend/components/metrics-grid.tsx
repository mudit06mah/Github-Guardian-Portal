'use client'

import { useState, useEffect } from 'react'

interface MetricsGridProps {
  userId: string
}

export default function MetricsGrid({ userId }: MetricsGridProps) {
  const [metrics, setMetrics] = useState({
    high_incidents: 0,
    workflows_monitored: 0,
    safe_runs_percentage: 95,
  })

  useEffect(() => {
    // Mock data - replace with API call
    setMetrics({
      high_incidents: 3,
      workflows_monitored: 12,
      safe_runs_percentage: 95,
    })
  }, [userId])

  const metricCards = [
    {
      label: 'Open High Incidents',
      value: metrics.high_incidents,
      color: 'text-high',
      bgColor: 'bg-high/10',
    },
    {
      label: 'Workflows Monitored',
      value: metrics.workflows_monitored,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
    {
      label: 'Safe Sandbox Runs',
      value: `${metrics.safe_runs_percentage}%`,
      color: 'text-low',
      bgColor: 'bg-low/10',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metricCards.map((card) => (
        <div
          key={card.label}
          className="bg-surface border border-border rounded p-6 flex flex-col items-center justify-center text-center"
        >
          <div className={`${card.bgColor} w-12 h-12 rounded mb-4 flex items-center justify-center`}>
            <p className={`${card.color} text-2xl font-bold`}>{card.value}</p>
          </div>
          <p className="text-text-secondary text-sm">{card.label}</p>
        </div>
      ))}
    </div>
  )
}
