"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Save, Trash2, Check, X, Edit2 } from "lucide-react"
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

interface Loadout<T> {
  id: string
  name: string
  config: T
}

interface LoadoutManagerProps<T extends Engine[] | SourceListItem[]> {
  type: "engines" | "surf"
  loadouts: Loadout<T>[];
  activeLoadoutId: string | null;
  currentConfig: T;
  availableEngineDefs?: Engine[];
  onSaveLoadout: (name: string, config: T) => void
  onSelectLoadout: (id: string) => void
  onDeleteLoadout: (id: string) => void
}

export function LoadoutManager<T extends Engine[] | SourceListItem[]>({
  type,
  loadouts,
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
      if (trimmedName.toLowerCase() === "starter") {
        alert("Cannot save loadout with the name 'Starter'. Please choose another name.");
        return;
      }
      onSaveLoadout(trimmedName, currentConfig)
      setNewLoadoutName("")
      setIsDialogOpen(false)
    }
  }

  const typeLabel = type === "engines" ? "Engine" : "Local Lagoon"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{typeLabel} Loadouts</h3>
      </div>

      {/* --- ADDED: Static Starter Profile Row --- */}
      {type === "engines" && ( 
         <div
            key="starter"
            className={`flex items-center justify-between p-2 rounded-md border ${
              activeLoadoutId === 'starter' ? "border-primary/50 bg-primary/5" : "border-border/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">Starter</span>
              {activeLoadoutId === 'starter' && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 px-1.5 py-0.5">
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onSelectLoadout('starter')}
                disabled={activeLoadoutId === 'starter'}
              >
                Activate
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground/30" // Make delete less prominent
                disabled={true} // Always disabled
                title={"The Starter loadout cannot be deleted."}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
      )}
      {/* --- END: Static Starter Profile Row --- */}


      {/* Loadout list - Filter out any potential saved 'starter' */}
      <div className="space-y-2 mt-3">
        {loadouts && loadouts.filter(loadout => loadout.id !== 'starter').map((loadout) => (
          <div
            key={loadout.id}
            className={`flex items-center justify-between p-2 rounded-md border ${
              loadout.id === activeLoadoutId ? "border-primary/50 bg-primary/5" : "border-border/40"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{loadout.name}</span>
              {loadout.id === activeLoadoutId && (
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30 px-1.5 py-0.5">
                  Active
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => onSelectLoadout(loadout.id)}
                disabled={loadout.id === activeLoadoutId}
              >
                Activate
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10 disabled:text-muted-foreground/30 disabled:bg-transparent disabled:cursor-not-allowed"
                onClick={() => {
                  // Using the passed onDeleteLoadout which should handle confirmation
                    onDeleteLoadout(loadout.id)
                }}
                disabled={loadout.id === 'starter'} // Safety check
                title={loadout.id === 'starter' ? "The Starter loadout cannot be deleted." : `Delete loadout "${loadout.name}"`}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
        {/* Adjust condition slightly if starter is always shown */}
        {loadouts && loadouts.filter(l => l.id !== 'starter').length === 0 && type !== "engines" && ( 
          <p className="text-sm text-muted-foreground text-center py-2">No custom loadouts saved yet.</p>
        )}
         {loadouts && loadouts.filter(l => l.id !== 'starter').length === 0 && type === "engines" && ( 
          <p className="text-sm text-muted-foreground text-center py-2">No custom engine loadouts saved yet.</p>
        )}
      </div>
    </div>
  )
}
