"use client"

import type React from "react"
import { Database, Globe, Zap, Book, FileText, Brain, Bot, Music, Youtube } from "lucide-react"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/use-settings"

interface TheSurfSelectorProps {
  value: string
  onChange: (value: string) => void
  compact?: boolean
  showOnlySelected?: boolean
}

const TheSurfSelector: React.FC<TheSurfSelectorProps> = ({
  value,
  onChange,
  compact = false,
  showOnlySelected = false,
}) => {
  const { settings } = useSettings()
  const surfSources = settings.personalSources?.sources || [
    { id: "normal", label: "Web", icon: "Zap", color: "#176BEF", gradient: "from-[#176BEF]/70 to-[#FF3E30]/70" },
    {
      id: "obsidian",
      label: "Obsidian",
      icon: "Brain",
      color: "#7E6AD7",
      gradient: "from-[#7E6AD7]/70 to-[#9C87E0]/70",
    },
    { id: "local", label: "Files", icon: "FileText", color: "#F7B529", gradient: "from-[#FF3E30]/70 to-[#F7B529]/70" },
    { id: "ai", label: "AI", icon: "Bot", color: "#10B981", gradient: "from-[#10B981]/70 to-[#059669]/70" },
    {
      id: "youtube",
      label: "YouTube",
      icon: "Youtube",
      color: "#FF0000",
      gradient: "from-[#FF0000]/70 to-[#CC0000]/70",
    },
    {
      id: "soundcloud",
      label: "SoundCloud",
      icon: "Music",
      color: "#FF7700",
      gradient: "from-[#FF7700]/70 to-[#FF3300]/70",
    },
  ]

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
      case "Bot":
        return Bot
      case "Youtube":
        return Youtube
      case "Music":
        return Music
      default:
        return Zap
    }
  }

  // If showOnlySelected is true, filter to only show the selected source
  const displaySources = showOnlySelected ? surfSources.filter((source) => source.id === value) : surfSources

  return (
    <div
      className={cn(
        "flex google-gradient-border rounded-md p-1",
        compact ? "h-8" : "h-10",
        "min-w-fit", // Ensure container is wide enough for content
      )}
      style={{ backgroundColor: "#000000" }} // Solid black background
    >
      {displaySources.map((source) => {
        const isActive = value === source.id
        const Icon = getIconComponent(source.icon)
        const activeGradient = source.gradient || "from-[#176BEF]/70 to-[#FF3E30]/70"

        return (
          <button
            key={source.id}
            type="button"
            onClick={() => onChange(source.id)}
            className={cn(
              "flex items-center justify-center transition-all duration-200 rounded-sm whitespace-nowrap",
              compact ? "text-xs px-2" : "text-sm px-3",
              isActive ? `bg-gradient-to-r ${activeGradient}` : "hover:bg-[#176BEF]/20",
              showOnlySelected ? "w-full" : "", // Make button take full width if only showing selected
            )}
            style={{
              flex: "1 1 auto",
            }}
          >
            <Icon
              className={cn("transition-all", compact ? "h-3 w-3" : "h-4 w-4", isActive ? "text-white" : "")}
              style={{ color: isActive ? "white" : source.color }}
            />

            {(source.label || !compact) && (
              <span className={cn("ml-1.5", isActive ? "text-white font-medium" : "opacity-90")}>{source.label}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}

export default TheSurfSelector
