"use client"

import { useState, useEffect } from "react"
import { api } from "@/lib/api-client"
import { Plus, GitBranch, Trash2, Loader } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"

interface Repository {
  id: string
  full_name: string
  is_active: boolean
  created_at: string
}

interface RepositoryCardProps {
  userId: string
}

export default function RepositoryCard({ userId }: RepositoryCardProps) {
  const { toast } = useToast()
  const [repos, setRepos] = useState<Repository[]>([])
  const [newRepoUrl, setNewRepoUrl] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  useEffect(() => {
    const fetchRepos = async () => {
      try {
        const token = localStorage.getItem("token")
        const data = await api.repos.list(userId, token || undefined)
        setRepos(data)
      } catch (error) {
        console.error("[v0] Error fetching repositories:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchRepos()
  }, [userId])

  const handleAddRepository = async () => {
    if (!newRepoUrl.trim()) return

    setIsAdding(true)
    try {
      const token = localStorage.getItem("token")
      const repo = await api.repos.create(userId, newRepoUrl, token || undefined)
      setRepos([...repos, repo])
      setNewRepoUrl("")
      toast({ title: "Success", description: "Repository added successfully" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add repository", variant: "destructive" })
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteRepository = async (repoId: string) => {
    if (!confirm("Are you sure you want to remove this repository?")) return

    try {
      const token = localStorage.getItem("token")
      await api.repos.delete(repoId, token || undefined)
      setRepos(repos.filter((r) => r.id !== repoId))
      toast({ title: "Success", description: "Repository removed" })
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete repository", variant: "destructive" })
    }
  }

  return (
    <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Repository Tracking</h3>

      <div className="space-y-2">
        <label className="block text-sm text-text-secondary font-medium">Add New Repository</label>
        <div className="flex gap-2">
          <Input
            type="text"
            value={newRepoUrl}
            onChange={(e) => setNewRepoUrl(e.target.value)}
            placeholder="owner/repository"
            disabled={isAdding}
            onKeyPress={(e) => e.key === "Enter" && handleAddRepository()}
            className="flex-1 bg-surface-secondary border-border text-text-primary placeholder:text-text-secondary focus:border-accent"
          />
          <Button
            onClick={handleAddRepository}
            disabled={isAdding || !newRepoUrl.trim()}
            className="bg-accent hover:bg-accent-alt text-background"
          >
            {isAdding ? <Loader size={18} className="animate-spin" /> : <Plus size={18} />}
          </Button>
        </div>
      </div>

      {/* Repositories List */}
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader className="animate-spin text-text-secondary" />
          </div>
        ) : repos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-text-secondary text-sm">No repositories tracked yet</p>
          </div>
        ) : (
          repos.map((repo) => (
            <div
              key={repo.id}
              className="flex items-center gap-3 p-3 bg-surface-secondary border border-border rounded-lg hover:bg-border/50 transition group"
            >
              <GitBranch size={18} className="text-accent flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{repo.full_name}</p>
                <p className="text-xs text-text-secondary">Active</p>
              </div>
              <button
                onClick={() => handleDeleteRepository(repo.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-text-secondary hover:text-high rounded transition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
