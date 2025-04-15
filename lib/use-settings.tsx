"use client";

import type React from "react";
import { useState, useEffect, createContext, useContext, useCallback } from "react";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

// Keep the imports from the schema file
import {
  type AppSettings,
  appSettingsSchema,
  type engineSchema,
  type sourceListItemSchema,
  type EngineLoadout,
  type SourceLoadout,
  type ObsidianSourceConfig,
  type LocalFilesSourceConfig,
  type AISourceConfig,
  type YouTubeSourceConfig,
  type SoundCloudSourceConfig,
  type SourceListItem,
  type Engine
} from "./settings-schema";

// Ensure these types are exported
export type {
  AppSettings,
  EngineLoadout,
  SourceLoadout,
  ObsidianSourceConfig,
  LocalFilesSourceConfig,
  AISourceConfig,
  YouTubeSourceConfig,
  SoundCloudSourceConfig,
  SourceListItem,
  Engine
};
export { appSettingsSchema }; // Export value separately
// No need to re-export schema types directly if only used internally or via AppSettings

// Define the context type
// Ensure this type is exported
export type { SettingsContextType };
interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  error: string | null;
  isInitialLoadComplete: boolean;
  updateSetting: (
    section: keyof AppSettings | keyof AppSettings["personalSources"], // Allow top-level or personalSources sections
    key: string, // Key within the section or specific source ID
    value: any
  ) => void;
  saveSettings: () => Promise<void>;
  resetSettings: () => Promise<void>;
  saveLoadout: (type: "engines" | "surf", name: string, config: any) => void;
  selectLoadout: (type: "engines" | "surf", id: string) => void;
  deleteLoadout: (type: "engines" | "surf", id: string) => void;
}

// Create the context with a default value
const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

// --- Keep Default Settings Definition Here ---
const defaultSettings: AppSettings = {
  general: {
    instanceName: "SlySearch",
    resultsPerPage: "10",
    safeSearch: "0",
    defaultLanguage: "auto",
    openNewTab: true,
    infiniteScroll: true,
    ragEnabled: false,
    autocomplete: true,
    autocompleteMin: "4",
    faviconResolver: "off",
    banTime: "5",
    maxBanTime: "120",
    searchOnCategory: true,
  },
  engines: {
    engine_list: [],
    loadouts: [],
  },
  privacy: {
    proxyImages: true,
    removeTrackers: true,
    blockCookies: false,
    queryInTitle: false,
    method: "POST",
    urlAnonymizer: false,
  },
  appearance: {
    resultsLayout: "list",
    theme: "cyberpunk",
    centerAlignment: false,
    defaultLocale: "auto",
    hotkeys: "default",
    urlFormat: "pretty",
  },
  advanced: {
    instanceUrl: "http://localhost:8888",
    requestTimeout: "5",
    maxRequestTimeout: "10",
    formats: ["json", "html"],
    headlessMode: false,
    enableResultProxy: false,
    resultProxyUrl: "",
    resultProxyKey: "",
    poolConnections: "100",
    poolMaxsize: "20",
    enableHttp2: true,
    customCss: "",
    debugMode: false,
    redisUrl: undefined,
    limiter: false,
    publicInstance: false,
  },
  personalSources: {
    sources: [
      { id: "normal", label: "Web", icon: "Zap", color: "#176BEF", gradient: "from-[#176BEF]/70 to-[#FF3E30]/70" },
      { id: "obsidian", label: "Obsidian", icon: "Brain", color: "#7E6AD7", gradient: "from-[#7E6AD7]/70 to-[#9C87E0]/70" },
      { id: "localFiles", label: "Files", icon: "FileText", color: "#F7B529", gradient: "from-[#FF3E30]/70 to-[#F7B529]/70" },
      { id: "ai", label: "AI", icon: "Bot", color: "#10B981", gradient: "from-[#10B981]/70 to-[#059669]/70" },
      { id: "youtube", label: "YouTube", icon: "Youtube", color: "#FF0000", gradient: "from-[#FF0000]/70 to-[#CC0000]/70" },
      { id: "soundcloud", label: "SoundCloud", icon: "Music", color: "#FF7700", gradient: "from-[#FF7700]/70 to-[#FF3300]/70" },
    ],
    loadouts: [],
    obsidian: { useLocalPlugin: false, path: undefined, vaultName: undefined, apiPort: undefined, pluginApiKey: undefined },
    localFiles: { fileTypes: "md,txt,pdf", useIndexer: false, path: undefined },
    ai: { provider: "openai", model: "gpt-4o", temperature: "0.7", maxTokens: "1000", apiKey: undefined, baseUrl: undefined },
    youtube: { maxResults: "10", includeChannels: true, includePlaylists: true, apiKey: undefined },
    soundcloud: { maxResults: "10", includeUsers: true, includePlaylists: true, clientId: undefined },
  },
};

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // State Hooks
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState(false);

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
          throw new Error(`API fetch failed with status: ${response.status}`); // Trigger catch block for fallback
        }

        const data = await response.json();
        const validationResult = appSettingsSchema.safeParse(data);

        if (validationResult.success) {
          loadedSettings = validationResult.data;
          loadedSource = "API";
          localStorage.setItem("slysearch-settings", JSON.stringify(validationResult.data)); // Cache valid data
          console.log("Successfully loaded and validated settings from API:", loadedSettings);
        } else {
          console.error("API data validation failed:", validationResult.error.errors);
          setError("Loaded settings from API are invalid. Using fallback.");
          throw new Error("API data validation failed"); // Trigger catch block for fallback
        }

      } catch (err: any) {
        console.warn(`Initial load/validation failed (${err.message}). Attempting localStorage fallback...`);
         const savedSettings = localStorage.getItem("slysearch-settings");
         if (savedSettings) {
             try {
                 const parsedSettings = JSON.parse(savedSettings);
            const validationResult = appSettingsSchema.safeParse(parsedSettings);
            if (validationResult.success) {
              loadedSettings = validationResult.data;
              loadedSource = "localStorage";
              console.log("Successfully loaded and validated settings from localStorage.");
              // Optionally set error if API failed initially
              if (err.message !== "API data validation failed") {
                setError(`API Error (${err.message}): Using local backup.`);
              }
            } else {
              console.error("localStorage data validation failed:", validationResult.error.errors);
              setError("Stored settings in localStorage are invalid. Using defaults.");
              localStorage.removeItem("slysearch-settings"); // Clear invalid data
            }
             } catch (e) {
                 console.error("Failed to parse saved settings from localStorage:", e);
            setError("Could not parse localStorage settings. Using defaults.");
            localStorage.removeItem("slysearch-settings"); // Clear invalid data
          }
        }
         // If no valid settings from API or localStorage, use defaults
        if (!loadedSettings) {
            setError(prevError => prevError || "Could not load settings. Using defaults."); // Preserve earlier error if relevant
        }
      }

      // Set state with validated data or defaults
      setSettings(loadedSettings || defaultSettings);

      // Finalize loading state
      setLoading(false);
      setIsInitialLoadComplete(true);
      console.log(`Settings load complete. Source: ${loadedSource}`);
    };

    loadInitialSettings();
  }, []);

  // --- Update a specific setting in local state ---
  const updateSetting = useCallback((section: keyof AppSettings | keyof AppSettings["personalSources"], key: string, value: any) => {
    setSettings((prev) => {
      const newSettings = JSON.parse(JSON.stringify(prev));
      if (newSettings[section]) {
        (newSettings[section] as any)[key] = value;
      }
      console.log(`Updated local setting state ${section}.${key} to:`, value);
      return newSettings;
    });
  }, []);

  // --- Save settings to API ---
  const saveSettings = useCallback(async () => {
    if (!isInitialLoadComplete || isSaving) return;
    setIsSaving(true);
    setError(null);
    console.log("Attempting to save settings to API via proxy...");
    let settingsJson: string;
    try {
      settingsJson = JSON.stringify(settings);
      console.log("Successfully stringified settings for saving.");
    } catch(stringifyError: any) {
      console.error("*** Failed to stringify settings object! ***", stringifyError);
      console.error("Settings object that failed stringify:", settings);
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
          console.log(`Saved new engine loadout: ${name}`);
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

        setError(null);
        return newSettings;
      });
    },
    [setError]
  );

  const selectLoadout = useCallback((type: "engines" | "surf", id: string) => {
    setSettings((prev) => {
      const newSettings = JSON.parse(JSON.stringify(prev));
      let selectedLoadoutConfig: Engine[] | SourceListItem[] | undefined;
      let loadoutFound = false;

      if (type === "engines") {
        const loadout = prev.engines?.loadouts?.find(l => l.id === id);
        if (loadout) {
          selectedLoadoutConfig = loadout.config;
          if (!newSettings.engines) newSettings.engines = {};
          newSettings.engines.engine_list = selectedLoadoutConfig ?? [];
          console.log(`Selected engine loadout: ${loadout.name}`);
          loadoutFound = true;
        }
      } else { // type === "surf"
        const loadout = prev.personalSources?.loadouts?.find(l => l.id === id);
        if (loadout) {
          selectedLoadoutConfig = loadout.config;
          if (!newSettings.personalSources) newSettings.personalSources = {};
          newSettings.personalSources.sources = selectedLoadoutConfig ?? [];
           console.log(`Selected surf loadout: ${loadout.name}`);
           loadoutFound = true;
        }
      }

      if (!loadoutFound) {
          console.warn(`Loadout with ID ${id} not found for type ${type}.`);
          return prev;
      }

      return newSettings;
    });
  }, []);

  const deleteLoadout = useCallback((type: "engines" | "surf", id: string) => {
    setSettings((prev) => {
      const newSettings = JSON.parse(JSON.stringify(prev));
      let loadoutDeleted = false;

      if (type === "engines") {
        if (newSettings.engines?.loadouts) {
          const initialLength = newSettings.engines.loadouts.length;
          newSettings.engines.loadouts = newSettings.engines.loadouts.filter((l: EngineLoadout) => l.id !== id);
          if (newSettings.engines.loadouts.length < initialLength) {
              loadoutDeleted = true;
          }
        }
      } else { // type === "surf"
        if (newSettings.personalSources?.loadouts) {
          const initialLength = newSettings.personalSources.loadouts.length;
          newSettings.personalSources.loadouts = newSettings.personalSources.loadouts.filter((l: SourceLoadout) => l.id !== id);
          if (newSettings.personalSources.loadouts.length < initialLength) {
              loadoutDeleted = true;
          }
        }
      }

      if (loadoutDeleted) {
          console.log(`Deleted loadout with ID: ${id} for type ${type}`);
          return newSettings;
      } else {
          console.warn(`Loadout with ID ${id} not found for deletion for type ${type}.`);
          return prev;
      }
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
