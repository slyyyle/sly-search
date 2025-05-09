"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsTooltip } from "@/components/settings-tooltip"
import { Plus, ChevronDown, ChevronUp, Settings2, X, Trash2, Check, Edit2, Save, ArrowUpDown, Lock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { LoadoutManager } from "@/components/loadout-manager"
import { useSettings, type AppSettings, type Engine, type EngineLoadout } from "@/lib/use-settings"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogClose 
} from "@/components/ui/dialog"
import { categoryOrder } from "../../lib/constants"
import { mapRawCategoryToGroupId } from "../../lib/category-utils"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Define props interface
interface EnginesSettingsProps { }

// Helper type for the combined loadout list including the default
type DisplayLoadout = { id: string; name: string; config: Engine[] };

export function EnginesSettings({ }: EnginesSettingsProps) {
  const {
    settings,
    updateSetting,
    saveLoadout,
    selectLoadout,
    deleteLoadout,
    availableEngines: fetchedEngines,
    loading,
    activeEngineLoadoutId,
  } = useSettings()

  // State for the Add Engine category filter
  const [addEngineSelectedCategory, setAddEngineSelectedCategory] = useState<string | null>("general");

  // State for AlertDialog
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);
  const [alertDialogContent, setAlertDialogContent] = useState<{ title: string; description: string } | null>(null);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  
  // <<< NEW: State for Name Input Dialog >>>
  const [isNameDialogOpen, setIsNameDialogOpen] = useState(false);
  const [newLoadoutNameInput, setNewLoadoutNameInput] = useState("");

  console.log("EnginesSettings rendering, availableEngines:", fetchedEngines); // <<< Add log here

  // <<< ADDED: Calculate activeConfig directly using useMemo >>>
  const activeConfig = useMemo((): Engine[] => {
    if (loading || !fetchedEngines || fetchedEngines.length === 0) return [];

    console.log('Calculating activeConfig based on availableEngines and loadouts...');

    let calculatedConfig: Engine[] = [];
    const currentActiveId = activeEngineLoadoutId ?? 'starter'; // Use 'starter' if null

    if (currentActiveId === 'starter') {
      // Generate the starter config based on availableEngines
      calculatedConfig = fetchedEngines.map(engine => ({
        ...engine,
        enabled: engine.id === 'google',
        weight: 1.0,
        // Keep other properties like timeout from availableEngines as defaults
      }));
      console.log("Derived active config: Starter");
    } else {
      // Find the saved loadout
      const savedLoadout = settings.engines?.loadouts?.find(l => l.id === currentActiveId);
      if (savedLoadout) {
        // Merge saved loadout config with available engines for completeness
        const loadoutConfig = savedLoadout.config || [];
        calculatedConfig = fetchedEngines.map(availableEngine => {
          const engineFromLoadout = loadoutConfig.find(le => String(le.id) === String(availableEngine.id));
          return {
              ...availableEngine, // Start with potentially updated info from API
              enabled: engineFromLoadout?.enabled ?? false,
              weight: engineFromLoadout?.weight ?? 1.0,
              timeout: engineFromLoadout?.timeout ?? availableEngine.timeout ?? 3.0,
              shortcut: engineFromLoadout?.shortcut ?? availableEngine.shortcut ?? "",
              categories: engineFromLoadout?.categories && engineFromLoadout.categories.length > 0 
                            ? engineFromLoadout.categories 
                            : availableEngine.categories ?? ["general"]
          };
        });
        console.log(`Derived active config from saved loadout: ${savedLoadout.name}`);
      } else {
        // Fallback: Loadout ID is invalid, revert to starter (should be caught by useSettings ideally)
        console.warn(`Active loadout ID ${currentActiveId} not found, falling back to Starter config.`);
        calculatedConfig = fetchedEngines.map(engine => ({
           ...engine,
           enabled: engine.id === 'google',
           weight: 1.0,
        }));
      }
    }
    return calculatedConfig;
  }, [fetchedEngines, activeEngineLoadoutId, settings.engines?.loadouts, loading]); // Dependencies match the old useEffect

  // <<< MODIFIED: addableEngines depends on activeConfig now >>>
  // <<< REVISED CALCULATION: Base on saved loadout config, not merged activeConfig >>>
  const addableEngines = useMemo(() => {
    console.log("Recalculating addableEngines based on SAVED loadout config...");

    console.log(`-- Current activeEngineLoadoutId: ${activeEngineLoadoutId}`);
    console.log(`-- Loading state: ${loading}`);
    console.log(`-- settings.engines?.loadouts available: ${!!settings.engines?.loadouts}`);

    const currentActiveId = activeEngineLoadoutId;
    // If starter or no ID, or loading, no engines are addable through this UI
    if (currentActiveId === 'starter' || !currentActiveId || loading || !settings.engines?.loadouts) {
      console.log("-- Condition met: Returning empty addableEngines list (starter/no ID/loading).");
      return [];
    }

    // Find the specific saved loadout config
    const savedLoadout = settings.engines.loadouts.find(l => l.id === currentActiveId);
    console.log(`-- Found savedLoadout for ID ${currentActiveId}: ${savedLoadout ? savedLoadout.name : 'Not Found'}`);

    const savedConfig = savedLoadout?.config || []; // Engines explicitly in the saved loadout
    console.log(`-- Number of engines in savedConfig: ${savedConfig.length}`);

    // Ensure IDs are treated as strings for comparison
    const savedEngineIds = new Set(savedConfig.map(e => String(e.id)));
    console.log(`-- savedEngineIds Set: ${JSON.stringify(Array.from(savedEngineIds))}`);

    // Return engines from the master list that are NOT in the saved loadout's config
    const filteredEngines = fetchedEngines.filter(engine => !savedEngineIds.has(String(engine.id)));
    console.log(`-- availableEngines count: ${fetchedEngines.length}`);
    console.log(`-- Final addableEngines count: ${filteredEngines.length}`);
    // console.log(`-- Final addableEngines list: ${JSON.stringify(filteredEngines.map(e => e.id))}`); // Optional: Log full list if needed

    return filteredEngines;
    
  }, [fetchedEngines, activeEngineLoadoutId, settings.engines?.loadouts, loading]); // Dependencies reflect this logic

  // Map engine's primary category to a display name
  const getDisplayCategoryName = (engine: Engine): string => {
    const primaryCategory = engine.categories?.[0]; // Get first category, could be undefined
    const groupId = mapRawCategoryToGroupId(primaryCategory); // Use shared helper
    // Find the category info, but only if the groupId is not 'unknown'
    const categoryInfo = groupId !== 'unknown' 
        ? categoryOrder.find((cat: { id: string; name: string }) => cat.id === groupId) 
        : null;
    return categoryInfo?.name || ""; // Fallback to empty string if no match or unknown group
  };

  // Get the config for the currently active loadout (handles starter)
  const getCurrentActiveConfig = (): Engine[] => {
    const currentActiveId = activeEngineLoadoutId ?? 'starter';
    if (currentActiveId === 'starter') {
      // Return the synthesized starter config
      return fetchedEngines.map(engine => ({
        ...engine,
        enabled: engine.id === 'google',
        weight: 1.0,
        timeout: engine.timeout ?? 3.0,
        shortcut: engine.shortcut ?? "",
        categories: engine.categories ?? ["general"],
      }));
    } else {
      const savedLoadout = settings.engines?.loadouts?.find(l => l.id === currentActiveId);
      // Merge with availableEngines for potentially new/updated properties
      const loadoutConfig = savedLoadout?.config || [];
      return fetchedEngines.map(availableEngine => {
        const engineFromLoadout = loadoutConfig.find(le => String(le.id) === String(availableEngine.id));
        return {
          ...availableEngine,
          enabled: engineFromLoadout?.enabled ?? false,
          weight: engineFromLoadout?.weight ?? 1.0,
          timeout: engineFromLoadout?.timeout ?? availableEngine.timeout ?? 3.0,
          shortcut: engineFromLoadout?.shortcut ?? availableEngine.shortcut ?? "",
          categories: engineFromLoadout?.categories && engineFromLoadout.categories.length > 0 
                        ? engineFromLoadout.categories 
                        : availableEngine.categories ?? ["general"]
        };
      });
    }
  };

   // <<< MODIFIED: Create combined list directly from saved settings >>>
   const displayLoadouts = useMemo((): DisplayLoadout[] => {
     console.log("Recalculating displayLoadouts. settings.engines?.loadouts:", settings.engines?.loadouts);

     // Directly return the loadouts from settings state
     // Ensure it's always an array, even if settings.engines or settings.engines.loadouts is null/undefined
     const savedLoadouts: DisplayLoadout[] = settings.engines?.loadouts || [];

     // REMOVED: Explicit creation and prepending of the starter loadout object
     // const starterLoadoutConfig = availableEngines.map(engine => ({
     //   ...engine,
     //   enabled: engine.id === 'google',
     //   weight: 1.0,
     //   timeout: engine.timeout ?? 3.0,
     //   shortcut: engine.shortcut ?? "",
     //   categories: engine.categories ?? ["general"],
     // }));
     // const starterLoadout: DisplayLoadout = {
     //   id: 'starter',
     //   name: 'Starter',
     //   config: starterLoadoutConfig,
     // };
     // return [starterLoadout, ...savedLoadouts];

     return savedLoadouts; // Return only the loadouts saved in the settings

   }, [settings.engines?.loadouts]); // Dependency only on saved loadouts

  // <<< MODIFIED: Use activeConfig instead of searchEngines >>>
  const getEnabledEngineCount = () => {
    return activeConfig.filter((engine) => engine.enabled).length
  }

  // handleEngineUpdate ONLY updates local state (searchEngines)
  // const handleEngineUpdate = (newEnginesList: Engine[]) => {
  //   setSearchEngines(newEnginesList)
  //   console.log("Local active engine config updated.");
  // }

  // --- START MODIFICATION: addEngine function using memoized state --- 
  const addEngine = (engineId: string) => {
     if (!settings?.engines) {
      setAlertDialogContent({ title: "Error", description: "Settings not fully loaded. Please wait and try again." });
      setIsAlertDialogOpen(true);
      return;
    }
    const currentActiveId = activeEngineLoadoutId;
    const engineToAdd = fetchedEngines.find(e => e.id === engineId);

    if (!engineToAdd) {
      console.error("Engine to add not found in availableEngines:", engineId);
      setAlertDialogContent({ title: "Error", description: `Could not find engine details for ID: ${engineId}` });
      setIsAlertDialogOpen(true);
      return;
    }

    const currentLoadouts = settings.engines?.loadouts || [];
    const newLoadouts = currentLoadouts.map(loadout => {
      if (loadout.id === currentActiveId) {
        // --- Start Modification: Work with actual saved config --- 
        const savedConfig = loadout.config || []; // Get the config explicitly saved in this loadout
        
        // Check if already present (though UI should prevent this)
        if (savedConfig.some(e => e.id === engineId)) {
            console.warn(`Engine ${engineId} is already in saved config for loadout ${loadout.id}. Aborting add.`);
            return loadout; // Engine already in the specific loadout config
        }

        // Add the new engine, ensuring its properties are correctly set (default enabled=true?)
        const newEngineEntry: Engine = { ...engineToAdd, enabled: true, weight: 1.0 }; // Set defaults

        // Return the loadout with the new engine added ONLY to its specific config list
        return { ...loadout, config: [...savedConfig, newEngineEntry] };
        // --- End Modification ---
      }
      return loadout;
    });
    updateSetting('engines', 'loadouts', newLoadouts);
  }
  // --- END MODIFICATION --- 

  // Action handlers - Directly update settings
  const removeEngineFromLoadout = (id: string) => {
     if (!settings?.engines) {
      setAlertDialogContent({ title: "Error", description: "Settings not fully loaded. Please wait and try again." });
      setIsAlertDialogOpen(true);
      return;
    }
    const currentActiveId = activeEngineLoadoutId; 
    if (!currentActiveId || currentActiveId === 'starter') {
      console.error("Attempted to remove engine from starter or invalid loadout");
      return; // Should not happen due to UI disabling
    }

    const currentLoadouts = settings.engines?.loadouts || [];
    const newLoadouts = currentLoadouts.map(loadout => {
      if (loadout.id === currentActiveId) {
        // --- Start Modification: Filter instead of toggle --- 
        const currentConfig = loadout.config || []; // Get the actual saved config for this loadout
        const updatedConfig = currentConfig.filter(engine => String(engine.id) !== id);
        // --- End Modification ---
        return { ...loadout, config: updatedConfig };
      }
      return loadout;
    });
    updateSetting('engines', 'loadouts', newLoadouts);
  }
  const updateEngineWeight = (id: string, weight: number) => {
     if (!settings?.engines) {
      setAlertDialogContent({ title: "Error", description: "Settings not fully loaded. Please wait and try again." });
      setIsAlertDialogOpen(true);
      return;
    }
    // Starter check removed - UI prevents this call
    const currentActiveId = activeEngineLoadoutId; // No need for ?? 'starter' here
    const currentLoadouts = settings.engines?.loadouts || [];
    const newLoadouts = currentLoadouts.map(loadout => {
      if (loadout.id === currentActiveId) {
         // Merge with availableEngines to ensure structure, then update weight
        const currentConfig = getCurrentActiveConfig(); // Get full config first
        const updatedConfig = currentConfig.map(engine =>
          String(engine.id) === id ? { ...engine, weight } : engine
        );
        return { ...loadout, config: updatedConfig };
      }
      return loadout;
    });
    updateSetting('engines', 'loadouts', newLoadouts);
  }
  // updateEngineProperty and handleEngineUpdate removed

  // Get the name of the active loadout for display
  const activeLoadoutName = useMemo(() => {
     console.log("[EnginesSettings activeLoadoutName] activeEngineLoadoutId:", activeEngineLoadoutId);
     if (activeEngineLoadoutId === 'sl-ai') return 'SL-AI';
     if (activeEngineLoadoutId === 'starter') return 'Starter';
     return settings.engines?.loadouts?.find(l => l.id === activeEngineLoadoutId)?.name || 'Unknown';
  }, [activeEngineLoadoutId, settings.engines?.loadouts]);

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
    // Add any other SearXNG categories that might appear
    "knowledge",
    "utility",
    "translate",
    "science",
    "wikimedia" // Added based on backend data
  ]

  // <<< REFACTORED: Function to actually create the loadout after getting name >>>
  const confirmAddLoadout = (newName: string) => {
    // <<< ADDED: Check if settings structure is ready and availableEngines exist >>>
    if (!settings?.engines || !fetchedEngines || fetchedEngines.length === 0) {
      setAlertDialogContent({ 
        title: "Error", 
        description: "Cannot add loadout: Settings or available engines list not ready. Please wait or reload."
      });
      setIsAlertDialogOpen(true);
      setIsNameDialogOpen(false); // Close name dialog on this error
      return;
    }

    const trimmedName = newName.trim();
    if (!trimmedName) {
       setAlertDialogContent({ 
        title: "Invalid Name", 
        description: "Loadout name cannot be empty. Please enter a valid name."
      });
      setIsAlertDialogOpen(true);
      // Keep name dialog open for correction or cancellation
      return; 
    }
    
    const currentLoadouts = settings.engines?.loadouts || [];
    // Check if name already exists
    if (currentLoadouts.some(l => l.name.toLowerCase() === trimmedName.toLowerCase())) {
        setAlertDialogContent({ 
          title: "Duplicate Name", 
          description: `A loadout named "${trimmedName}" already exists. Please choose a different name.`
        });
        setIsAlertDialogOpen(true);
        // Keep name dialog open for correction or cancellation
        return;
    }
    
    // If validations pass, create and save
    const newId = crypto.randomUUID();
    const newLoadoutConfig: Engine[] = [];

    const newLoadout: DisplayLoadout = {
      id: newId,
      name: trimmedName,
      config: newLoadoutConfig,
    };

    // <<< ADDED: Log just before updateSetting >>>
    console.log("DEBUG: Attempting updateSetting. Current settings:", JSON.stringify(settings));
    console.log("DEBUG: Attempting updateSetting. currentLoadouts:", JSON.stringify(currentLoadouts));
    console.log("DEBUG: Attempting updateSetting. newLoadout:", JSON.stringify(newLoadout));

    updateSetting('engines', 'loadouts', [...currentLoadouts, newLoadout]);
    
    setIsNameDialogOpen(false); // Close the name dialog on success
    // Optionally show a success toast/message here (e.g., "Loadout added.")
  };

  // <<< REFACTORED: Handler to OPEN the name dialog >>>
  const handleAddLoadout = () => {
    setNewLoadoutNameInput(""); // Clear previous input
    setIsNameDialogOpen(true); // Open the dialog
  };

  const isStarterActive = (activeEngineLoadoutId ?? 'starter') === 'starter';

  // <<< NEW: Group engines by category for Accordion >>>
  const groupedEngines = useMemo(() => {
    if (!activeConfig) return {};

    // Helper to get a consistent display name for a category ID
    const getCategoryDisplayName = (categoryId: string | undefined): string => {
       if (!categoryId) return "Other";
       // Simple mapping for common categories - expand as needed or use a lookup table
       const nameMap: { [key: string]: string } = {
         general: "General",
         web: "Web",
         images: "Images",
         videos: "Videos",
         music: "Music",
         news: "News",
         it: "IT & Development",
         science: "Science",
         files: "Files & Torrents",
         social: "Social Media",
         knowledge: "Knowledge & Reference",
         translate: "Translate",
         utility: "Utility",
         maps: "Maps",
         // Add more mappings as needed based on availableEngines
       };
       return nameMap[categoryId.toLowerCase()] || categoryId.charAt(0).toUpperCase() + categoryId.slice(1); // Capitalize if unknown
    };

    return activeConfig.reduce((acc, engine) => {
      // Use the first category for grouping, default to 'Other'
      const primaryCategory = engine.categories?.[0]?.toLowerCase() || 'other';
      const displayName = getCategoryDisplayName(primaryCategory);

      if (!acc[displayName]) {
        acc[displayName] = [];
      }
      acc[displayName].push(engine);
      return acc;
    }, {} as { [category: string]: Engine[] });

  }, [activeConfig]); // Re-group when activeConfig changes

  // Get sorted category names for rendering order
  const sortedCategories = useMemo(() => Object.keys(groupedEngines).sort(), [groupedEngines]);

  // ADD CONSOLE LOG HERE
  console.log("[EnginesSettings] Rendering. isStarterActive:", isStarterActive, "activeEngineLoadoutId:", activeEngineLoadoutId);

  // <<< ADDED: Log the activeConfig being used for grouping >>>
  useEffect(() => {
    console.log("[Settings Display Debug] Active Config used for grouping:", activeConfig.map(e => ({id: e.id, categories: e.categories, enabled: e.enabled})));
    const socialEnginesInConfig = activeConfig.filter(e => (e.categories || []).includes('social media'));
    console.log(`[Settings Display Debug] Found ${socialEnginesInConfig.length} social media engines directly in activeConfig.`);
  }, [activeConfig]);

  // Memoize loadouts including the static ones for the manager
  const allEngineLoadouts = useMemo(() => {
    const userLoadouts = settings.engines?.loadouts?.filter(l => l.id !== 'starter' && l.id !== 'sl-ai') || [];
    // Manually construct the starter and AI loadouts with the correct type and isLocked property
    const starterLoadout: EngineLoadout = {
      id: 'starter',
      name: 'Starter',
      config: [], // Actual config is handled separately
      isLocked: true
    };
    const aiLoadout: EngineLoadout = {
      id: 'sl-ai',
      name: 'SL-AI',
      config: [], // Config is dynamically determined
      isLocked: true
    };
    // Combine starter, AI, and user loadouts
    return [starterLoadout, aiLoadout, ...userLoadouts];
  }, [settings.engines?.loadouts]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>The Quiver</CardTitle>
        <div className="flex items-center">
          <CardDescription className="mr-1">
             Select your boards (engines) & fine-tune their performance
          </CardDescription>
           <SettingsTooltip content="Activate a loadout using the list below, then configure its engines in the 'Active Engine Configuration' section. Changes are temporary until you save them back to the loadout." />
        </div>
      </CardHeader>
      <CardContent>
        {/* Engine Loadouts Section */}
        <div className="mb-6 pb-6 border-b border-border/40">
          <div className="flex items-center justify-between mb-4"> {/* Use flex for button alignment */}
            <Label className="text-lg font-semibold">Engine Loadouts</Label> 
            <Button size="sm" onClick={handleAddLoadout}> {/* Added Button */}
              <Plus className="h-4 w-4 mr-2" />
              Add Loadout
            </Button>
          </div>
          <LoadoutManager<Engine[]> // Specify Engine[] type
            type="engines"
            loadouts={allEngineLoadouts} // Pass the combined list
            activeLoadoutId={activeEngineLoadoutId}
            currentConfig={activeConfig} // Pass the current engine configuration
            availableEngineDefs={fetchedEngines} // Pass available definitions if needed by manager
            onSaveLoadout={(name, config) => saveLoadout("engines", name, config)}
            onSelectLoadout={(id) => selectLoadout("engines", id)}
            onDeleteLoadout={(id) => {
              // Find the loadout name for the confirmation message
              const loadout = allEngineLoadouts.find(l => l.id === id);
              const loadoutName = loadout?.name || "this loadout";
              // Set content and action for confirmation dialog for ALL loadouts
              setAlertDialogContent({ 
                title: "Confirm Deletion", 
                description: `Are you sure you want to permanently delete the "${loadoutName}" loadout? This action cannot be undone.` 
              });
              setConfirmAction(() => () => { // Store the delete action
                deleteLoadout("engines", id);
                // Logic within deleteLoadout in use-settings handles resetting active ID if needed
              });
              setIsAlertDialogOpen(true); // Open the dialog
            }}
          />
        </div>

        {/* Active Loadout View Box */}
        <Card className="border border-border/60 p-0">
             <div className="flex items-center justify-between p-3 border-b bg-muted/30 rounded-t-lg">
                 <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-md">Active Configuration: {activeLoadoutName}</h4>
                    <SettingsTooltip content="These are the engines and settings currently being used for searches. Modify them below. Use the Loadout Manager above to save this configuration as a new loadout if desired." />
                    <Badge variant={activeEngineLoadoutId === 'starter' ? "secondary" : "outline"} className="text-xs">{getEnabledEngineCount()} Engines</Badge>
                 </div>
             </div>

             {/* Config UI Area */}
             <div className="p-4 space-y-4">
                {/* Check for AI Loadout First */}
                {activeEngineLoadoutId === 'sl-ai' ? (
                  <div className="text-center text-muted-foreground text-sm py-4 border rounded-md bg-muted/50">
                     <p>No need to select engines, the AI will do that for you!</p>
                  </div>
                ) : isStarterActive ? (
                  // Show this message when Starter is active
                  <div className="text-center text-muted-foreground text-sm py-4 border rounded-md bg-muted/50">
                     <p>This profile is locked, create a loadout to begin!</p>
                  </div>
                ) : (
                  // Show Add Engine UI and Enabled Engines list for other active loadouts
                  <>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor="category-filter-select">Add Engine</Label>
                      {/* Category Filter Dropdown - Made full width */}
                      <Select 
                        value={addEngineSelectedCategory || "all"}
                        onValueChange={(value) => setAddEngineSelectedCategory(value === "all" ? null : value)}
                      >
                        <SelectTrigger id="category-filter-select" className="w-full">
                          <SelectValue placeholder="Filter by Category..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          {categoryOrder.map((cat: { id: string; name: string }) => (
                            <SelectItem key={cat.id} value={cat.id} className="capitalize">
                              {cat.id}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {/* NEW: Scrollable Engine List */}
                      <ScrollArea className="h-96 w-full rounded-md border p-2 mt-2">
                        <div className="space-y-1">
                          {addableEngines
                            .filter(engine => 
                              !addEngineSelectedCategory || 
                              (engine.categories || []).some(rawCat => rawCat.toLowerCase() === addEngineSelectedCategory)
                            )
                            .map(engine => {
                              const displayCategory = getDisplayCategoryName(engine);
                              return (
                                <div 
                                  key={engine.id} 
                                  className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-sm cursor-pointer border-b border-border last:border-b-0"
                                  onClick={() => addEngine(engine.id)}
                                  title={`Add ${engine.name}`}
                                >
                                  <div className="flex flex-col min-w-0 flex-grow">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm font-medium truncate">{engine.name}</span>
                                      {displayCategory && (
                                        <Badge variant="secondary" className="text-[10px] font-normal px-1 py-0 flex-shrink-0" title={displayCategory}>{displayCategory}</Badge>
                                      )}
                                      {engine.shortcut && (
                                        <Badge variant="secondary" className="text-[10px] font-mono font-normal px-1 py-0 flex-shrink-0" title={`Shortcut: ${engine.shortcut}`}>{engine.shortcut}</Badge>
                                      )}
                                    </div>
                                    {engine.description && (
                                      <span className="text-[11px] text-muted-foreground mt-0.5 whitespace-normal" title={engine.description}>
                                        {engine.description}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          {addableEngines.filter(engine => 
                              !addEngineSelectedCategory || 
                              (engine.categories || []).some(rawCat => rawCat.toLowerCase() === addEngineSelectedCategory)
                            ).length === 0 && (
                            <p className="text-sm text-muted-foreground px-4 py-2 text-center">
                              {addableEngines.length === 0 ? "All available engines are currently in this loadout." : "No engines match this category filter."}
                            </p>
                          )}
                        </div>
                      </ScrollArea>
                    </div>
                  
                    {/* List of Enabled Engines */}
                    <div className="space-y-3 pt-4 border-t">
                      <h5 className="text-sm font-medium text-muted-foreground mb-2">Enabled Engines:</h5>
                      {activeConfig.filter(engine => engine.enabled).map(engine => {
                        // const isStarterActive = activeEngineLoadoutId === 'starter' || activeEngineLoadoutId === null; // This local const is not needed due to outer conditional
                        return (
                          <div 
                            key={engine.id}
                            className={`border border-border/40 rounded-md p-3 bg-background space-y-3`}
                          >
                            {/* Top Row */}
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center min-w-0">
                                <span className="font-medium text-base">{engine.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                {engine.shortcut && (
                                  <Badge variant="secondary" className="text-[11px] font-normal px-1.5 py-0.5">
                                    {engine.shortcut}
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-[11px] font-normal px-1.5 py-0.5">{getDisplayCategoryName(engine)}</Badge>
                                <Badge variant="secondary" className="text-[11px] font-normal px-1.5 py-0.5">
                                  t/o: {engine.timeout || '3.0'}s
                                </Badge>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                  onClick={() => removeEngineFromLoadout(engine.id)}
                                  title={"Remove this engine"} // Simplified title as this block is not for starter
                                  // disabled is not needed as this block is not for starter
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </div>
                            {/* Second Row: Slider */} 
                            <div className="grid grid-cols-1 gap-4 items-end overflow-hidden">
                              <div className="space-y-1">
                                <Label className="text-xs">Weight: {engine.weight.toFixed(1)}</Label> 
                                <Slider 
                                  defaultValue={[engine.weight * 10]} 
                                  value={[engine.weight * 10]} 
                                  max={10} 
                                  step={1} 
                                  onValueChange={(value) => updateEngineWeight(engine.id, value[0] / 10)} 
                                  className="pt-1" 
                                  // disabled is not needed as this block is not for starter
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {getEnabledEngineCount() === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">No engines enabled in this loadout. Use the dropdown above to add some.</p>
                      )}
                    </div>
                  </>
                )}
             </div>
        </Card>

      </CardContent>

      {/* Alert Dialog for validation messages - MOVED HERE */}
      <AlertDialog open={isAlertDialogOpen} onOpenChange={setIsAlertDialogOpen}>
         <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{alertDialogContent?.title || "Alert"}</AlertDialogTitle>
            <AlertDialogDescription>
              {alertDialogContent?.description || "An unexpected issue occurred."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {confirmAction ? (
              <>
                <AlertDialogCancel onClick={() => { setConfirmAction(null); setIsAlertDialogOpen(false); }}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => { 
                  confirmAction(); // Execute the stored action
                  setConfirmAction(null); // Clear the action
                  setIsAlertDialogOpen(false); // Close dialog
                }}>Delete</AlertDialogAction>
              </>
            ) : (
              <AlertDialogAction onClick={() => setIsAlertDialogOpen(false)}>OK</AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog for entering Loadout Name - MOVED HERE */}
      <Dialog open={isNameDialogOpen} onOpenChange={setIsNameDialogOpen}>
         <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Engine Loadout</DialogTitle>
            <DialogDescription>
              Enter a name for your new loadout. You can configure its engines after saving.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="loadout-name" className="text-right">
                Name
              </Label>
              <Input 
                id="loadout-name"
                value={newLoadoutNameInput}
                onChange={(e) => setNewLoadoutNameInput(e.target.value)}
                className="col-span-3" 
                placeholder="e.g., My Default Search"
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" onClick={() => confirmAddLoadout(newLoadoutNameInput)}>Save Loadout</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </Card>
  )
}
