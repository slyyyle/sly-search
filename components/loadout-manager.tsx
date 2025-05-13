"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Save, Trash2, Check, X, Edit2, Lock } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import type { AppSettings, Engine, SourceListItem } from "@/lib/use-settings"
import type { EngineLoadout, SourceLoadout } from "@/lib/settings-schema"

// Use the imported Loadout types which include isLocked
// type ManagedLoadout<T> = T extends Engine[] ? EngineLoadout : SourceLoadout; // Remove complex generic

// Define a simpler Loadout type for the props that includes isLocked
interface ManagedLoadout {
  id: string;
  name: string;
  config: any; // Keep config generic here
  isLocked?: boolean;
}

interface LoadoutManagerProps<T extends Engine[] | SourceListItem[]> {
  type: "engines" | "surf"
  // Use the simpler ManagedLoadout type which includes isLocked
  loadouts: ManagedLoadout[];
  activeLoadoutId: string | null;
  currentConfig: T;
  availableEngineDefs?: Engine[];
  onSaveLoadout: (name: string, config: T) => void
  onSelectLoadout: (id: string) => void
  onDeleteLoadout: (id: string) => void
}

export function LoadoutManager<T extends Engine[] | SourceListItem[]>({
  type,
  loadouts, // This now contains items potentially marked as isLocked
  activeLoadoutId,
  currentConfig,
  availableEngineDefs,
  onSaveLoadout,
  onSelectLoadout,
  onDeleteLoadout,
}: LoadoutManagerProps<T>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newLoadoutName, setNewLoadoutName] = useState("")

  const handleSaveLoadout = () => {
    const trimmedName = newLoadoutName.trim();
    if (trimmedName) {
      // Prevent saving with reserved names
      if (trimmedName.toLowerCase() === "starter" || trimmedName.toLowerCase() === "ai dynamic search") {
        alert(`Cannot save loadout with the name \'${trimmedName}\'. Please choose another name.`);
        return;
      }
      onSaveLoadout(trimmedName, currentConfig)
      setNewLoadoutName("")
      setIsDialogOpen(false)
    }
  }

  const typeLabel = type === "engines" ? "Engine" : "Local Lagoon"

  // Separate locked and unlocked loadouts for rendering order (optional)
  const lockedLoadouts = loadouts.filter(l => l.isLocked);
  const unlockedLoadouts = loadouts.filter(l => !l.isLocked);

  return (
    <div className="space-y-2">
      {type !== "engines" && (
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">{typeLabel} Loadouts</h3>
        </div>
      )}

      {/* Render Locked Loadouts First */}
      <div className="space-y-2 mt-3">
        {lockedLoadouts.map((loadout) => (
          <div
            key={loadout.id}
            className={`flex items-center justify-between p-2 rounded-md border ${
              loadout.id === activeLoadoutId ? "border-[var(--switch-checked-bg-color)] bg-primary/5" : "border-border/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" /> {/* Add Lock Icon */}
              <span className="font-medium text-sm">{loadout.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {loadout.id !== activeLoadoutId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onSelectLoadout(loadout.id)}
                >
                  Activate
                </Button>
              )}
              {loadout.id === activeLoadoutId && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-[var(--switch-checked-bg-color)] border-[var(--switch-checked-bg-color)]/50 px-1.5 py-0.5">
                  Active
                </Badge>
              )}
              {/* Delete button is always disabled for locked loadouts */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground/30 cursor-not-allowed" // Make delete less prominent and indicate disabled
                disabled={true} // Always disabled
                title={`The "${loadout.name}" loadout cannot be deleted.`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>

       {/* Divider if both locked and unlocked loadouts exist */}
       {lockedLoadouts.length > 0 && unlockedLoadouts.length > 0 && (
        <hr className="my-3 border-border/30" />
       )}

      {/* Render Unlocked (User-Saved) Loadouts */}
      <div className="space-y-2">
        {unlockedLoadouts.map((loadout) => (
          <div
            key={loadout.id}
            className={`flex items-center justify-between p-2 rounded-md border ${
              loadout.id === activeLoadoutId ? "border-[var(--switch-checked-bg-color)] bg-primary/5" : "border-border/40"
            }`}
          >
            <div className="flex items-center gap-2">
              {/* No lock icon for user loadouts */}
              <span className="font-medium text-sm">{loadout.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {loadout.id !== activeLoadoutId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => onSelectLoadout(loadout.id)}
                >
                  Activate
                </Button>
              )}
              {loadout.id === activeLoadoutId && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-[var(--switch-checked-bg-color)] border-[var(--switch-checked-bg-color)]/50 px-1.5 py-0.5">
                  Active
                </Badge>
              )}
              {/* Enable delete button for user loadouts */}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                onClick={() => onDeleteLoadout(loadout.id) } // Direct call, confirmation handled by parent
                title={`Delete loadout "${loadout.name}"`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {/* Message if no user-saved loadouts exist */}
        {unlockedLoadouts.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-2">No custom {typeLabel.toLowerCase()} loadouts saved yet.</p>
        )}
      </div>
    </div>
  )
}
