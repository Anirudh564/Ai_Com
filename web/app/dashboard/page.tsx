"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Your communication progress and daily missions</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Daily Missions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <p className="font-medium">3-Minute Mirror Talk</p>
                  <p className="text-sm text-muted-foreground">Confidence drill</p>
                  <Link href="/mentor">
                    <Button size="sm" className="mt-2 w-full">Start</Button>
                  </Link>
                </div>
                <div className="border rounded-lg p-3 hover:bg-muted/50 transition-colors">
                  <p className="font-medium">Pause Drill</p>
                  <p className="text-sm text-muted-foreground">Pacing drill</p>
                  <Link href="/analyze">
                    <Button size="sm" className="mt-2 w-full">Start</Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Speech Score</span>
                    <span className="font-medium">75%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{width: "75%"}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Confidence</span>
                    <span className="font-medium">82%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{width: "82%"}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Structure</span>
                    <span className="font-medium">68%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{width: "68%"}}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Link href="/mentor">
                  <Button className="w-full">Chat with Aether</Button>
                </Link>
                <Link href="/analyze">
                  <Button variant="outline" className="w-full">Analyze Speech</Button>
                </Link>
                <Link href="/debate">
                  <Button variant="outline" className="w-full">Start Debate</Button>
                </Link>
                <Link href="/interview">
                  <Button variant="outline" className="w-full">Mock Interview</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}