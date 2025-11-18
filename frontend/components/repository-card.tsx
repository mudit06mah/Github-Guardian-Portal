'use client'

import { useState } from 'react'
import { Plus, GitBranch } from 'lucide-react'

interface RepositoryCardProps {
  userId: string
}

export default function RepositoryCard({ userId }: RepositoryCardProps) {
  const [repos, setRepos] = useState([
    { id: '1', name: 'vercel/next.js', is_active: true },
    { id: '2', name: 'facebook/react', is_active: true },
    { id: '3', name: 'microsoft/vscode', is_active: true },
  ])
  const [newRepoUrl, setNewRepoUrl] = useState('')

  const handleAddRepository = () => {
    if (newRepoUrl.trim()) {
      setRepos([...repos, { id: Date.now().toString(), name: newRepoUrl, is_active: true }])
      setNewRepoUrl('')
    }
  }

  return (
    <div className="bg-surface border border-border rounded p-6 space-y-4">
      <h3 className="text-lg font-semibold text-text-primary">Repository Tracking</h3>

      {/* Input Section */}
      <div className="space-y-2">
        <label className="block text-sm text-text-secondary">Add New Repository</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={newRepoUrl}
            onChange={(e) => setNewRepoUrl(e.target.value)}
            placeholder="owner/repository"
            className="flex-1 bg-surface-secondary border border-border rounded px-3 py-2 text-text-primary placeholder:text-text-secondary focus:outline-none focus:border-accent"
            onKeyPress={(e) => e.key === 'Enter' && handleAddRepository()}
          />
          <button
            onClick={handleAddRepository}
            className="bg-accent hover:bg-accent-alt text-background px-4 py-2 rounded font-medium flex items-center gap-2 transition"
          >
            <Plus size={18} />
            Add
          </button>
        </div>
      </div>

      {/* Repositories List */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {repos.map((repo) => (
          <div
            key={repo.id}
            className="flex items-center gap-3 p-3 bg-surface-secondary border border-border rounded hover:bg-border transition"
          >
            <GitBranch size={18} className="text-accent flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">{repo.name}</p>
              <p className="text-xs text-text-secondary">Active</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
