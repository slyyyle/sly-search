"use client"

import type React from "react"
import { Database, Globe, Zap, Book, FileText, Brain } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/use-settings"

interface KnowledgeSourceSelectorProps {
  value: string
  onChange: (value: string) => void
  compact?: boolean
  showOnlySelected?: boolean
}

const KnowledgeSourceSelector: React.FC<KnowledgeSourceSelectorProps> = ({
  value,
  onChange,
  compact = false,
  showOnlySelected = false,
}) => {
  const { settings } = useSettings()
  const knowledgeSources = settings.personalSources?.sources || [
    { id: "web", label: "", icon: "Zap", color: "#176BEF" }, // Google Blue
    { id: "local", label: "Local", icon: "Database", color: "#F7B529" }, // Google Yellow
    { id: "global", label: "Web", icon: "Globe", color: "text-white" },
  ]

  // If showOnlySelected is true, filter to only show the selected source
  const displaySources = showOnlySelected ? knowledgeSources.filter((source) => source.id === value) : knowledgeSources

  // Map icon strings to actual components
  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case "Zap":
        return Zap
      case "Brain":
        return Brain
      case "FileText":
        return FileText
      case "Database":
        return Database
      case "Globe":
        return Globe
      case "Book":
        return Book
      default:
        return Zap
    }
  }

  const activeBackgrounds = {
    web: "themed-gradient-transparent",
    local: "themed-gradient-transparent",
    global: "themed-gradient-transparent",
    obsidian: "themed-gradient-transparent",
  }

  return (
    <div
      className={cn(
        "flex themed-gradient-border rounded-md p-1",
        compact ? "h-8" : "h-10",
        "min-w-fit", // Ensure container is wide enough for content
      )}
      style={{ backgroundColor: "#000000" }} // Solid black background
    >
      {displaySources.map((option) => {
        const isActive = value === option.id
        const IconComponent = getIconComponent(option.icon)

        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onChange(option.id)}
            className={cn(
              "flex items-center justify-center transition-all duration-200 rounded-sm whitespace-nowrap",
              compact ? "text-xs px-2" : "text-sm px-3",
              isActive ? activeBackgrounds[option.id as keyof typeof activeBackgrounds] : "hover:bg-[#176BEF]/20",
              showOnlySelected ? "w-full" : "", // Make button take full width if only showing selected
            )}
            style={{
              flex: "1 1 auto",
            }}
          >
            <IconComponent
              className={cn("transition-all", compact ? "h-3 w-3" : "h-4 w-4", isActive ? "text-white" : "")}
              style={{ color: isActive ? "white" : option.color }}
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

export default KnowledgeSourceSelector
