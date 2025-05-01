"use client"

import React, { useState, useEffect } from "react"
import { Database, Globe, Zap, Book, FileText, Brain, Bot, Music, Youtube, Library, Image } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/use-settings"

interface TheLocalLagoonProps {
  value: string
  onChange: (value: string) => void
  compact?: boolean
  startExpanded?: boolean
}

const TheLocalLagoon: React.FC<TheLocalLagoonProps> = ({
  value,
  onChange,
  compact = false,
  startExpanded = false,
}) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false)
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
    { id: "localFiles", label: "Files", icon: "FileText", color: "#F7B529", gradient: "from-[#FF3E30]/70 to-[#F7B529]/70" },
    { id: "ai", label: "AI", icon: "Bot", color: "#10B981", gradient: "from-[#10B981]/70 to-[#059669]/70" },
    {
      id: "youtube",
      label: "YouTube",
      icon: "Youtube",
      color: "#FF0000",
      gradient: "from-[#FF0000]/70 to-[#CC0000]/70",
    },
    {
      id: "music",
      label: "Music",
      icon: "Music",
      color: "#FF7700",
      gradient: "from-[#FF7700]/70 to-[#FF3300]/70",
    },
    {
      id: "photos",
      label: "Photos",
      icon: "Image",
      color: "#3498DB",
      gradient: "from-[#3498DB]/70 to-[#2980B9]/70",
    },
  ]

  const getIconComponent = (iconName: string) => {
    const lowerIconName = iconName.toLowerCase();
    switch (lowerIconName) {
      case "zap":
        return Zap
      case "brain":
        return Brain
      case "filetext":
        return FileText
      case "database":
        return Database
      case "globe":
        return Globe
      case "book":
        return Book
      case "bot":
        return Bot
      case "youtube":
        return Youtube
      case "music":
        return Music
      case "image":
        return Image
      case "library":
        return Library
      default:
        return Database
    }
  }

  const selectedSource = surfSources.find((source) => source.id === value);

  const handleItemSelect = (sourceId: string) => {
    onChange(sourceId);
    setIsPopoverOpen(false);
  };

  if (startExpanded) {
    return (
      <div
        className={cn(
          "flex google-gradient-border rounded-md p-1",
          compact ? "h-8" : "h-10",
          "min-w-fit w-auto",
        )}
        style={{ backgroundColor: "#000000" }}
      >
        {surfSources.map((source) => {
          const isActive = value === source.id
          const Icon = getIconComponent(source.icon)
          const displayGradient = source.gradient || "from-[#176BEF]/70 to-[#FF3E30]/70"
          const displayColor = source.color

          return (
            <button
              key={source.id}
              type="button"
              onClick={() => handleItemSelect(source.id)}
              className={cn(
                "flex items-center justify-center transition-all duration-200 rounded-sm whitespace-nowrap",
                compact ? "text-xs px-2" : "text-sm px-3",
                isActive ? `bg-gradient-to-r ${displayGradient}` : "hover:bg-[#176BEF]/20",
              )}
              style={{ flex: "1 1 auto" }}
            >
              <Icon
                className={cn("transition-all", compact ? "h-3 w-3" : "h-4 w-4", isActive ? "text-white" : "")}
                style={{ color: isActive ? "white" : displayColor }}
              />
              <span className={cn("ml-1.5", isActive ? "text-white font-medium" : "opacity-90")}>
                {source.label}
              </span>
            </button>
          )
        })}
      </div>
    )
  }

  if (!selectedSource) return null;

  const TriggerIcon = getIconComponent(selectedSource.icon);
  const triggerGradient = selectedSource.gradient || "from-[#176BEF]/70 to-[#FF3E30]/70";

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center google-gradient-border rounded-md p-1 transition-all duration-200 whitespace-nowrap w-full",
            compact ? "h-8 text-xs px-2" : "h-10 text-sm px-3",
            `bg-gradient-to-r ${triggerGradient}`
          )}
          style={{ backgroundColor: "#000000" }}
          aria-expanded={isPopoverOpen}
        >
          <TriggerIcon
            className={cn("transition-all text-white", compact ? "h-3 w-3" : "h-4 w-4")}
            style={{ color: "white" }}
          />
          <span className={cn("ml-1.5 text-white font-medium")}>
            {selectedSource.label}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto min-w-[180px] p-1 bg-black border-border/40 flex flex-col space-y-1"
        style={{ backgroundColor: "#000000" }}
      >
        {surfSources.map((source) => {
          const isActive = value === source.id
          const Icon = getIconComponent(source.icon)
          const displayGradient = source.gradient || "from-[#176BEF]/70 to-[#FF3E30]/70"
          const displayColor = source.color

          return (
            <button
              key={source.id}
              type="button"
              onClick={() => handleItemSelect(source.id)}
              className={cn(
                "flex items-center justify-start w-full transition-all duration-200 rounded-sm whitespace-nowrap",
                compact ? "text-xs px-2 h-7" : "text-sm px-3 h-9",
                isActive ? `bg-gradient-to-r ${displayGradient}` : "hover:bg-[#176BEF]/20",
              )}
              style={{ flex: "1 1 auto" }}
            >
              <Icon
                className={cn("transition-all", compact ? "h-3 w-3" : "h-4 w-4", isActive ? "text-white" : "")}
                style={{ color: isActive ? "white" : displayColor }}
              />
              <span className={cn("ml-1.5", isActive ? "text-white font-medium" : "opacity-90")}>
                {source.label}
              </span>
            </button>
          )
        })}
      </PopoverContent>
    </Popover>
  )
}

export default TheLocalLagoon
