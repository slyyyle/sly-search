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
  currentConfig: T;
  onSaveLoadout: (name: string, config: T) => void
  onSelectLoadout: (id: string) => void
  onDeleteLoadout: (id: string) => void
}

export function LoadoutManager<T extends Engine[] | SourceListItem[]>({
  type,
  loadouts,
  currentConfig,
  onSaveLoadout,
  onSelectLoadout,
  onDeleteLoadout,
}: LoadoutManagerProps<T>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newLoadoutName, setNewLoadoutName] = useState("")
  const [editMode, setEditMode] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [activeLoadoutId, setActiveLoadoutId] = useState<string | null>(null);

  useEffect(() => {
    const currentConfigString = JSON.stringify(currentConfig);
    const activeLoadout = loadouts.find(l => JSON.stringify(l.config) === currentConfigString);
    setActiveLoadoutId(activeLoadout ? activeLoadout.id : null);
  }, [loadouts, currentConfig]);

  const handleSaveLoadout = () => {
    if (newLoadoutName.trim()) {
      onSaveLoadout(newLoadoutName, currentConfig)
      setNewLoadoutName("")
      setIsDialogOpen(false)
    }
  }

  const handleStartEdit = (id: string, name: string) => {
    setEditMode(id)
    setEditName(name)
  }

  const handleSaveEdit = (id: string) => {
    if (editName.trim()) {
      const loadout = loadouts.find((l) => l.id === id)
      if (loadout) {
        onSaveLoadout(editName, loadout.config)
        onDeleteLoadout(id)
      }
      setEditMode(null)
    }
  }

  const handleCancelEdit = () => {
    setEditMode(null)
  }

  const typeLabel = type === "engines" ? "Engine" : "Surf"

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">{typeLabel} Loadouts</h3>

        <div className="flex items-center gap-2">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Save Current
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Save {typeLabel} Loadout</DialogTitle>
                <DialogDescription>
                  Save your current {type} configuration as a loadout for quick access later.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="loadout-name">Loadout Name</Label>
                  <Input
                    id="loadout-name"
                    placeholder={`My ${typeLabel} Loadout`}
                    value={newLoadoutName}
                    onChange={(e) => setNewLoadoutName(e.target.value)}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSaveLoadout} disabled={!newLoadoutName.trim()}>
                    <Save className="h-4 w-4 mr-2" />
                    Save Loadout
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                Select Loadout
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {loadouts.length > 0 ? (
                loadouts.map((loadout) => (
                  <DropdownMenuItem
                    key={loadout.id}
                    className="flex items-center justify-between"
                    onClick={() => onSelectLoadout(loadout.id)}
                  >
                    <span>{loadout.name}</span>
                    {loadout.id === activeLoadoutId && <Check className="h-4 w-4 text-green-500" />}
                  </DropdownMenuItem>
                ))
              ) : (
                <DropdownMenuItem disabled>No saved loadouts</DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Loadout list */}
      <div className="space-y-2 mt-3">
        {loadouts.map((loadout) => (
          <div
            key={loadout.id}
            className={`flex items-center justify-between p-2 rounded-md border ${
              loadout.id === activeLoadoutId ? "border-primary/50 bg-primary/5" : "border-border/40"
            }`}
          >
            {editMode === loadout.id ? (
              <div className="flex items-center gap-2 flex-1">
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="h-7 text-sm"
                  autoFocus
                />
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-green-500"
                    onClick={() => handleSaveEdit(loadout.id)}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={handleCancelEdit}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{loadout.name}</span>
                  {loadout.id === activeLoadoutId && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                      Active
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleStartEdit(loadout.id, loadout.name)}
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => onDeleteLoadout(loadout.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
