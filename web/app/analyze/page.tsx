"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function AnalyzePage() {
  const [transcript, setTranscript] = useState("")
  const [context, setContext] = useState("general")
  const [result, setResult] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)

  const analyzeSpeech = async () => {
    if (!transcript.trim()) return
    setIsLoading(true)
    setTimeout(() => {
      setResult({
        overall_score: 85,
        voice_score: 78,
        confidence_score: 82,
        structure_score: 90,
        strengths: ["Clear organization", "Good pace"],
        weaknesses: ["Needs more energy"],
        mistakes: [],
        recommended_drills: ["Voice modulation exercise"]
      })
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <CardTitle className="text-2xl">Speech Analysis</CardTitle>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Analyze Your Speech</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transcript">Transcript</Label>
                <Textarea
                  id="transcript"
                  placeholder="Paste your speech transcript or record below..."
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  className="min-h-[150px]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="context">Context</Label>
                <Select value={context} onValueChange={setContext}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select context" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Speech</SelectItem>
                    <SelectItem value="presentation">Presentation</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="debate">Debate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={analyzeSpeech} disabled={isLoading || !transcript.trim()}>
                {isLoading ? "Analyzing..." : "Analyze Speech"}
              </Button>
            </CardContent>
          </Card>
          
          {result && (
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold">{result.overall_score}</div>
                    <div className="text-sm text-muted-foreground">Overall Score</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium">{result.voice_score}</div>
                      <div className="text-sm text-muted-foreground">Voice</div>
                    </div>
                    <div>
                      <div className="font-medium">{result.confidence_score}</div>
                      <div className="text-sm text-muted-foreground">Confidence</div>
                    </div>
                    <div>
                      <div className="font-medium">{result.structure_score}</div>
                      <div className="text-sm text-muted-foreground">Structure</div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium">Strengths</div>
                    <ul className="text-sm text-muted-foreground">
                      {result.strengths.map((s: string) => <li key={s}>• {s}</li>)}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}