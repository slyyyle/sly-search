"use client"

import { useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface TerminalEntry {
  timestamp: string
  category: string
  content: string
}

interface TerminalViewProps {
  entries: TerminalEntry[]
  className?: string
}

export function TerminalView({ entries, className }: TerminalViewProps) {
  const terminalRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when entries change
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [entries])

  return (
    <div className={cn("bg-gray-900 border border-gray-800 rounded-lg overflow-hidden font-mono text-sm", className)}>
      <div className="flex items-center px-4 py-2 bg-gray-800 border-b border-gray-700">
        <div className="flex space-x-2 mr-4">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <span className="text-gray-400">SlySearch Terminal</span>
      </div>

      <div ref={terminalRef} className="p-4 max-h-80 overflow-y-auto">
        {entries.map((entry, index) => (
          <div key={index} className="mb-4">
            <div className="flex items-center text-xs mb-1">
              <span className="text-gray-500">[{entry.timestamp}]</span>
              <span
                className={cn(
                  "ml-2 px-1.5 py-0.5 rounded text-xs font-medium",
                  entry.category === "API" && "bg-blue-900/50 text-blue-400",
                  entry.category === "Response" && "bg-green-900/50 text-green-400",
                  entry.category === "Structure" && "bg-purple-900/50 text-purple-400",
                  entry.category === "Info" && "bg-yellow-900/50 text-yellow-400",
                )}
              >
                {entry.category}
              </span>
            </div>
            <div className="pl-4 border-l-2 border-gray-700">
              <pre className="whitespace-pre-wrap text-gray-300">{entry.content}</pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
