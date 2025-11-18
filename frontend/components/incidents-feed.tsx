'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, AlertCircle, AlertOctagon } from 'lucide-react'
import IncidentModal from './incident-modal'

interface Incident {
  id: string
  repo_name: string
  pr_number: number | null
  severity: 'Low' | 'Medium' | 'High' | 'Ambiguous'
  finding_type: string
  description: string
  status: string
  created_at: string
}

interface IncidentsFeedProps {
  userId: string
}

export default function IncidentsFeed({ userId }: IncidentsFeedProps) {
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: '1',
      repo_name: 'vercel/next.js',
      pr_number: 1234,
      severity: 'High',
      finding_type: 'Unpinned Action',
      description: 'Uses/setup-node@latest without pinned version',
      status: 'Open',
      created_at: '2024-11-18T10:30:00Z',
    },
    {
      id: '2',
      repo_name: 'facebook/react',
      pr_number: null,
      severity: 'Medium',
      finding_type: 'Curl Pattern',
      description: 'Potential code injection in workflow',
      status: 'Open',
      created_at: '2024-11-17T15:45:00Z',
    },
    {
      id: '3',
      repo_name: 'microsoft/vscode',
      pr_number: 5678,
      severity: 'Ambiguous',
      finding_type: 'Ambiguous Pattern',
      description: 'Requires manual review',
      status: 'Open',
      created_at: '2024-11-16T08:20:00Z',
    },
  ])

  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'text-high bg-high/10'
      case 'Medium':
        return 'text-medium bg-medium/10'
      case 'Low':
        return 'text-low bg-low/10'
      case 'Ambiguous':
        return 'text-ambiguous bg-ambiguous/10'
      default:
        return 'text-text-secondary bg-surface-secondary'
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'High':
        return <AlertOctagon size={16} />
      case 'Medium':
        return <AlertTriangle size={16} />
      case 'Ambiguous':
        return <AlertCircle size={16} />
      default:
        return <AlertCircle size={16} />
    }
  }

  return (
    <div className="bg-surface border border-border rounded p-6 space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Recent Incidents</h3>

      <div className="space-y-3">
        {incidents.map((incident) => (
          <button
            key={incident.id}
            onClick={() => setSelectedIncident(incident)}
            className="w-full text-left p-4 bg-surface-secondary border border-border rounded hover:bg-border/50 transition flex items-start justify-between gap-4 group"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-medium text-text-primary truncate">{incident.repo_name}</span>
                {incident.pr_number && (
                  <span className="text-xs px-2 py-1 bg-accent/20 text-accent rounded whitespace-nowrap">
                    PR #{incident.pr_number}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary mb-2">{incident.description}</p>
              <div className="flex items-center gap-2 text-xs">
                <span className={`px-2 py-1 rounded flex items-center gap-1 ${getSeverityColor(incident.severity)}`}>
                  {getSeverityIcon(incident.severity)}
                  {incident.severity}
                </span>
                <span className="text-text-secondary">{incident.finding_type}</span>
              </div>
            </div>
            <div className="flex-shrink-0 text-text-secondary group-hover:text-accent transition">→</div>
          </button>
        ))}
      </div>

      {/* Incident Modal */}
      {selectedIncident && (
        <IncidentModal
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
        />
      )}
    </div>
  )
}
