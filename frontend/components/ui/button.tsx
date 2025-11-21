import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline" | "destructive"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = "default", ...props }, ref) => {
  const baseStyles =
    "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50"

  const variants = {
    default: "bg-accent text-background hover:bg-accent-alt",
    outline: "border border-border bg-background text-text-primary hover:bg-surface-secondary",
    destructive: "bg-high text-background hover:bg-red-600",
  }

  return <button className={cn(baseStyles, variants[variant], className)} ref={ref} {...props} />
})
Button.displayName = "Button"

export { Button }
