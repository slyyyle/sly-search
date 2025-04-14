"use client"

import type React from "react"

import { Database, Globe, Zap } from "lucide-react"
import { cn } from "@/lib/utils"

interface RagModeSelectorProps {
  value: string
  onChange: (value: string) => void
  compact?: boolean
}

const RagModeSelector: React.FC<RagModeSelectorProps> = ({ value, onChange, compact = false }) => {
  // Define gradient backgrounds for each position
  const activeBackgrounds = {
    normal: "bg-gradient-to-r from-[#176BEF]/70 to-[#FF3E30]/70", // Blue to Red
    local: "bg-gradient-to-r from-[#FF3E30]/70 to-[#F7B529]/70", // Red to Yellow
    web: "bg-gradient-to-r from-[#F7B529]/70 to-[#179C52]/70", // Yellow to Green
  }

  const options = [
    { id: "normal", label: "", icon: Zap, color: "text-[#176BEF]" }, // Google Blue
    { id: "local", label: "Local", icon: Database, color: "text-[#F7B529]" }, // Google Yellow
    { id: "web", label: "Web", icon: Globe, color: "text-white" },
  ]

  return (
    <div
      className={cn(
        "flex google-gradient-border rounded-md p-1",
        compact ? "h-8" : "h-10",
        "min-w-fit", // Ensure container is wide enough for content
      )}
      style={{ backgroundColor: "#000000" }} // Solid black background
    >
      {options.map((option) => {
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
              isActive ? activeBackgrounds[option.id as keyof typeof activeBackgrounds] : "hover:bg-[#176BEF]/20",
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
