"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import { AlertCircle, TrendingUp, Zap } from "lucide-react"

interface MetricsGridProps {
  userId: string
}

interface DashboardStats {
  total_incidents: number
  high_severity_incidents: number
  open_incidents: number
  workflows_monitored: number
  safe_sandbox_runs: number
  total_sandbox_runs: number
}

export default function MetricsGrid({ userId }: MetricsGridProps) {
  const [metrics, setMetrics] = useState<DashboardStats>({
    total_incidents: 0,
    high_severity_incidents: 0,
    open_incidents: 0,
    workflows_monitored: 0,
    safe_sandbox_runs: 0,
    total_sandbox_runs: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const token = localStorage.getItem("token")
        const data = await api.incidents.dashboard(userId, token || undefined)
        setMetrics(data)
      } catch (error) {
        console.error("[v0] Error fetching metrics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMetrics()
  }, [userId])

  const metricCards = [
    {
      label: "High Severity",
      value: metrics.high_severity_incidents,
      icon: AlertCircle,
      color: "text-high",
      bgColor: "bg-high/10",
      borderColor: "border-high/30",
    },
    {
      label: "Open Incidents",
      value: metrics.open_incidents,
      icon: TrendingUp,
      color: "text-medium",
      bgColor: "bg-medium/10",
      borderColor: "border-medium/30",
    },
    {
      label: "Workflows",
      value: metrics.workflows_monitored,
      icon: Zap,
      color: "text-accent",
      bgColor: "bg-accent/10",
      borderColor: "border-accent/30",
    },
  ]

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-surface border border-border rounded-lg p-6 animate-pulse">
            <div className="h-8 bg-surface-secondary rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-surface-secondary rounded"></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {metricCards.map((card) => (
        <div
          key={card.label}
          className={`bg-surface border ${card.borderColor} rounded-lg p-6 flex flex-col items-start justify-between hover:border-accent/50 transition-colors`}
        >
          <div className={`${card.bgColor} w-10 h-10 rounded-lg flex items-center justify-center mb-4`}>
            <card.icon size={20} className={card.color} />
          </div>
          <div>
            <p className="text-3xl font-bold text-text-primary mb-1">{card.value}</p>
            <p className="text-text-secondary text-sm">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
