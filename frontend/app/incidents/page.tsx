"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import IncidentModal from "@/components/incident-modal"
import { api } from "@/lib/api-client"
import { AlertOctagon, AlertTriangle, AlertCircle, Loader2, Search, Filter } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

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

interface User {
  id: string
  email: string
}

export default function IncidentsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [severityFilter, setSeverityFilter] = useState<string>("All")
  const [statusFilter, setStatusFilter] = useState<string>("All")

  useEffect(() => {
    const token = localStorage.getItem("token")
    const userStr = localStorage.getItem("user")

    if (!token || !userStr) {
      router.push("/login")
      return
    }

    try {
      const user = JSON.parse(userStr)
      setCurrentUser(user)
      fetchIncidents(user.id)
    } catch (error) {
      router.push("/login")
    }
  }, [router])

  const fetchIncidents = async (userId: string) => {
    try {
      const token = localStorage.getItem("token")
      const data = await api.incidents.list(userId, token || undefined)
      setIncidents(data)
    } catch (error: any) {
      console.error("[v0] Error fetching incidents:", error)
      toast({
        title: "Error",
        description: "Failed to load incidents",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "High":
        return "text-red-500 bg-red-500/10 border-red-500/30"
      case "Medium":
        return "text-yellow-500 bg-yellow-500/10 border-yellow-500/30"
      case "Low":
        return "text-green-500 bg-green-500/10 border-green-500/30"
      case "Ambiguous":
        return "text-purple-500 bg-purple-500/10 border-purple-500/30"
      default:
        return "text-muted-foreground bg-muted border-border"
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "High":
        return <AlertOctagon size={20} />
      case "Medium":
        return <AlertTriangle size={20} />
      default:
        return <AlertCircle size={20} />
    }
  }

  const filteredIncidents = incidents.filter((incident) => {
    const matchesSearch =
      incident.workflow_path.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.finding_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesSeverity = severityFilter === "All" || incident.severity === severityFilter
    const matchesStatus = statusFilter === "All" || incident.status === statusFilter

    return matchesSearch && matchesSeverity && matchesStatus
  })

  if (!currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar user={{ ...currentUser, github_username: currentUser.email.split("@")[0] }} />

      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Security Incidents</h1>
            <p className="text-muted-foreground">Monitor and manage security findings</p>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-3 flex-1 max-w-md">
              <Search size={18} className="text-muted-foreground" />
              <input
                type="text"
                placeholder="Search incidents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent flex-1 outline-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-muted-foreground" />
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-card border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
              >
                <option>All</option>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
                <option>Ambiguous</option>
              </select>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-card border border-border rounded-lg px-4 py-3 text-foreground focus:outline-none focus:border-primary"
              >
                <option>All</option>
                <option>Open</option>
                <option>Fixed</option>
                <option>Dismissed</option>
              </select>
            </div>
          </div>

          {/* Incidents List */}
          <div>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : filteredIncidents.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <AlertCircle size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No incidents found</p>
                <p className="text-sm text-muted-foreground">
                  {incidents.length === 0 ? "Your repositories are secure!" : "Try adjusting your filters"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredIncidents.map((incident) => (
                  <button
                    key={incident.id}
                    onClick={() => setSelectedIncident(incident)}
                    className="w-full text-left p-5 bg-card border border-border rounded-lg hover:border-primary/50 transition group"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 border ${getSeverityColor(incident.severity)}`}
                        >
                          {getSeverityIcon(incident.severity)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{incident.workflow_path}</h3>
                            {incident.pr_number && (
                              <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded whitespace-nowrap">
                                PR #{incident.pr_number}
                              </span>
                            )}
                            <span
                              className={`text-xs px-2 py-1 rounded ${incident.status === "Open" ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"}`}
                            >
                              {incident.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{incident.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="font-medium">{incident.finding_type}</span>
                            <span>•</span>
                            <span>{new Date(incident.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition">→</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Incident Modal */}
      {selectedIncident && (
        <IncidentModal incident={selectedIncident} userId={currentUser.id} onClose={() => setSelectedIncident(null)} />
      )}
    </div>
  )
}
