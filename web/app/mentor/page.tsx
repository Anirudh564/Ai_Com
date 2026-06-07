"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

type Message = {
  role: "user" | "assistant"
  content: string
  id: string
}

export default function MentorPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "I'm Aether — your communication mentor. Tell me what you're working on: a tough conversation, a presentation, an interview, or a moment where you felt your voice slipped."
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'll help you improve your communication skills. Let's work on this together."
      }
      setMessages(prev => [...prev, aiResponse])
      setIsLoading(false)
    }, 1000)
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Aether - Your Communication Mentor</h1>
          <p className="text-muted-foreground">Chat with your AI communication coach</p>
        </div>
        
        <Card className="h-[calc(100vh-200px)] flex flex-col card-shadow">
          <CardContent className="flex-1 overflow-y-auto p-4">
            <div className="space-y-4" ref={scrollRef}>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[80%] ${
                    msg.role === "user" 
                      ? "ml-auto flex flex-col items-end" 
                      : "mr-auto"
                  }`}
                >
                  {msg.role === "assistant" && (
                    <Badge variant="secondary" className="mb-1">Aether</Badge>
                  )}
                  <div
                    className={`rounded-lg px-4 py-3 ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="mr-auto">
                  <Badge variant="secondary" className="mb-1">Aether</Badge>
                  <div className="rounded-lg px-4 py-3 bg-muted">
                    <span className="animate-pulse">...</span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about your communication..."
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
            Send
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}