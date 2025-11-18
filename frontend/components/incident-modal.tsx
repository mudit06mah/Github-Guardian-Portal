'use client'

import { X, Code, CheckCircle, AlertTriangle } from 'lucide-react'
import { useState } from 'react'

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

interface IncidentModalProps {
  incident: Incident
  onClose: () => void
}

export default function IncidentModal({ incident, onClose }: IncidentModalProps) {
  const [status, setStatus] = useState(incident.status)

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-border rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-surface">
          <div>
            <h2 className="text-xl font-bold text-text-primary">{incident.repo_name}</h2>
            <p className="text-sm text-text-secondary mt-1">{incident.finding_type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-surface-secondary rounded transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Incident Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-text-secondary uppercase mb-1">Severity</p>
              <p className="text-lg font-semibold text-high">{incident.severity}</p>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase mb-1">Status</p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-surface-secondary border border-border rounded px-3 py-1 text-text-primary"
              >
                <option>Open</option>
                <option>Fixed</option>
                <option>Dismissed</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase mb-1">PR Number</p>
              <p className="text-lg font-semibold text-accent">
                {incident.pr_number ? `#${incident.pr_number}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-text-secondary uppercase mb-1">Date</p>
              <p className="text-sm">{new Date(incident.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-semibold text-text-primary mb-2">Description</p>
            <p className="text-sm text-text-secondary bg-surface-secondary rounded p-4">
              {incident.description}
            </p>
          </div>

          {/* Sandbox Orchestration */}
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Code size={18} />
              Sandbox Orchestration Status
            </h3>

            <div className="space-y-4">
              {/* Code Snippet */}
              <div>
                <p className="text-xs text-text-secondary uppercase mb-2">Code Snippet Executed</p>
                <pre className="bg-surface-secondary border border-border rounded p-4 text-xs overflow-x-auto text-text-primary">
{`uses/setup-node@latest
- run: npm install
- run: npm test`}
                </pre>
              </div>

              {/* Verdict */}
              <div className="bg-surface-secondary border border-border rounded p-4">
                <div className="flex items-center gap-3 mb-3">
                  <CheckCircle size={20} className="text-low" />
                  <p className="font-semibold text-text-primary">Verdict: Safe</p>
                </div>
                <p className="text-xs text-text-secondary">
                  Sandbox execution completed. No malicious patterns detected.
                </p>
              </div>

              {/* Runtime Log */}
              <div>
                <p className="text-xs text-text-secondary uppercase mb-2">Runtime Log</p>
                <pre className="bg-surface-secondary border border-border rounded p-4 text-xs overflow-x-auto text-text-secondary max-h-32">
{`[INFO] Starting Node.js execution
[INFO] Version: 18.16.0
[INFO] Dependencies installed successfully
[INFO] Tests passed: 42/42
[INFO] Execution completed in 2.3s
[SUCCESS] No security issues detected`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-surface-secondary border border-border rounded hover:bg-border transition text-text-primary"
          >
            Close
          </button>
          <button className="px-4 py-2 bg-accent hover:bg-accent-alt text-background rounded font-medium transition">
            Update Incident
          </button>
        </div>
      </div>
    </div>
  )
}
