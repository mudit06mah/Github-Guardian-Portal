const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api"

interface ApiError {
  message: string
  status: number
}

export async function apiCall(
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data?: any,
  token?: string,
): Promise<any> {
  const url = `${API_URL}${endpoint}`

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Unknown error" }))
      throw {
        message: error.detail || "API request failed",
        status: response.status,
      } as ApiError
    }

    return await response.json()
  } catch (error: any) {
    if (error.message) throw error
    throw {
      message: error.message || "Network error",
      status: 0,
    } as ApiError
  }
}

export const api = {
  auth: {
    signup: (email: string, password: string) => apiCall("/auth/signup", "POST", { email, password }),
    loginWithPassword: (email: string, password: string) => apiCall("/auth/login", "POST", { email, password }),
    getUser: (userId: string, token: string) => apiCall(`/auth/user/${userId}`, "GET", undefined, token),
    getGitHubStatus: (userId: string, token?: string) =>
      apiCall(`/auth/github/app-status/${userId}`, "GET", undefined, token),
  },

  repos: {
    list: (userId: string, token?: string) => apiCall(`/repos?user_id=${userId}`, "GET", undefined, token),
    create: (userId: string, fullName: string, token?: string) =>
      apiCall(`/repos?user_id=${userId}`, "POST", { full_name: fullName }, token),
    delete: (repoId: string, token?: string) => apiCall(`/repos/${repoId}`, "DELETE", undefined, token),
    get: (repoId: string, token?: string) => apiCall(`/repos/${repoId}`, "GET", undefined, token),
    available: (userId: string, token?: string) => apiCall(`/repos/available/${userId}`, "GET", undefined, token),
  },

  incidents: {
    dashboard: (userId: string, token?: string) =>
      apiCall(`/incidents/dashboard?user_id=${userId}`, "GET", undefined, token),
    list: (userId: string, token?: string) => apiCall(`/incidents?user_id=${userId}`, "GET", undefined, token),
    create: (repoId: string, incident: any, token?: string) => apiCall(`/incidents/${repoId}`, "POST", incident, token),
    get: (incidentId: string, token?: string) => apiCall(`/incidents/${incidentId}`, "GET", undefined, token),
    updateStatus: (incidentId: string, status: string, token?: string) =>
      apiCall(`/incidents/${incidentId}/status`, "PUT", { status }, token),
  },

  sandbox: {
    get: (incidentId: string, token?: string) => apiCall(`/sandbox/${incidentId}`, "GET", undefined, token),
    execute: (incidentId: string, snippet: string, token?: string) =>
      apiCall(`/sandbox/${incidentId}`, "POST", { snippet_executed: snippet, verdict: "Unknown" }, token),
  },
}
