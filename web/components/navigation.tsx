"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, MessageCircle, Mic, Calendar, Mic2, User, Settings } from "lucide-react"

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/mentor", icon: MessageCircle, label: "Mentor" },
  { href: "/analyze", icon: Mic, label: "Analyze" },
  { href: "/debate", icon: Calendar, label: "Debate" },
  { href: "/interview", icon: Mic2, label: "Interview" },
  { href: "/missions", icon: Calendar, label: "Missions" },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex flex-col gap-2 px-4 py-6">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}