"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { api } from "@/lib/api-client"
import { GitBranch, Plus, Trash2, Loader2, Search, ExternalLink, Lock, Unlock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface Repository {
  id: string
  full_name: string
  is_active: boolean
  created_at: string
}

interface AvailableRepo {
  full_name: string
  private: boolean
  description: string
  tracked: boolean
}

interface User {
  id: string
  email: string
}

export default function RepositoriesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [repos, setRepos] = useState<Repository[]>([])
  const [availableRepos, setAvailableRepos] = useState<AvailableRepo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [showAvailable, setShowAvailable] = useState(false)

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
      fetchRepositories(user.id)
    } catch (error) {
      router.push("/login")
    }
  }, [router])

  const fetchRepositories = async (userId: string) => {
    try {
      const token = localStorage.getItem("token")
      const data = await api.repos.list(userId, token || undefined)
      setRepos(data)
    } catch (error: any) {
      console.error("[v0] Error fetching repositories:", error)
      toast({
        title: "Error",
        description: "Failed to load repositories",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAvailableRepositories = async () => {
    if (!currentUser) return

    setIsLoadingAvailable(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`http://localhost:8000/api/repos/available/${currentUser.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) throw new Error("Failed to fetch available repositories")

      const data = await response.json()
      setAvailableRepos(data.repositories || [])
      setShowAvailable(true)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load available repositories",
        variant: "destructive",
      })
    } finally {
      setIsLoadingAvailable(false)
    }
  }

  const handleAddRepository = async (fullName: string) => {
    if (!currentUser) return

    try {
      const token = localStorage.getItem("token")
      const repo = await api.repos.create(currentUser.id, fullName, token || undefined)
      setRepos([...repos, repo])
      setAvailableRepos(availableRepos.map((r) => (r.full_name === fullName ? { ...r, tracked: true } : r)))
      toast({
        title: "Success",
        description: `${fullName} is now being tracked`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add repository",
        variant: "destructive",
      })
    }
  }

  const handleDeleteRepository = async (repoId: string, fullName: string) => {
    if (!confirm(`Stop tracking ${fullName}?`)) return

    try {
      const token = localStorage.getItem("token")
      await api.repos.delete(repoId, token || undefined)
      setRepos(repos.filter((r) => r.id !== repoId))
      setAvailableRepos(availableRepos.map((r) => (r.full_name === fullName ? { ...r, tracked: false } : r)))
      toast({
        title: "Success",
        description: "Repository removed",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove repository",
        variant: "destructive",
      })
    }
  }

  const filteredRepos = repos.filter((repo) => repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()))

  const filteredAvailable = availableRepos.filter((repo) =>
    repo.full_name.toLowerCase().includes(searchQuery.toLowerCase()),
  )

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">Repositories</h1>
              <p className="text-muted-foreground">Manage your tracked repositories</p>
            </div>
            <Button
              onClick={fetchAvailableRepositories}
              disabled={isLoadingAvailable}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isLoadingAvailable ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Browse Available
            </Button>
          </div>

          {/* Search */}
          <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-4 py-3 max-w-md">
            <Search size={18} className="text-muted-foreground" />
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent flex-1 outline-none text-foreground placeholder:text-muted-foreground"
            />
          </div>

          {/* Available Repositories Modal */}
          {showAvailable && (
            <div className="bg-card border border-border rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Available Repositories</h2>
                <Button variant="outline" onClick={() => setShowAvailable(false)}>
                  Close
                </Button>
              </div>
              <div className="grid gap-3 max-h-96 overflow-y-auto">
                {isLoadingAvailable ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-muted-foreground" />
                  </div>
                ) : filteredAvailable.length === 0 ? (
                  <p className="text-center py-8 text-muted-foreground">No repositories found</p>
                ) : (
                  filteredAvailable.map((repo) => (
                    <div
                      key={repo.full_name}
                      className="flex items-center justify-between p-4 bg-secondary border border-border rounded-lg hover:bg-muted/50 transition"
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {repo.private ? (
                          <Lock size={18} className="text-muted-foreground flex-shrink-0 mt-1" />
                        ) : (
                          <Unlock size={18} className="text-muted-foreground flex-shrink-0 mt-1" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{repo.full_name}</p>
                          {repo.description && (
                            <p className="text-sm text-muted-foreground truncate">{repo.description}</p>
                          )}
                        </div>
                      </div>
                      {repo.tracked ? (
                        <span className="text-xs px-3 py-1 bg-primary/20 text-primary rounded-full whitespace-nowrap ml-3">
                          Tracked
                        </span>
                      ) : (
                        <Button
                          onClick={() => handleAddRepository(repo.full_name)}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 ml-3"
                        >
                          <Plus size={16} className="mr-1" />
                          Track
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Tracked Repositories */}
          <div>
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Tracked Repositories ({filteredRepos.length})
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-muted-foreground" />
              </div>
            ) : filteredRepos.length === 0 ? (
              <div className="text-center py-12 bg-card border border-border rounded-lg">
                <GitBranch size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-2">No repositories tracked yet</p>
                <p className="text-sm text-muted-foreground mb-4">Click "Browse Available" to start tracking repositories</p>
                <Button
                  onClick={fetchAvailableRepositories}
                  disabled={isLoadingAvailable}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {isLoadingAvailable ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="mr-2 h-4 w-4" />
                  )}
                  Browse Available Repositories
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRepos.map((repo) => (
                  <div
                    key={repo.id}
                    className="bg-card border border-border rounded-lg p-5 hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                          <GitBranch size={20} className="text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{repo.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(repo.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteRepository(repo.id, repo.full_name)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-destructive rounded transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                      <span
                        className={`text-xs px-2 py-1 rounded ${repo.is_active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}
                      >
                        {repo.is_active ? "Active" : "Inactive"}
                      </span>
                      <a
                        href={`https://github.com/${repo.full_name}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
                      >
                        View on GitHub
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}