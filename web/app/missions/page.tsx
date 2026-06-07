"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function MissionsPage() {
  const [completedMissions, setCompletedMissions] = useState<Set<string>>(new Set())

  const missions = [
    { id: "1", title: "3-Minute Mirror Talk", category: "Confidence", xp: 20, duration: "3 min" },
    { id: "2", title: "Pause Drill", category: "Pacing", xp: 25, duration: "5 min" },
    { id: "3", title: "PREP Story", category: "Structure", xp: 30, duration: "5 min" },
    { id: "4", title: "Filler-Word Hunt", category: "Articulation", xp: 20, duration: "4 min" },
  ]

  const completeMission = (id: string) => {
    setCompletedMissions(prev => new Set([...prev, id]))
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Daily Missions</h1>
          <p className="text-muted-foreground">Complete your daily communication drills</p>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:max-w-3xl">
          {missions.map((mission) => (
            <Card key={mission.id} className={completedMissions.has(mission.id) ? "opacity-50 card-shadow" : "card-shadow"}>
              <CardHeader>
                <CardTitle className="text-lg">{mission.title}</CardTitle>
                <Badge variant="outline">{mission.category}</Badge>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-muted-foreground">{mission.duration}</div>
                    <div className="font-medium">+{mission.xp} XP</div>
                  </div>
                  <Button
                    onClick={() => completeMission(mission.id)}
                    disabled={completedMissions.has(mission.id)}
                  >
                    {completedMissions.has(mission.id) ? "Completed" : "Start"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  )
}