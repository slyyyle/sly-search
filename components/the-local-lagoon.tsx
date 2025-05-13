"use client"

import React, { useState } from "react"
import { Database, Globe, Zap, Book, FileText, Brain, Bot, Music, Youtube, Library, Image, Rss } from "lucide-react"
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
  const { settings, loading, isInitialLoadComplete } = useSettings()

  if (!isInitialLoadComplete) {
    return null;
  }

  const surfSources = settings.personalSources?.sources || [];

  const getIconComponent = (iconName: string | undefined): React.ElementType => {
    if (!iconName) return Database;
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
      case "rss":
        return Rss
      default:
        return Database
    }
  }

  const selectedSource = surfSources.find((source) => source.id === value);

  const handleItemSelect = (sourceId: string) => {
    onChange(sourceId);
    setIsPopoverOpen(false);
  };

  if (surfSources.length === 0 && !startExpanded) {
    return null;
  }

  if (startExpanded) {
    return (
      <div
        className={cn(
          "flex themed-gradient-border rounded-md p-1",
          compact ? "h-8" : "h-10",
          "min-w-fit w-auto",
        )}
        style={{ backgroundColor: "#000000" }}
      >
        {surfSources.map((source) => {
          const isActive = value === source.id
          const Icon = getIconComponent(source.icon)
          const displayGradient = source.gradient || "themed-gradient-transparent"
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

  if (!selectedSource && surfSources.length > 0) {
    if (!startExpanded) return null;
  }

  if (!selectedSource && !startExpanded) return null;

  const TriggerIcon = getIconComponent(selectedSource?.icon);
  const triggerGradient = selectedSource?.gradient || "themed-gradient-transparent";

  return (
    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center justify-center themed-gradient-border rounded-md p-1 transition-all duration-200 whitespace-nowrap w-full",
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
            {selectedSource?.label}
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
          const displayGradient = source.gradient || "themed-gradient-transparent"
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
