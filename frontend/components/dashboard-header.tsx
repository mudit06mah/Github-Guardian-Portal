'use client'

import { Search, Bell } from 'lucide-react'

interface DashboardHeaderProps {
  user: {
    github_username: string
  }
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <div>
        <h2 className="text-4xl font-bold text-balance mb-2">
          Hello, <span className="text-accent">{user.github_username}</span>!
        </h2>
        <p className="text-text-secondary">Welcome back to your security dashboard</p>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 bg-surface border border-border rounded px-4 py-2 max-w-md">
        <Search size={18} className="text-text-secondary" />
        <input
          type="text"
          placeholder="Search repositories or incidents..."
          className="bg-transparent flex-1 outline-none text-text-primary placeholder:text-text-secondary"
        />
      </div>
    </div>
  )
}
