"use client"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown, Lock, Bolt } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useSettings, type EngineLoadout } from "@/lib/use-settings"
import { useMemo } from "react"

interface LoadoutOption {
  id: string;
  name: string;
  isLocked?: boolean;
}

interface LoadoutSelectorProps {
  type: "engines" | "surf"
  compact?: boolean
}

export function LoadoutSelector({ type, compact = false }: LoadoutSelectorProps) {
  const { settings, selectLoadout, activeEngineLoadoutId } = useSettings()

  const starterOption: LoadoutOption = { id: 'starter', name: 'Starter', isLocked: true };
  const aiDynamicOption: LoadoutOption = { id: 'sl-ai', name: 'SLAI', isLocked: true };

  const allLoadoutOptions = useMemo(() => {
    let userLoadouts: LoadoutOption[] = [];
    if (type === "engines") {
      userLoadouts = (settings.engines?.loadouts || []).map((l: EngineLoadout) => ({ 
          id: l.id, 
          name: l.name,
          isLocked: l.isLocked
      }));
    } else if (type === "surf") {
      userLoadouts = (settings.personalSources?.loadouts || []).map(l => ({ id: l.id, name: l.name }));
    }
    
    return type === "engines" ? [starterOption, aiDynamicOption, ...userLoadouts] : [...userLoadouts];

  }, [type, settings.engines?.loadouts, settings.personalSources?.loadouts]);

  const currentActiveId = type === "engines" ? activeEngineLoadoutId ?? 'starter' : null;

  const activeLoadoutOption = allLoadoutOptions.find((option) => option.id === currentActiveId);

  const displayActiveName = activeLoadoutOption?.name || 'Starter';
  const isActiveLocked = activeLoadoutOption?.isLocked ?? (currentActiveId === 'starter' || currentActiveId === 'sl-ai');

  const fallbackText = type === "engines" ? "Starter" : "Default Lagoon";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size={compact ? "sm" : "default"}
          className={`flex items-center justify-between ${compact ? "h-8 text-xs" : ""}`}
        >
          {currentActiveId === 'sl-ai' && <Bolt className={`h-3 w-3 mr-1 ${compact ? 'h-2.5 w-2.5' : ''}`} />}
          {isActiveLocked && currentActiveId !== 'sl-ai' && <Lock className={`h-3 w-3 mr-1 ${compact ? 'h-2.5 w-2.5' : ''}`} />}

          <span className="truncate mr-1">
            {displayActiveName}
          </span>
          <ChevronDown className={compact ? "h-3 w-3" : "h-4 w-4"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {allLoadoutOptions.length > 0 ? (
          allLoadoutOptions.map((option) => (
            <DropdownMenuItem
              key={option.id}
              className="flex items-center justify-between"
              onClick={() => selectLoadout(type, option.id)}
              disabled={option.id === currentActiveId}
            >
              <div className="flex items-center">
                 {option.id === 'sl-ai' && <Bolt className="h-3 w-3 mr-1.5 text-muted-foreground" />}
                 {option.isLocked && option.id !== 'sl-ai' && <Lock className="h-3 w-3 mr-1.5 text-muted-foreground" />}
                 <span className="truncate">{option.name}</span>
              </div>
              {option.id === currentActiveId && <Check className="h-4 w-4 ml-2" />}
            </DropdownMenuItem>
          ))
        ) : (
          <DropdownMenuItem disabled>No saved loadouts</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
