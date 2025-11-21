"use client"

import { useEffect, useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { X } from "lucide-react"

export default function ToastContainer() {
  const { toasts } = useToast()
  const [displayedToasts, setDisplayedToasts] = useState<any[]>([])

  useEffect(() => {
    setDisplayedToasts(toasts)
  }, [toasts])

  const removeToast = (id: string) => {
    setDisplayedToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none">
      {displayedToasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto animate-in slide-in-from-right-full duration-200 flex items-start gap-3 p-4 rounded-lg border ${
            toast.variant === "destructive"
              ? "bg-high/10 border-high text-high"
              : "bg-accent/10 border-accent text-accent"
          }`}
        >
          <div className="flex-1">
            <p className="font-semibold text-sm">{toast.title}</p>
            {toast.description && <p className="text-xs opacity-90 mt-1">{toast.description}</p>}
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 opacity-50 hover:opacity-100 transition"
          >
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  )
}
