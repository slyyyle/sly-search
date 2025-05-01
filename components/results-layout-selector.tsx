"use client"

import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSettings } from "@/lib/use-settings"

interface ResultsLayoutSelectorProps {
  compact?: boolean
}

export function ResultsLayoutSelector({ compact = false }: ResultsLayoutSelectorProps) {
  const { settings, updateSetting, saveSettings } = useSettings()
  
  // Get the current results layout from settings
  const currentLayout = settings.appearance?.resultsLayout || "list"
  
  // Function to get display name for the layout
  const getLayoutDisplayName = (layout: string): string => {
    return layout.charAt(0).toUpperCase() + layout.slice(1)
  }

  // Handle layout selection
  const handleLayoutSelection = (layout: string) => {
    updateSetting("appearance", "resultsLayout", layout)
    saveSettings()
  }
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={`flex items-center justify-between ${compact ? "h-8 text-xs" : ""}`}
        >
          <span className="truncate mr-1">
            {getLayoutDisplayName(currentLayout)}
          </span>
          <ChevronDown className={compact ? "h-3 w-3" : "h-4 w-4"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {["list", "grid", "compact"].map((layout) => (
          <DropdownMenuItem
            key={layout}
            className="flex items-center justify-between"
            onClick={() => handleLayoutSelection(layout)}
          >
            <span className="truncate">{getLayoutDisplayName(layout)}</span>
            {layout === currentLayout && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
} 