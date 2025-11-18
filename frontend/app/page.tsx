'use client'

import { useState } from 'react'
import Sidebar from '@/components/sidebar'
import DashboardHeader from '@/components/dashboard-header'
import MetricsGrid from '@/components/metrics-grid'
import RepositoryCard from '@/components/repository-card'
import IncidentsFeed from '@/components/incidents-feed'

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState({
    id: 'user-123',
    github_username: 'john-doe',
    email: 'john@example.com'
  })

  return (
    <div className="flex h-screen bg-background text-text-primary">
      {/* Sidebar */}
      <Sidebar user={currentUser} />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header Section */}
          <DashboardHeader user={currentUser} />
          
          {/* Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Repository Tracking */}
            <div className="lg:col-span-1">
              <RepositoryCard userId={currentUser.id} />
            </div>
            
            {/* Right Column: Metrics */}
            <div className="lg:col-span-2">
              <MetricsGrid userId={currentUser.id} />
            </div>
          </div>
          
          {/* Incidents Feed */}
          <IncidentsFeed userId={currentUser.id} />
        </div>
      </main>
    </div>
  )
}
