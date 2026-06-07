"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
  children?: React.ReactNode
}

export function Select({ value, onValueChange, children }: SelectProps) {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span>{value || "Select..."}</span>
      </button>
      {open && (
        <div className="absolute mt-1 w-full rounded-md border bg-popover shadow-md z-50">
          {children}
        </div>
      )}
    </div>
  )
}

export function SelectTrigger({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("w-full", className)}>{children}</div>
}

export function SelectValue({ children }: { children?: React.ReactNode }) {
  return <span>{children}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

interface SelectItemProps {
  value: string
  children: React.ReactNode
  onSelect?: (v: string) => void
}

export function SelectItem({ value, children, onSelect }: SelectItemProps) {
  const handleClick = () => {
    if (onSelect) {
      onSelect(value)
    }
  }
  return (
    <button
      className="w-full px-3 py-2 text-sm hover:bg-accent text-left"
      onClick={handleClick}
    >
      {children}
    </button>
  )
}