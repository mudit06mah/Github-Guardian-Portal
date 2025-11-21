"use client"

import { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import { Shield, Home, AlertCircle, GitBranch, Settings, LogOut, Menu, X } from "lucide-react"
import ThemeToggle from "./theme-toggle"

interface SidebarProps {
  user: {
    id: string
    github_username?: string
    email: string
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  const displayName = user.github_username || user.email.split("@")[0]

  const menuItems = [
    { label: "Dashboard", icon: Home, href: "/" },
    { label: "Repositories", icon: GitBranch, href: "/repositories" },
    { label: "Incidents", icon: AlertCircle, href: "/incidents" },
    { label: "Settings", icon: Settings, href: "/settings" },
  ]

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("user")
    router.push("/login")
  }

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card border border-border rounded hover:bg-secondary transition"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 fixed lg:relative w-64 h-screen bg-card border-r border-border p-6 flex flex-col gap-6 transition-transform duration-300 z-40 overflow-y-auto`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Shield size={20} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-foreground text-sm">GitHub Guardian</h1>
            <p className="text-xs text-muted-foreground">Security Portal</p>
          </div>
        </div>

        {/* User Profile */}
        <div className="bg-secondary rounded p-4 border border-border">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-primary/70 rounded-full mb-3 flex items-center justify-center text-primary-foreground font-bold text-sm">
            {displayName[0].toUpperCase()}
          </div>
          <p className="font-medium text-sm text-foreground">{displayName}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-2.5 rounded transition-colors group ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon
                  size={18}
                  className={isActive ? "text-primary-foreground" : "group-hover:text-primary transition-colors"}
                />
                <span className="text-sm">{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Theme Toggle */}
        <div className="pb-2">
          <ThemeToggle />
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2.5 text-muted-foreground hover:text-destructive rounded transition-colors group w-full text-sm"
        >
          <LogOut size={18} className="group-hover:text-destructive transition-colors" />
          <span>Logout</span>
        </button>

        {/* Close button on mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden mt-4 px-4 py-2 bg-secondary rounded hover:bg-muted transition w-full text-sm text-foreground border border-border"
        >
          Close
        </button>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setIsOpen(false)}></div>}
    </>
  )
}
