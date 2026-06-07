import { Button } from "../components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 text-center">
          <h1 className="text-3xl font-bold">Elite Communication Mentor</h1>
          <p className="text-muted-foreground mt-2">AI-powered communication coaching for students & young professionals</p>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <h2 className="text-5xl font-bold mb-4">Master Your Communication Skills</h2>
          <p className="text-lg text-muted-foreground mb-6">
            Get personalized coaching from Aether, your AI communication mentor. Practice debates, mock interviews, and daily communication drills.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="/login">
              <Button size="lg">Get Started</Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="outline" size="lg">Watch Demo</Button>
            </Link>
          </div>
        </div>
        
        <div className="grid gap-6 md:grid-cols-3 max-w-4xl mx-auto">
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>AI Mentor</CardTitle>
            </CardHeader>
            <CardContent>
              Chat with Aether for personalized communication coaching and feedback.
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Speech Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              Get detailed feedback on your speech with scores for voice, confidence, and structure.
            </CardContent>
          </Card>
          <Card className="card-shadow">
            <CardHeader>
              <CardTitle>Daily Missions</CardTitle>
            </CardHeader>
            <CardContent>
              Complete daily communication drills to earn XP and maintain streaks.
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}