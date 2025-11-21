"use client"

import { useState, useCallback } from "react"

export interface Toast {
  id: string
  title: string
  description?: string
  variant?: "default" | "destructive"
  duration?: number
}

let toastCount = 0
const toasts: Toast[] = []

export function useToast() {
  const [, setToastState] = useState<Toast[]>([])

  const toast = useCallback((props: Omit<Toast, "id">) => {
    const id = String(++toastCount)
    const newToast: Toast = {
      id,
      ...props,
      duration: props.duration || 3000,
    }

    toasts.push(newToast)
    setToastState([...toasts])

    if (newToast.duration) {
      setTimeout(() => {
        toasts.splice(toasts.indexOf(newToast), 1)
        setToastState([...toasts])
      }, newToast.duration)
    }

    return {
      dismiss: () => {
        toasts.splice(toasts.indexOf(newToast), 1)
        setToastState([...toasts])
      },
    }
  }, [])

  return { toast, toasts }
}
