"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import DashboardHeader from "@/components/dashboard-header"
import MetricsGrid from "@/components/metrics-grid"
import RepositoryCard from "@/components/repository-card"
import IncidentsFeed from "@/components/incidents-feed"

interface User {
  id: string
  email: string
  created_at?: string
}

export default function Dashboard() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [appInstalled, setAppInstalled] = useState(false)

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
      checkAppInstallation(user.id)
    } catch (error) {
      router.push("/login")
    }
  }, [router])

  const checkAppInstallation = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:8000/api/auth/github/app-status/${userId}`)
      if (response.ok) {
        const data = await response.json()
        setAppInstalled(data.app_installed)

        if (!data.app_installed) {
          router.push("/setup")
          return
        }
      }
    } catch (error) {
      console.error("[v0] Error checking app status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading || !currentUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar - derive github_username from email */}
      <Sidebar user={{ ...currentUser, github_username: currentUser.email.split("@")[0] }} />

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 space-y-6">
          {/* Header Section */}
          <DashboardHeader user={{ github_username: currentUser.email.split("@")[0] }} />

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
