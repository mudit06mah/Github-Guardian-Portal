"use client"

import { Search } from "lucide-react"
import { useState } from "react"

interface DashboardHeaderProps {
  user: {
    github_username: string
  }
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div>
        <h2 className="text-4xl font-bold text-balance mb-2">
          Hello, <span className="text-accent">{user.github_username}</span>!
        </h2>
        <p className="text-text-secondary">Welcome back to your security dashboard</p>
      </div>

      <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-4 py-3 max-w-md hover:border-accent/50 transition-colors group">
        <Search size={18} className="text-text-secondary group-hover:text-accent transition-colors" />
        <input
          type="text"
          placeholder="Search repositories or incidents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="bg-transparent flex-1 outline-none text-text-primary placeholder:text-text-secondary"
        />
      </div>
    </div>
  )
}
