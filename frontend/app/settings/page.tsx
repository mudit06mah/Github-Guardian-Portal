"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { UserIcon, Bell, Shield, Github, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"

interface User {
  id: string
  email: string
  created_at?: string
}

interface GitHubInstallation {
  app_installed: boolean
  installation_id?: number
  token_expires_at?: string
}

export default function SettingsPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [githubStatus, setGithubStatus] = useState<GitHubInstallation | null>(null)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [slackNotifications, setSlackNotifications] = useState(false)

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
      fetchGitHubStatus(user.id)
    } catch (error) {
      router.push("/login")
    }
  }, [router])

  const fetchGitHubStatus = async (userId: string) => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `http://localhost:8000/api/auth/github/app-status/${userId}`,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )
      if (response.ok) {
        const data = await response.json()
        setGithubStatus(data)
        console.log("GitHub Status:", data)
      }
    } catch (error) {
      console.error("[v0] Error fetching GitHub status:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    })
    router.push("/login")
  }

  const handleRefreshToken = async () => {
    if (!currentUser) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `http://localhost:8000/api/auth/github/refresh-token/${currentUser.id}`,
        {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      )

      if (response.ok) {
        toast({
          title: "Success",
          description: "Token refreshed successfully",
        })
        fetchGitHubStatus(currentUser.id)
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to refresh token",
        variant: "destructive",
      })
    }
  }

  if (!currentUser || isLoading) {
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
        <div className="p-6 space-y-6 max-w-4xl">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
            <p className="text-muted-foreground">Manage your account and preferences</p>
          </div>

          {/* Account Section */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <UserIcon size={20} className="text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Account</h2>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Email</label>
                <p className="text-foreground mt-1">{currentUser.email}</p>
              </div>

              {currentUser.created_at && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-foreground mt-1">
                    {new Date(currentUser.created_at).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              )}

              <div className="pt-4">
                <Button onClick={handleLogout} variant="destructive">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          {/* GitHub Integration Section */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Github size={20} className="text-primary" />
              <h2 className="text-xl font-semibold text-foreground">GitHub Integration</h2>
            </div>

            {githubStatus?.app_installed ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                  <Shield size={20} className="text-green-500" />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">GitHub App Connected</p>
                    {githubStatus.installation_id && (
                      <p className="text-sm text-muted-foreground">
                        Installation ID: {githubStatus.installation_id}
                      </p>
                    )}
                  </div>
                </div>

                {githubStatus.token_expires_at && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Token Expires</label>
                    <p className="text-foreground mt-1">
                      {new Date(githubStatus.token_expires_at).toLocaleString()}
                    </p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button onClick={handleRefreshToken} variant="outline">
                    Refresh Token
                  </Button>
                  {githubStatus.installation_id && (
                    <Button
                      onClick={() =>
                        window.open(
                          `https://github.com/settings/installations/${githubStatus.installation_id}`,
                          "_blank"
                        )
                      }
                      variant="outline"
                    >
                      <ExternalLink size={16} className="mr-2" />
                      Manage on GitHub
                    </Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <p className="text-foreground mb-2">GitHub App not installed</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Install the GitHub App to start monitoring your repositories
                </p>
                <Button onClick={() => router.push("/setup")}>Install GitHub App</Button>
              </div>
            )}
          </div>

          {/* Notifications Section */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <Bell size={20} className="text-primary" />
              <h2 className="text-xl font-semibold text-foreground">Notifications</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Email Notifications</p>
                  <p className="text-sm text-muted-foreground">Receive security alerts via email</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={emailNotifications}
                    onChange={(e) => setEmailNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border">
                <div>
                  <p className="font-medium text-foreground">Slack Notifications</p>
                  <p className="text-sm text-muted-foreground">Send alerts to Slack workspace</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={slackNotifications}
                    onChange={(e) => setSlackNotifications(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}