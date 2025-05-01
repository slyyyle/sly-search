"use client"

import { useState } from "react"
import { HelpCircle } from "lucide-react"

interface SettingsTooltipProps {
  content: React.ReactNode
}

export function SettingsTooltip({ content }: SettingsTooltipProps) {
  const [isVisible, setIsVisible] = useState(false)

  return (
    <div className="relative inline-block">
      <button
        className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-muted-foreground hover:text-foreground hover:bg-gray-800"
        onClick={() => setIsVisible(!isVisible)}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        <HelpCircle className="h-3 w-3" />
      </button>

      {isVisible && (
        <div className="absolute z-50 left-6 top-0 w-64 p-2 text-[11px] bg-gray-800 border border-gray-700 rounded-md text-gray-200 shadow-lg">
          {content}
        </div>
      )}
    </div>
  )
}
