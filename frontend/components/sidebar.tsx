'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Shield, Home, AlertCircle, GitBranch, Settings, LogOut, Menu, X } from 'lucide-react'

interface SidebarProps {
  user: {
    id: string
    github_username: string
    email: string
  }
}

export default function Sidebar({ user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(true)

  const menuItems = [
    { label: 'Dashboard', icon: Home, href: '/' },
    { label: 'Repositories', icon: GitBranch, href: '/repos' },
    { label: 'Incidents', icon: AlertCircle, href: '/incidents' },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ]

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-surface rounded hover:bg-surface-secondary transition"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 fixed lg:relative w-64 h-screen bg-surface border-r border-border p-6 flex flex-col gap-6 transition-transform duration-300 z-40`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-accent rounded flex items-center justify-center">
            <Shield size={20} className="text-background" />
          </div>
          <div>
            <h1 className="font-bold text-text-primary">GitHub Guardian</h1>
            <p className="text-xs text-text-secondary">Security Portal</p>
          </div>
        </div>

        {/* User Profile */}
        <div className="bg-surface-secondary rounded p-4 border border-border">
          <div className="w-8 h-8 bg-accent rounded-full mb-2"></div>
          <p className="font-medium text-sm">{user.github_username}</p>
          <p className="text-xs text-text-secondary">{user.email}</p>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-4 py-2 text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded transition"
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <button className="flex items-center gap-3 px-4 py-2 text-text-secondary hover:text-high rounded transition w-full">
          <LogOut size={20} />
          <span>Logout</span>
        </button>

        {/* Close button on mobile */}
        <button
          onClick={() => setIsOpen(false)}
          className="lg:hidden mt-4 px-4 py-2 bg-surface-secondary rounded hover:bg-border transition w-full text-sm"
        >
          Close
        </button>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  )
}
