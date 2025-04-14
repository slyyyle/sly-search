"use client"

import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsTooltip } from "@/components/settings-tooltip"
import { Plus, ChevronDown, ChevronUp, Settings2, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { LoadoutManager } from "@/components/loadout-manager"
import { useSettings, type AppSettings } from "@/lib/use-settings"

// Define props interface
interface EnginesSettingsProps {
  settings: AppSettings['engines']; // Expecting the 'engines' part of AppSettings
  updateSetting: (section: keyof AppSettings, key: string, value: any) => void;
}

export function EnginesSettings({ settings, updateSetting }: EnginesSettingsProps) {
  const { saveLoadout, selectLoadout, deleteLoadout } = useSettings()

  // Default settings within the component if the settings prop might be undefined
  const currentEngines = settings?.engine_list || [];
  const engineLoadouts = settings?.loadouts || []; // Assuming loadouts are part of engines settings

  const [searchEngines, setSearchEngines] = useState(currentEngines)
  const [expandedEngines, setExpandedEngines] = useState<number[]>([])
  const [showAddEngine, setShowAddEngine] = useState(false)
  // Assuming EngineDetail type is correct from AppSettings['engines']['engine_list'] element type
  type EngineDetailType = NonNullable<NonNullable<AppSettings['engines']>['engine_list']>[number];
  const [newEngine, setNewEngine] = useState<Omit<EngineDetailType, 'id'> & { id: number | null }>({ name: "", shortcut: "", weight: 1.0, categories: ["general"], id: null, enabled: false })

  // Utility function to get enabled engine count
  const getEnabledEngineCount = () => {
    return searchEngines.filter((engine) => engine.enabled).length
  }

  // Update local state and call prop updateSetting
  const handleEngineUpdate = (newEnginesList: typeof currentEngines) => {
    setSearchEngines(newEnginesList);
    updateSetting("engines", "engine_list", newEnginesList);
  }

  const toggleEngine = (id: number) => {
    const newEngines = searchEngines.map((engine) =>
      engine.id === id ? { ...engine, enabled: !engine.enabled } : engine,
    )
    handleEngineUpdate(newEngines);
  }

  const updateEngineWeight = (id: number, weight: number) => {
    const newEngines = searchEngines.map((engine) => (engine.id === id ? { ...engine, weight } : engine))
    handleEngineUpdate(newEngines);
  }

  const toggleEngineExpanded = (id: number) => {
    setExpandedEngines((prev) =>
      prev.includes(id) ? prev.filter((engineId) => engineId !== id) : [...prev, id]
    );
  }

  const updateEngineProperty = (id: number, property: keyof typeof newEngine, value: any) => {
    const newEngines = searchEngines.map((engine) => (engine.id === id ? { ...engine, [property]: value } : engine))
    handleEngineUpdate(newEngines);
  }

  const addNewEngine = () => {
    if (newEngine.name && newEngine.shortcut) {
      const newId = searchEngines.length > 0 ? Math.max(...searchEngines.map((e) => e.id)) + 1 : 1; // Handle empty list
      const engineToAdd = {
        ...newEngine,
        id: newId,
        enabled: true,
      } as EngineDetailType; // Assert type
      const updatedEngines = [...searchEngines, engineToAdd]
      handleEngineUpdate(updatedEngines);
      setNewEngine({ name: "", shortcut: "", weight: 1.0, categories: ["general"], id: null, enabled: false })
      setShowAddEngine(false)
    }
  }

  const removeEngine = (id: number) => {
    const updatedEngines = searchEngines.filter((engine) => engine.id !== id)
    handleEngineUpdate(updatedEngines);
  }

  const categoryOptions = [
    "general",
    "images",
    "videos",
    "news",
    "maps",
    "science",
    "files",
    "music",
    "social media",
    "it",
    "meta",
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Search Engines</CardTitle>
        <CardDescription>Enable or disable search engines and adjust their weights</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Add the LoadoutManager component */}
        <div className="mb-6 pb-6 border-b border-border/40">
          <LoadoutManager
            type="engines"
            loadouts={engineLoadouts}
            currentConfig={searchEngines}
            onSaveLoadout={(name, config) => saveLoadout("engines", name, config)}
            onSelectLoadout={(id) => selectLoadout("engines", id)}
            onDeleteLoadout={(id) => deleteLoadout("engines", id)}
          />
        </div>

        <div className="mb-4">
          <div className="flex items-center">
            <Label>Engine Weights</Label>
            <SettingsTooltip content="Weight determines the influence of each engine in the results. Higher weights give more prominence to that engine's results." />
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            SearXNG supports 100+ engines. Adjust weights to prioritize certain engines.
          </p>
        </div>

        {getEnabledEngineCount() > 20 && (
          <div className="mb-4 p-3 border border-amber-500/30 bg-amber-500/10 rounded-md">
            <p className="text-sm text-amber-400">
              <span className="font-medium">Performance notice:</span> You have {getEnabledEngineCount()} engines
              enabled. Using many engines simultaneously may increase search time and potentially hit API limits.
            </p>
          </div>
        )}

        <div className="space-y-4">
          {searchEngines.map((engine) => (
            <Collapsible
              key={engine.id}
              open={expandedEngines.includes(engine.id)}
              onOpenChange={() => toggleEngineExpanded(engine.id)}
              className="space-y-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`engine-${engine.id}`}
                    checked={engine.enabled}
                    onCheckedChange={() => toggleEngine(engine.id)}
                  />
                  <Label htmlFor={`engine-${engine.id}`}>{engine.name}</Label>
                  <SettingsTooltip
                    content={`Configure the ${engine.name} search engine. When enabled, results from ${engine.name} will be included in search results.`}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">Weight: {engine.weight.toFixed(1)}</span>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-0 h-8 w-8">
                      {expandedEngines.includes(engine.id) ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>

              <div className="pl-6">
                <Slider
                  disabled={!engine.enabled}
                  defaultValue={[engine.weight * 10]}
                  value={[engine.weight * 10]}
                  max={10}
                  step={1}
                  onValueChange={(value) => updateEngineWeight(engine.id, value[0] / 10)}
                />
              </div>

              <CollapsibleContent className="pl-6 pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor={`shortcut-${engine.id}`} className="text-xs">
                      Shortcut
                    </Label>
                    <Input
                      id={`shortcut-${engine.id}`}
                      value={engine.shortcut || ""}
                      onChange={(e) => updateEngineProperty(engine.id, "shortcut", e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`timeout-${engine.id}`} className="text-xs">
                      Timeout (s)
                    </Label>
                    <Input
                      id={`timeout-${engine.id}`}
                      type="number"
                      min="1"
                      max="10"
                      value={engine.timeout || "4"}
                      onChange={(e) => updateEngineProperty(engine.id, "timeout", e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Categories</Label>
                  <div className="flex flex-wrap gap-1">
                    {categoryOptions.map((category) => (
                      <Button
                        key={category}
                        variant={engine.categories?.includes(category) ? "secondary" : "outline"}
                        size="sm"
                        className="text-xs h-6"
                        onClick={() => {
                          const currentCategories = engine.categories || []
                          const newCategories = currentCategories.includes(category)
                            ? currentCategories.filter((c) => c !== category)
                            : [...currentCategories, category]
                          updateEngineProperty(engine.id, "categories", newCategories)
                        }}
                      >
                        {category}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => toggleEngineExpanded(engine.id)}
                  >
                    <Settings2 className="h-3 w-3 mr-1" />
                    Advanced Settings
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs h-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => removeEngine(engine.id)}
                  >
                    <X className="h-3 w-3 mr-1" />
                    Remove
                  </Button>
                </div>
              </CollapsibleContent>

              <Separator className="my-2" />
            </Collapsible>
          ))}

          {showAddEngine ? (
            <div className="border border-dashed border-gray-700 rounded-md p-4 space-y-3">
              <h4 className="text-sm font-medium">Add New Engine</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="new-engine-name" className="text-xs">
                    Name
                  </Label>
                  <Input
                    id="new-engine-name"
                    value={newEngine.name}
                    onChange={(e) => setNewEngine({ ...newEngine, name: e.target.value })}
                    placeholder="Engine name"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="new-engine-shortcut" className="text-xs">
                    Shortcut
                  </Label>
                  <Input
                    id="new-engine-shortcut"
                    value={newEngine.shortcut}
                    onChange={(e) => setNewEngine({ ...newEngine, shortcut: e.target.value })}
                    placeholder="e.g., 'g' for Google"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="new-engine-weight" className="text-xs">
                  Weight
                </Label>
                <Slider
                  id="new-engine-weight"
                  defaultValue={[newEngine.weight * 10]}
                  value={[newEngine.weight * 10]}
                  max={10}
                  step={1}
                  onValueChange={(value) => setNewEngine({ ...newEngine, weight: value[0] / 10 })}
                />
                <div className="text-right text-xs text-muted-foreground">{newEngine.weight.toFixed(1)}</div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddEngine(false)}>
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={addNewEngine}
                  disabled={!newEngine.name || !newEngine.shortcut}
                >
                  Add Engine
                </Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full" onClick={() => setShowAddEngine(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Custom Engine
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
