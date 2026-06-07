"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, MessageCircle, Mic, Calendar, Mic2, CalendarDays } from "lucide-react"

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/mentor", icon: MessageCircle, label: "Mentor" },
  { href: "/analyze", icon: Mic, label: "Analyze" },
  { href: "/debate", icon: Calendar, label: "Debate" },
  { href: "/interview", icon: Mic2, label: "Interview" },
  { href: "/missions", icon: CalendarDays, label: "Missions" },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="hidden md:flex flex-col gap-2 px-4 py-6 bg-card border-r border-border min-w-[220px]">
      {navItems.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
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