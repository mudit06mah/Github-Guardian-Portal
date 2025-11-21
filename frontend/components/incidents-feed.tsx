"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import { AlertTriangle, AlertCircle, AlertOctagon, Loader } from "lucide-react"
import IncidentModal from "./incident-modal"

interface Incident {
  id: string
  workflow_path: string
  severity: "Low" | "Medium" | "High" | "Ambiguous"
  finding_type: string
  description: string
  status: string
  pr_number: number | null
  created_at: string
}

interface IncidentsFeedProps {
  userId: string
}

export default function IncidentsFeed({ userId }: IncidentsFeedProps) {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const token = localStorage.getItem("token")
        const data = await api.incidents.list(userId, token || undefined)
        setIncidents(data)
      } catch (error) {
        console.error("[v0] Error fetching incidents:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchIncidents()
  }, [userId])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "text-high bg-high/10 border-high/30"
      case "Medium":
        return "text-medium bg-medium/10 border-medium/30"
      case "Low":
        return "text-low bg-low/10 border-low/30"
      case "Ambiguous":
        return "text-ambiguous bg-ambiguous/10 border-ambiguous/30"
      default:
        return "text-text-secondary bg-surface-secondary border-border"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "High":
        return <AlertOctagon size={16} />
      case "Medium":
        return <AlertTriangle size={16} />
      case "Ambiguous":
        return <AlertCircle size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Recent Incidents</h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="animate-spin text-text-secondary" />
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-text-secondary">No incidents found. Your repositories are safe!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <button
              key={incident.id}
              onClick={() => setSelectedIncident(incident)}
              className="w-full text-left p-4 bg-surface-secondary border border-border rounded-lg hover:bg-border/50 transition flex items-start justify-between gap-4 group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-medium text-text-primary truncate">{incident.workflow_path}</span>
                  {incident.pr_number && (
                    <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded whitespace-nowrap">
                      PR #{incident.pr_number}
                    </span>
                  )}
                </div>
                <p className="text-sm text-text-secondary mb-2">{incident.description}</p>
                <div className="flex items-center gap-2 text-xs flex-wrap">
                  <span
                    className={`px-2 py-1 rounded flex items-center gap-1 border ${getSeverityColor(incident.severity)}`}
                  >
                    {getSeverityIcon(incident.severity)}
                    {incident.severity}
                  </span>
                  <span className="text-text-secondary">{incident.finding_type}</span>
                  <span
                    className={`px-2 py-1 rounded text-xs ${incident.status === "Open" ? "bg-high/10 text-high" : "bg-low/10 text-low"}`}
                  >
                    {incident.status}
                  </span>
                </div>
              </div>
              <div className="flex-shrink-0 text-text-secondary group-hover:text-accent transition">→</div>
            </button>
          ))}
        </div>
      )}

      {/* Incident Modal */}
      {selectedIncident && (
        <IncidentModal incident={selectedIncident} userId={userId} onClose={() => setSelectedIncident(null)} />
      )}
    </div>
  )
}
