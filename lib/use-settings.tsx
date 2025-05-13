"use client";

import type React from "react";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { toast } from "sonner"

// Keep the imports from the schema file
import {
  type AppSettings,
  appSettingsSchema,
  type sourceListItemSchema,
  type EngineLoadout,
  type SourceLoadout,
  type ObsidianSourceConfig,
  type LocalFilesSourceConfig,
  type AISourceConfig,
  type MusicSourceConfig,
  type PhotosSourceConfig,
  type SourceListItem,
  type Engine,
  type YouTubeSourceConfig,
  type FreshRSSSourceConfig
} from "./settings-schema";

// Ensure these types are exported
export type {
  AppSettings,
  EngineLoadout,
  SourceLoadout,
  ObsidianSourceConfig,
  LocalFilesSourceConfig,
  AISourceConfig,
  MusicSourceConfig,
  PhotosSourceConfig,
  YouTubeSourceConfig,
  SourceListItem,
  Engine,
  SettingsContextType,
  FreshRSSSourceConfig
};
export { appSettingsSchema }; // Export value separately
// No need to re-export schema types directly if only used internally or via AppSettings

// Define the context type
interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  isInitialLoadComplete: boolean;
  availableEngines: Engine[];
  activeEngineLoadoutId: string | null;
  updateSetting: (
    section: keyof AppSettings | keyof AppSettings["personalSources"] | "engines",
    key: string,
    value: any
  ) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
  saveLoadout: (type: "engines" | "surf", name: string, config: any) => void;
  selectLoadout: (type: "engines" | "surf", id: string) => void;
  deleteLoadout: (type: "engines" | "surf", id: string) => void;
}

// --- Create Migration Helper ---
function migrateSettingsStructure(settings: AppSettings): AppSettings {
  // This migration strategy allows for gradual transition of settings
  // Legacy fields are maintained for backward compatibility
  // while new structure is being adopted across the application
  const migratedSettings = { ...settings };
  
  // Move settings from advanced to their new locations
  if (migratedSettings.advanced) {
    // Move to general
    if (migratedSettings.general && !migratedSettings.general.instanceUrl) {
      migratedSettings.general.instanceUrl = migratedSettings.advanced.instanceUrl;
      migratedSettings.general.requestTimeout = migratedSettings.advanced.requestTimeout;
      migratedSettings.general.maxRequestTimeout = migratedSettings.advanced.maxRequestTimeout;
      migratedSettings.general.debugMode = migratedSettings.advanced.debugMode;
    }
    
    // Move to privacy
    if (migratedSettings.privacy) {
      if (migratedSettings.advanced.enableResultProxy !== undefined && migratedSettings.privacy.enableResultProxy === undefined) {
        migratedSettings.privacy.enableResultProxy = migratedSettings.advanced.enableResultProxy;
        migratedSettings.privacy.resultProxyUrl = migratedSettings.advanced.resultProxyUrl;
        migratedSettings.privacy.resultProxyKey = migratedSettings.advanced.resultProxyKey;
      }
    }
  }
  
  return migratedSettings;
}

// Create the context with a default value
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// --- Keep Default Settings Definition Here ---
const defaultSettings: AppSettings = {
  general: {
    showGrid: true,
    showSuggestions: true,
    searchDebounce: 150,
    maxResults: 10,
    safeSearch: "moderate",
    searchLanguage: "en-US",
  },
  appearance: {
    theme: "default",
    fontFamily: "sans-serif",
    layout: "grid",
    showResultIcons: true,
    openLinksInNewTab: true,
  },
  advanced: {
    formats: ["json", "html"],
    headlessMode: false,
    poolConnections: "100",
    poolMaxsize: "20",
    enableHttp2: true,
    redisUrl: undefined,
    limiter: false,
    publicInstance: false,
    instanceUrl: "http://127.0.0.1:8000",
    requestTimeout: "5",
    maxRequestTimeout: "10",
    enableResultProxy: false,
    resultProxyUrl: "",
    resultProxyKey: "",
    debugMode: false,
  },
  personalSources: {
    sources: [
        { id: "web", label: "Web", icon: "Zap", color: "#176BEF", gradient: "themed-gradient-transparent" },
        { id: "obsidian", label: "Obsidian", icon: "Brain", color: "#7E6AD7", gradient: "themed-gradient-transparent" },
        { id: "localFiles", label: "Files", icon: "FileText", color: "#F7B529", gradient: "themed-gradient-transparent" },
        { id: "ai", label: "AI", icon: "Bot", color: "#10B981", gradient: "themed-gradient-transparent" },
        { id: "youtube", label: "YouTube", icon: "Youtube", color: "#FF0000", gradient: "themed-gradient-transparent" },
        { id: "music", label: "Music", icon: "Music", color: "#FF7700", gradient: "themed-gradient-transparent" },
        { id: "photos", label: "Photos", icon: "Image", color: "#3498DB", gradient: "themed-gradient-transparent" },
        { id: "freshrss", label: "FreshRSS", icon: "Rss", color: "#FFA500", gradient: "themed-gradient-transparent" },
    ],
    loadouts: [],
    obsidian: { 
      useLocalPlugin: false, 
      path: undefined, 
      vaultName: undefined, 
      apiPort: 7777,
      pluginApiKey: undefined, 
      resultsPerPage: 10,
      defaultObsidianView: 'list', 
      resultsColumns: 4,
      excludedFolders: [],
      openNewTab: true
    },
    localFiles: { 
      fileTypes: ["md", "txt", "pdf"],
      useIndexer: false, 
      path: undefined,
      resultsPerPage: 10,
      openNewTab: true
    },
    ai: { 
      provider: 'openai',
      model: "gpt-4o", 
      temperature: 0.7, 
      maxTokens: 1000, 
      apiKey: undefined, 
      baseUrl: undefined,
      resultsPerPage: 1,
      openNewTab: true
    },
    youtube: { 
      path: undefined, 
      download_base_path: undefined, 
      resultsPerPage: 10,
      defaultYouTubeView: 'card', 
      resultsColumns: 4, 
      openNewTab: true,
      invidiousInstance: "yewtu.be",
    },
    music: { 
      path: undefined, 
      resultsPerPage: 10,
      openNewTab: true 
    },
    photos: { 
      path: undefined, 
      resultsPerPage: 10,
      defaultPhotosView: 'card',
      resultsColumns: 4,
      openNewTab: true 
    },
    web: { 
      resultsPerPage: 10,
      defaultWebView: 'list',
      resultsColumns: 4,
      openNewTab: true,
      searchOnCategory: true,
    },
    freshrss: {
      base_url: undefined,
      username: undefined,
      api_password: undefined,
      resultsPerPage: 10,
      openNewTab: true,
    },
  },
  waveRacer: {
    // Default wave racer settings can go here
  },
  engines: {
    loadouts: [],
    activeLoadoutId: null,
  },
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // State Hooks
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);
  const [availableEngines, setAvailableEngines] = useState<Engine[]>([]);

  // --- Load settings on mount from API ---
  useEffect(() => {
    const loadInitialSettings = async () => {
      setLoading(true);
      setError(null);
      setIsInitialLoadComplete(false);
      let loadedSettings: AppSettings | null = null;
      let loadedSource = "defaults";

      try {
        console.log("Attempting to load settings from API via proxy...");
        const response = await fetch("/api/settings", {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });

        if (!response.ok) {
          throw new Error(`API fetch failed with status: ${response.status}`); 
        }

        const data = await response.json();
        // --- LOGGING 1: Raw API Data ---
        console.log("[DEBUG] Raw data received from /api/settings:", JSON.stringify(data, null, 2)); 
        // --- END LOGGING 1 ---
        
        const validationResult = appSettingsSchema.safeParse(data);

        if (validationResult.success) {
          loadedSettings = validationResult.data;
          loadedSource = "API";
          console.log("Successfully loaded and validated settings from API:", loadedSettings);
        } else {
          // --- LOGGING 2: Zod Validation Errors ---
          console.error("[DEBUG] Zod validation failed. Raw Data was:", JSON.stringify(data, null, 2));
          console.error("[DEBUG] Zod validation errors:", JSON.stringify(validationResult.error.errors, null, 2));
          // --- END LOGGING 2 ---
          setError("Loaded settings from API are invalid. Using fallback.");
          throw new Error("API data validation failed"); 
        }

      } catch (err: any) {
        console.warn(`Initial load/validation failed (${err.message}). Using defaults.`);

        // If no valid settings from API (localStorage fallback removed), use defaults
        if (!loadedSettings) {
            setError(prevError => prevError || "Could not load settings. Using defaults."); // Preserve earlier error if relevant
        }
      }

      // Get potentially loaded settings or use null
      const baseSettings = loadedSettings || {}; 

      // Apply migration to move settings to their new locations
      const migratedBaseSettings = migrateSettingsStructure(baseSettings);

      // Construct finalSettings ensuring type safety
      const finalSettings: AppSettings = {
        ...defaultSettings, // Start with all defaults
        ...migratedBaseSettings, // Override with loaded and migrated top-level settings
        
        // Explicitly construct engines object, ensuring non-null properties
        engines: {
          loadouts: migratedBaseSettings.engines?.loadouts ?? defaultSettings.engines!.loadouts,
          activeLoadoutId: migratedBaseSettings.engines?.activeLoadoutId ?? defaultSettings.engines!.activeLoadoutId,
        },
        
        // Explicitly construct personalSources, ensuring non-null properties
        personalSources: {
          ...defaultSettings.personalSources, // Start with defaults for sub-configs like ai, obsidian etc.
          ...(migratedBaseSettings.personalSources || {}), // Override with loaded sub-configs if present
          // Ensure required arrays are present
          sources: migratedBaseSettings.personalSources?.sources ?? defaultSettings.personalSources!.sources,
          loadouts: migratedBaseSettings.personalSources?.loadouts ?? defaultSettings.personalSources!.loadouts,
        }
      };
      
      // --- LOGGING 3: Final Settings Object Before Set ---
      console.log("[DEBUG] Final settings object before setting state:", JSON.stringify(finalSettings, null, 2));
      // --- END LOGGING 3 ---

      setSettings(finalSettings);

      // ----> APPLY THEME DIRECTLY AFTER SETTINGS ARE FINALIZED <----
      if (finalSettings.appearance?.theme) {
        console.log("[THEME DEBUG USE_SETTINGS] Applying initial theme from loaded settings:", finalSettings.appearance.theme);
        document.documentElement.dataset.theme = finalSettings.appearance.theme;
        // Also update localStorage here to be sure it's in sync with the loaded setting
        try {
          localStorage.setItem('selected-theme', finalSettings.appearance.theme);
        } catch (e) {
          console.warn('Failed to set initial theme in localStorage from useSettings', e);
        }
      } else {
        console.log("[THEME DEBUG USE_SETTINGS] No theme found in finalSettings.appearance, default will apply from ThemeSwitcher or CSS.");
      }

      // ----> STORE FONT PREFERENCE FROM LOADED SETTINGS <----
      if (finalSettings.appearance?.font) {
        console.log("[FONT DEBUG USE_SETTINGS] Storing initial font from loaded settings:", finalSettings.appearance.font);
        try {
          localStorage.setItem('selected-font', finalSettings.appearance.font);
          // If we wanted to also set a data-font attribute for other uses:
          // document.documentElement.dataset.font = finalSettings.appearance.font;
        } catch (e) {
          console.warn('Failed to set initial font in localStorage from useSettings', e);
        }
      } else {
        console.log("[FONT DEBUG USE_SETTINGS] No font found in finalSettings.appearance.");
      }

      // Finalize loading state
      setLoading(false);
      setIsInitialLoadComplete(true);
      console.log(`Settings load complete. Source: ${loadedSource}`);

      // Fetch available engines AFTER initial settings load
      try {
        console.log("Attempting to fetch available engines from API...");
        const engineResponse = await fetch("/api/searxng/engines", {
          method: "GET",
          headers: { Accept: "application/json" },
          signal: AbortSignal.timeout(8000),
        });
        if (!engineResponse.ok) {
          // Don't throw fatal error, just log and proceed without available engines
          console.error(`Failed to fetch available engines: ${engineResponse.status} ${engineResponse.statusText}`);
          setError(prevError => prevError ? `${prevError} | Failed to fetch engines.` : "Failed to fetch available engines.");
        } else {
          const engineData = await engineResponse.json();
          // Basic validation: check if it's an array
          if (Array.isArray(engineData)) {
            // Assuming the backend returns data conforming to the Engine schema
            setAvailableEngines(engineData as Engine[]);
            console.log(`Successfully fetched ${engineData.length} available engines.`);
            console.log("useSettings: availableEngines state updated", engineData);
          } else {
            console.error("Invalid format received for available engines (expected array).");
            setError(prevError => prevError ? `${prevError} | Invalid engine list format.` : "Invalid format for available engines.");
          }
        }
      } catch (engineErr: any) {
         console.error("Error fetching available engines:", engineErr);
         setError(prevError => prevError ? `${prevError} | Error fetching engines.` : `Error fetching available engines: ${engineErr.message}`);
      }
    };

    loadInitialSettings();
  }, []);

  // --- Update a specific setting in local state ---
  const updateSetting = useCallback((section: keyof AppSettings | keyof AppSettings["personalSources"] | "engines", key: string, value: any) => {
    // --- LOGGING 4: Inside updateSetting ---
    console.log(`[DEBUG] updateSetting called with section: ${String(section)}, key: ${key}, value:`, value);
    // --- END LOGGING 4 ---
    setSettings((prev) => {
      const newSettings = JSON.parse(JSON.stringify(prev));

      // Handle top-level sections like 'general', 'privacy', etc.
      if (section !== "personalSources" && section !== "engines" && newSettings[section]) {
        (newSettings[section] as any)[key] = value;
        if (section === "appearance" && key === "theme") {
          console.log("[THEME DEBUG] updateSetting for appearance.theme with value:", value);
        }
      } 
      // Handle personal source specific settings (e.g., obsidian.path)
      else if (section === "personalSources" && newSettings.personalSources && newSettings.personalSources[key as keyof AppSettings["personalSources"]]) {
         (newSettings.personalSources as any)[key] = value;
      } 
      // Handle engines.activeLoadoutId
      else if (section === "engines" && newSettings.engines && key === "activeLoadoutId") {
         newSettings.engines.activeLoadoutId = value;
      } 
      // Handle engines.loadouts
      else if (section === "engines" && newSettings.engines && key === "loadouts") {
         // Ensure value is an array (or default to empty)
         newSettings.engines.loadouts = Array.isArray(value) ? value : [];
      }
      // Handle other potential keys within personalSources or engines if needed
      else {
        console.warn(`Attempted to update non-existent path: ${String(section)}.${key}`);
        return prev; // Return previous state if path is invalid
      }

      console.log(`Updated local setting state ${String(section)}.${key} to:`, value);
      return newSettings;
    });
  }, []);

  // --- Save settings to API ---
  const saveSettings = useCallback(async () => {
    if (!isInitialLoadComplete || isSaving) return;
    setIsSaving(true);
    setError(null);
    console.log("Attempting to save settings to API via proxy...");
    
    // Apply migration before saving to ensure newest structure
    const migratedSettings = migrateSettingsStructure(settings);
    console.log("[THEME DEBUG] Settings object before stringify in saveSettings:", migratedSettings);
    console.log("[THEME DEBUG] Appearance settings before stringify in saveSettings:", migratedSettings.appearance);
    
    let settingsJson: string;
    try {
      settingsJson = JSON.stringify(migratedSettings);
      console.log("Successfully stringified settings for saving.");
    } catch(stringifyError: any) {
      console.error("*** Failed to stringify settings object! ***", stringifyError);
      console.error("Settings object that failed stringify:", migratedSettings);
      setError("Failed to prepare settings for saving. Invalid data detected.");
      setIsSaving(false);
      return; // Stop execution if stringify fails
    }

    try {
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: settingsJson,
        signal: AbortSignal.timeout(8000),
      });
      if (!response.ok) {
         const errorBody = await response.json().catch(() => ({}));
         throw new Error(errorBody.error || `Failed to save settings: ${response.status} ${response.statusText}`);
      }
      console.log("Successfully saved settings via API.");
    } catch (err: any) {
      // Comprehensive error logging strategy helps with debugging
      // Multiple log formats expose different aspects of errors
      // especially useful for network/API issues that may manifest in various ways
      console.error("Error during fetch/save operation (raw object):", err);
      console.error("Type of error object caught:", typeof err);
      const message = err instanceof Error ? err.message : String(err);
      console.error("Error during fetch/save operation (processed message):", message);
      setError(message || "Failed to save settings due to an unexpected error.");
    } finally {
      setIsSaving(false);
    }
  }, [settings, isInitialLoadComplete, isSaving, setError]);

  // --- Reset settings ---
  const resetSettings = useCallback(async () => {
    if (isSaving) return;
    console.log("Resetting settings to defaults...");
    setIsSaving(true);
    setError(null);
    try {
      setSettings(defaultSettings);
      localStorage.removeItem("slysearch-settings");
      const response = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(defaultSettings),
        signal: AbortSignal.timeout(8000),
      });
       if (!response.ok) {
         const errorBody = await response.json().catch(() => ({}));
         throw new Error(errorBody.error || `Failed to save default settings: ${response.status}`);
       }
      console.log("Successfully reset settings by saving defaults to API.");
    } catch (err: any) {
       console.error("Error resetting settings:", err);
       setError(err.message || "Failed to reset settings.");
    } finally {
       setIsSaving(false);
    }
  }, [isSaving]);

  // --- Loadout functions ---
  const saveLoadout = useCallback(
    (
      type: "engines" | "surf",
      name: string,
      config: any
    ) => {
      if (type === "engines" && name.toLowerCase() === "starter") {
         console.error("Cannot save loadout with the reserved name 'Starter'.");
         setError("Cannot save loadout with the reserved name 'Starter'.");
         return;
      }
      setError(null);
      setSettings((prev) => {
        const newSettings = JSON.parse(JSON.stringify(prev));
        let existingLoadoutFound = false;

        if (type === "engines") {
          existingLoadoutFound = !!prev.engines?.loadouts?.some(l => l.name === name);
          if (existingLoadoutFound) {
            console.warn(`Engine loadout named "${name}" already exists.`);
            setError(`An engine loadout named "${name}" already exists.`);
            return prev;
          }
          if (!newSettings.engines) newSettings.engines = { loadouts: [] };
          if (!newSettings.engines.loadouts) newSettings.engines.loadouts = [];
          const id = uuidv4();
          newSettings.engines.loadouts.push({ id, name, config: (config as Engine[] | undefined) ?? [] });
          console.log(`Saved new engine loadout: ${name} with ID: ${id}`);
        } else if (type === "surf") {
          existingLoadoutFound = !!prev.personalSources?.loadouts?.some(l => l.name === name);
          if (existingLoadoutFound) {
            console.warn(`Surf loadout named "${name}" already exists.`);
            setError(`A surf loadout named "${name}" already exists.`);
            return prev;
          }
          if (!newSettings.personalSources) newSettings.personalSources = { loadouts: [] };
          if (!newSettings.personalSources.loadouts) newSettings.personalSources.loadouts = [];
          const id = uuidv4();
          newSettings.personalSources.loadouts.push({ id, name, config: (config as SourceListItem[] | undefined) ?? [] });
          console.log(`Saved new surf loadout: ${name}`);
        }

        return newSettings;
      });
    },
    [setError]
  );

  const selectLoadout = useCallback((type: "engines" | "surf", id: string) => {
    if (type === "engines") {
      // Validate the ID before setting it
      // Allow 'starter', 'sl-ai', or any ID present in the saved loadouts
      const isValid = id === "starter" || id === "sl-ai" || settings.engines?.loadouts?.some(l => l.id === id);
      if (isValid) {
        console.log(`Setting active engine loadout ID to: ${id}`);
        updateSetting("engines", "activeLoadoutId", id);
      } else {
        console.error(`Attempted to select non-existent engine loadout ID: ${id}`);
        setError(`Loadout with ID ${id} not found.`);
      }
    } else if (type === "surf") {
      // Logic for selecting surf loadouts (if needed, might need similar active ID approach)
      console.warn("Surf loadout selection logic needs review/implementation.");
      // Existing logic that modifies personalSources.sources directly:
      setSettings((prev) => {
        const newSettings = JSON.parse(JSON.stringify(prev));
        const loadout = prev.personalSources?.loadouts?.find(l => l.id === id);
        if (loadout) {
          if (!newSettings.personalSources) newSettings.personalSources = { loadouts: [], sources: [] };
          newSettings.personalSources.sources = loadout.config ?? [];
          console.log(`Selected surf loadout: ${loadout.name}`);
          return newSettings;
        } else {
          console.warn(`Surf loadout with ID ${id} not found.`);
          return prev;
        }
      });
    }
  }, [settings, settings.engines?.loadouts, updateSetting]);

  const deleteLoadout = useCallback((type: "engines" | "surf", id: string) => {
    setError(null);
    setSettings((prev) => {
      const newSettings = JSON.parse(JSON.stringify(prev));
      let loadoutDeleted = false;
      let previousActiveId = prev.engines?.activeLoadoutId;

      if (type === "engines") {
        if (newSettings.engines?.loadouts) {
          const initialLength = newSettings.engines.loadouts.length;
          const remainingLoadouts = newSettings.engines.loadouts.filter((l: EngineLoadout) => String(l.id) !== id);
          if (remainingLoadouts.length < initialLength) {
              newSettings.engines.loadouts = remainingLoadouts;
              loadoutDeleted = true;
              console.log(`Deleted engine loadout with ID: ${id}`);

              // If the deleted loadout was the active one...
              if (previousActiveId === id) {
                 // Select the first remaining loadout (could be starter if it wasn't deleted, or another one)
                 // If no loadouts remain, activeLoadoutId becomes null (backend handles null ok)
                 const nextActiveId = remainingLoadouts.length > 0 ? remainingLoadouts[0].id : null;
                 console.log(`Deleted active engine loadout. Setting active ID to: ${nextActiveId}`);
                 newSettings.engines.activeLoadoutId = nextActiveId;
              }
          }
        }
      } else { // type === "surf"
        if (newSettings.personalSources?.loadouts) {
          const initialLength = newSettings.personalSources.loadouts.length;
          newSettings.personalSources.loadouts = newSettings.personalSources.loadouts.filter((l: SourceLoadout) => String(l.id) !== id);
          if (newSettings.personalSources.loadouts.length < initialLength) {
              loadoutDeleted = true;
              console.log(`Deleted surf loadout with ID: ${id}`);
              // Add logic here if surf loadouts ever have an 'active' state to reset
          }
        }
      }

      if (!loadoutDeleted) {
          console.warn(`Loadout with ID ${id} not found for deletion for type ${type}.`);
      }

      return newSettings;
    });
  }, []);

  const contextValue: SettingsContextType = {
    settings,
    updateSetting,
    saveSettings,
    resetSettings,
    saveLoadout,
    selectLoadout,
    deleteLoadout,
    loading: loading || isSaving,
    error,
    isInitialLoadComplete,
    availableEngines,
    activeEngineLoadoutId: settings.engines?.activeLoadoutId ?? "starter",
  };

  // Provide the context value to children
  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
