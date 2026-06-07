"use client"

import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function UserNav() {
  const { user, logout } = useAuth()
  
  return (
    <div className="flex items-center gap-4">
      <div className="text-right">
        <div className="text-sm font-medium">{user?.name || "User"}</div>
        <div className="text-xs text-muted-foreground">Level {user?.level || 1} • {user?.xp || 0} XP</div>
      </div>
      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-semibold shadow-md">
        {user?.picture ? (
          <img src={user.picture} alt={user.name || "User"} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          (user?.name?.charAt(0) || "U")
        )}
      </div>
    </div>
  )
}