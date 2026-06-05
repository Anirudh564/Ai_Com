"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

export default function DebatePage() {
  const [topic, setTopic] = useState("")
  const [debate, setDebate] = useState<any>(null)
  const [userArgument, setUserArgument] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const startDebate = () => {
    if (!topic.trim()) return
    setIsLoading(true)
    setTimeout(() => {
      setDebate({
        id: "deb_1",
        topic,
        user_stance: "for",
        ai_stance: "against",
        turns: [
          { role: "ai", content: `I challenge your position on "${topic}". How do you defend this?` }
        ]
      })
      setIsLoading(false)
    }, 1000)
  }

  const submitArgument = () => {
    if (!userArgument.trim() || !debate) return
    setUserArgument("")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <CardTitle className="text-2xl">Debate Practice</CardTitle>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        {!debate ? (
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Start a Debate</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="topic">Topic</Label>
                <Input
                  id="topic"
                  placeholder="e.g., Social media should be regulated"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>
              <Button onClick={startDebate} disabled={isLoading || !topic.trim()}>
                {isLoading ? "Starting..." : "Start Debate"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-[calc(100vh-200px)]">
            <CardHeader>
              <CardTitle className="text-lg">{debate.topic}</CardTitle>
              <Badge>You: {debate.user_stance} | AI: {debate.ai_stance}</Badge>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {debate.turns.map((turn: any, i: number) => (
                  <div key={i} className={`max-w-[80%] ${turn.role === "user" ? "ml-auto" : ""}`}>
                    <div className="rounded-lg px-4 py-3 bg-muted">
                      {turn.content}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={userArgument}
                  onChange={(e) => setUserArgument(e.target.value)}
                  placeholder="Your argument..."
                  onKeyPress={(e) => e.key === "Enter" && submitArgument()}
                />
                <Button onClick={submitArgument} disabled={!userArgument.trim()}>
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}