"use client"

import { useState } from "react"

interface SelectProps {
  value: string
  onValueChange: (value: string) => void
}

export function Select({ value, onValueChange }: SelectProps) {
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
          {["general", "presentation", "interview", "debate"].map((v) => (
            <button
              key={v}
              className="w-full px-3 py-2 text-sm hover:bg-accent text-left"
              onClick={() => {
                onValueChange(v)
                setOpen(false)
              }}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function SelectTrigger({ children }: { children: React.ReactNode }) {
  return <div className="w-full">{children}</div>
}

export function SelectValue({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function SelectItem({ value, children, onSelect }: { value: string, children: React.ReactNode, onSelect: (v: string) => void }) {
  return (
    <button
      className="w-full px-3 py-2 text-sm hover:bg-accent text-left"
      onClick={() => onSelect(value)}
    >
      {children}
    </button>
  )
}