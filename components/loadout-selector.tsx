"use client"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSettings } from "@/lib/use-settings"

interface LoadoutSelectorProps {
  type: "engines" | "surf"
  compact?: boolean
}

export function LoadoutSelector({ type, compact = false }: LoadoutSelectorProps) {
  const { settings, selectLoadout } = useSettings()

  let loadouts: any[] = [];
  let activeLoadoutId: string | null = null;

  if (type === "engines") {
    loadouts = settings.engines?.loadouts || [];
    activeLoadoutId = settings.engines?.activeLoadoutId ?? null; 
  } else if (type === "surf") {
    loadouts = settings.personalSources?.loadouts || [];
    activeLoadoutId = null; 
  }

  const activeLoadout = loadouts.find((loadout) => loadout.id === activeLoadoutId)

  const fallbackText = type === "engines" ? "Starter" : "Default Lagoon";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={`flex items-center justify-between ${compact ? "h-8 text-xs" : ""}`}
        >
          <span className="truncate mr-1">
            {activeLoadout ? activeLoadout.name : fallbackText}
          </span>
          <ChevronDown className={compact ? "h-3 w-3" : "h-4 w-4"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {loadouts.length > 0 ? (
          loadouts.map((loadout) => (
            <DropdownMenuItem
              key={loadout.id}
              className="flex items-center justify-between"
              onClick={() => selectLoadout(type, loadout.id)}
            >
              <span className="truncate">{loadout.name}</span>
              {loadout.id === activeLoadoutId && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No saved loadouts</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
