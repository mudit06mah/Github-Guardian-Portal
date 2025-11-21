"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"
import { Loader2, AlertCircle, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

function SetupContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [userId, setUserId] = useState<string>("")
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationComplete, setVerificationComplete] = useState(false)
  
  // Check for error param coming back from backend
  const error = searchParams.get("error")
  const installationId = searchParams.get("installation_id")
  const setupAction = searchParams.get("setup_action")
  const state = searchParams.get("state")

  useEffect(() => {
    const user = localStorage.getItem("user")
    if (!user) {
      router.push("/login")
      return
    }
    const userData = JSON.parse(user)
    setUserId(userData.id)
  }, [router])

  // When page loads with installation_id params, verify with backend
  useEffect(() => {
    if (installationId && setupAction && state && !isVerifying) {
      console.log("Verifying installation with ID:", installationId)
      verifyInstallation()
    }
  }, [installationId, setupAction, state])

  const verifyInstallation = async () => {
    setIsVerifying(true)
    toast({
      title: "Verifying Installation",
      description: "Confirming your GitHub App installation...",
    })

    try {
      const response = await fetch(
        `http://localhost:8000/api/auth/github/callback?` +
        `installation_id=${installationId}&` +
        `setup_action=${setupAction}&` +
        `state=${state}`,
        {
          method: "GET",
        }
      )

      if (!response.ok) {
        throw new Error("Failed to verify installation")
      }

      const data = await response.json()
      
      setVerificationComplete(true)
      toast({
        title: "Success!",
        description: "GitHub App installed successfully. Redirecting to dashboard...",
        variant: "default",
      })

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/")
      }, 2000)
    } catch (error) {
      console.error("Verification failed:", error)
      toast({
        title: "Verification Failed",
        description: "Failed to verify your installation. Please try again.",
        variant: "destructive",
      })
      setIsVerifying(false)
    }
  }

  const handleInstallApp = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(
        `http://localhost:8000/api/auth/github/app/authorize?user_id=${userId}`
      )
      const data = await res.json()

      // Redirect to GitHub
      window.location.href = data.authorization_url
    } catch (error) {
      console.error("Failed to get auth URL", error)
      toast({
        title: "Error",
        description: "Failed to initialize GitHub installation",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  // Show verifying state
  if (isVerifying || verificationComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-lg p-8 space-y-6 text-center">
            {verificationComplete ? (
              <>
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Installation Confirmed!
                  </h2>
                  <p className="text-muted-foreground">
                    Redirecting to dashboard...
                  </p>
                </div>
              </>
            ) : (
              <>
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
                <div>
                  <h2 className="text-xl font-bold text-foreground mb-2">
                    Verifying Installation
                  </h2>
                  <p className="text-muted-foreground">
                    Please wait while we confirm your GitHub App installation...
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2 text-foreground">Setup Guardian</h1>
          <p className="text-muted-foreground">Install the GitHub App to get started</p>
        </div>

        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          {error && (
            <div className="bg-destructive/10 text-destructive p-3 rounded flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              <span>Installation failed. Please try again.</span>
            </div>
          )}

          <div className="bg-muted p-4 rounded text-sm text-foreground">
            <p className="mb-3">
              Click below to install the Guardian Portal on your GitHub account.
            </p>
            <Button
              onClick={handleInstallApp}
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground hover:opacity-90 font-semibold py-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting...
                </>
              ) : (
                "Install GitHub App"
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SetupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetupContent />
    </Suspense>
  )
}