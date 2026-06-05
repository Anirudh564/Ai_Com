import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Elite Communication Mentor</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Level 1 • 0 XP</span>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-semibold">
              U
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Daily Missions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="border rounded-lg p-3">
                  <p className="font-medium">3-Minute Mirror Talk</p>
                  <p className="text-sm text-muted-foreground">Confidence drill</p>
                  <Button size="sm" className="mt-2 w-full">Start</Button>
                </div>
                <div className="border rounded-lg p-3">
                  <p className="font-medium">Pause Drill</p>
                  <p className="text-sm text-muted-foreground">Pacing drill</p>
                  <Button size="sm" className="mt-2 w-full">Start</Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Your Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Speech Score</span>
                    <span>75%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{width: "75%"}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Confidence</span>
                    <span>82%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{width: "82%"}}></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Structure</span>
                    <span>68%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{width: "68%"}}></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button className="w-full" href="/mentor">Chat with Aether</Button>
                <Button variant="outline" className="w-full" href="/analyze">Analyze Speech</Button>
                <Button variant="outline" className="w-full" href="/debate">Start Debate</Button>
                <Button variant="outline" className="w-full" href="/interview">Mock Interview</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}