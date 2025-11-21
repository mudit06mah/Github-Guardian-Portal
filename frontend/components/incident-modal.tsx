'use client'

import { X, Code, CheckCircle, AlertTriangle, Loader } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '@/lib/api-client'
import { Button } from '@/components/ui/button'

interface Incident {
  id: string
  workflow_path: string
  severity: 'Low' | 'Medium' | 'High' | 'Ambiguous'
  finding_type: string
  description: string
  status: string
  pr_number: number | null
  created_at: string
}

interface SandboxRun {
  id: string
  snippet_executed: string
  verdict: string
  runtime_log: string | null
  completed_at: string | null
}

interface IncidentModalProps {
  incident: Incident
  userId: string
  onClose: () => void
}

export default function IncidentModal({ incident, userId, onClose }: IncidentModalProps) {
  const [status, setStatus] = useState(incident.status)
  const [sandboxRun, setSandboxRun] = useState<SandboxRun | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [codeSnippet, setCodeSnippet] = useState('')

  useEffect(() => {
    const fetchSandboxRun = async () => {
      try {
        const token = localStorage.getItem('token')
        const data = await api.sandbox.get(incident.id, token || undefined)
        setSandboxRun(data)
      } catch (error) {
        // No sandbox run yet
      }
    }
    
    fetchSandboxRun()
  }, [incident.id])

  const handleExecuteSnippet = async () => {
    if (!codeSnippet.trim()) {
      alert('Please enter a code snippet')
      return
    }
    
    setIsExecuting(true)
    try {
      const token = localStorage.getItem('token')
      const result = await api.sandbox.execute(incident.id, codeSnippet, token || undefined)
      setSandboxRun(result)
    } catch (error: any) {
      alert(error.message || 'Failed to execute snippet')
    } finally {
      setIsExecuting(false)
    }
  }

  const handleUpdateStatus = async () => {
    setIsUpdating(true)
    try {
      const token = localStorage.getItem('token')
      await api.incidents.updateStatus(incident.id, status, token || undefined)
      alert('Incident status updated')
    } catch (error: any) {
      alert(error.message || 'Failed to update incident')
    } finally {
      setIsUpdating(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'High':
        return 'text-red-400'
      case 'Medium':
        return 'text-yellow-400'
      case 'Low':
        return 'text-green-400'
      case 'Ambiguous':
        return 'text-purple-400'
      default:
        return 'text-muted-foreground'
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case 'Safe':
        return 'text-green-400 bg-green-500/10'
      case 'Unsafe':
        return 'text-red-400 bg-red-500/10'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full my-8">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card">
          <div>
            <h2 className="text-xl font-bold text-card-foreground">{incident.workflow_path}</h2>
            <p className="text-sm text-muted-foreground mt-1">{incident.finding_type}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-secondary rounded transition text-card-foreground"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Incident Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1 font-semibold">Severity</p>
              <p className={`text-lg font-semibold ${getSeverityColor(incident.severity)}`}>{incident.severity}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1 font-semibold">Status</p>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-secondary border border-border rounded px-3 py-2 text-card-foreground text-sm"
              >
                <option>Open</option>
                <option>Fixed</option>
                <option>Dismissed</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1 font-semibold">PR Number</p>
              <p className="text-lg font-semibold text-primary">
                {incident.pr_number ? `#${incident.pr_number}` : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase mb-1 font-semibold">Date</p>
              <p className="text-sm text-card-foreground">{new Date(incident.created_at).toLocaleDateString()}</p>
            </div>
          </div>

          {/* Description */}
          <div>
            <p className="text-sm font-semibold text-card-foreground mb-2">Description</p>
            <p className="text-sm text-muted-foreground bg-secondary rounded p-4">
              {incident.description}
            </p>
          </div>

          {/* Sandbox Orchestration */}
          <div className="border-t border-border pt-6">
            <h3 className="font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <Code size={18} />
              Sandbox Orchestration
            </h3>

            <div className="space-y-4">
              {/* Code Snippet Input */}
              <div>
                <p className="text-xs text-muted-foreground uppercase mb-2 font-semibold">Execute Code Snippet</p>
                <textarea
                  value={codeSnippet}
                  onChange={(e) => setCodeSnippet(e.target.value)}
                  placeholder="Enter Python code to execute in sandbox..."
                  className="w-full bg-secondary border border-border rounded p-3 text-xs text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary h-32 font-mono"
                />
                <Button
                  onClick={handleExecuteSnippet}
                  disabled={isExecuting}
                  className="mt-2 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isExecuting ? <Loader size={16} className="animate-spin mr-2" /> : <Code size={16} className="mr-2" />}
                  {isExecuting ? 'Executing...' : 'Execute'}
                </Button>
              </div>

              {/* Verdict */}
              {sandboxRun && (
                <>
                  <div className={`rounded p-4 border border-border ${getVerdictColor(sandboxRun.verdict)}`}>
                    <div className="flex items-center gap-3 mb-2">
                      {sandboxRun.verdict === 'Safe' ? (
                        <CheckCircle size={20} />
                      ) : (
                        <AlertTriangle size={20} />
                      )}
                      <p className="font-semibold">Verdict: {sandboxRun.verdict}</p>
                    </div>
                    <p className="text-xs">
                      {sandboxRun.verdict === 'Safe' ? 'No malicious patterns detected.' : 'Potential security issue detected.'}
                    </p>
                  </div>

                  {/* Runtime Log */}
                  <div>
                    <p className="text-xs text-muted-foreground uppercase mb-2 font-semibold">Runtime Log</p>
                    <pre className="bg-secondary border border-border rounded p-4 text-xs overflow-x-auto text-muted-foreground max-h-32 font-mono">
                      {sandboxRun.runtime_log || 'No logs available'}
                    </pre>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-border">
          <Button
            onClick={onClose}
            variant="outline"
          >
            Close
          </Button>
          <Button
            onClick={handleUpdateStatus}
            disabled={isUpdating || status === incident.status}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isUpdating ? <Loader size={16} className="animate-spin mr-2" /> : null}
            {isUpdating ? 'Updating...' : 'Update Status'}
          </Button>
        </div>
      </div>
    </div>
  )
}
