"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function InterviewPage() {
  const [interviewType, setInterviewType] = useState("hr")
  const [interview, setInterview] = useState<any>(null)
  const [answer, setAnswer] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const startInterview = () => {
    setIsLoading(true)
    setTimeout(() => {
      setInterview({
        id: "int_1",
        type: interviewType,
        turns: [
          { role: "ai", question: "Tell me about yourself and why you're interested in this position." }
        ],
        finished: false
      })
      setIsLoading(false)
    }, 1000)
  }

  const submitAnswer = () => {
    if (!answer.trim() || !interview) return
    setAnswer("")
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Mock Interviews</h1>
          <p className="text-muted-foreground">Practice your interview skills</p>
        </div>
        
        {!interview ? (
          <Card className="max-w-md card-shadow">
            <CardHeader>
              <CardTitle>Start Mock Interview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type">Interview Type</Label>
                <Select value={interviewType} onValueChange={setInterviewType}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hr" onSelect={(v) => setInterviewType(v)}>HR Interview</SelectItem>
                    <SelectItem value="college" onSelect={(v) => setInterviewType(v)}>College Interview</SelectItem>
                    <SelectItem value="leadership" onSelect={(v) => setInterviewType(v)}>Leadership Interview</SelectItem>
                    <SelectItem value="internship" onSelect={(v) => setInterviewType(v)}>Internship Interview</SelectItem>
                    <SelectItem value="stress" onSelect={(v) => setInterviewType(v)}>Stress Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={startInterview} disabled={isLoading}>
                {isLoading ? "Starting..." : "Start Interview"}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="h-[calc(100vh-200px)] card-shadow">
            <CardHeader>
              <CardTitle className="text-lg">{interview.type.toUpperCase()} Interview</CardTitle>
              <Badge>Question {interview.turns.length}</Badge>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {interview.turns.map((turn: any, i: number) => (
                  <div key={i}>
                    <div className="font-medium mb-2">Interviewer</div>
                    <div className="rounded-lg px-4 py-3 bg-muted max-w-[90%]">
                      {turn.question}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Your answer..."
                  onKeyPress={(e) => e.key === "Enter" && submitAnswer()}
                />
                <Button onClick={submitAnswer} disabled={!answer.trim()}>
                  Submit
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}