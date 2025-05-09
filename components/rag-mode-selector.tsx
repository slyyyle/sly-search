"use client"

import type React from "react"

import { Database, Globe, Zap, Crosshair, WandSparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface RagModeSelectorProps {
  value: string
  onChange: (value: string) => void
  compact?: boolean
}

const RagModeSelector: React.FC<RagModeSelectorProps> = ({ value, onChange, compact = false }) => {
  // Define gradient backgrounds for each position
  const gradientClasses: { [key: string]: string } = {
    web: "themed-gradient-transparent", // Blue to Red (now themeable transparent)
    precise: "themed-gradient-transparent", // Green to Blue (now themeable transparent)
    creative: "themed-gradient-transparent", // Purple to Pink (now themeable transparent)
  }

  const sources = [
    { id: "web", label: "", icon: Zap, color: "text-[#176BEF]" }, // Google Blue
    { id: "precise", label: "", icon: Crosshair, color: "text-green-500" }, // Green
    { id: "creative", label: "", icon: WandSparkles, color: "text-purple-500" }, // Purple
  ]

  return (
    <div
      className={cn(
        "flex themed-gradient-border rounded-md p-1",
        compact ? "h-8" : "h-10",
        "min-w-fit", // Ensure container is wide enough for content
      )}
      style={{ backgroundColor: "#000000" }} // Solid black background
    >
      {sources.map((option) => {
        const isActive = value === option.id
        const Icon = option.icon

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "flex items-center justify-center transition-all duration-200 rounded-sm whitespace-nowrap",
              compact ? "text-xs px-2" : "text-sm px-3",
              isActive ? gradientClasses[option.id as keyof typeof gradientClasses] : "hover:bg-[#176BEF]/20",
            )}
            style={{
              flex: "1 1 auto",
            }}
          >
            <Icon
              className={cn("transition-all", compact ? "h-3 w-3" : "h-4 w-4", isActive ? "text-white" : option.color)}
            />

            {(option.label || !compact) && (
              <span className={cn("ml-1.5", isActive ? "text-white font-medium" : "opacity-90")}>{option.label}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default RagModeSelector
