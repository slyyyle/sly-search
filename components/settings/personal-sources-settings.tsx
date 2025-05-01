"use client"

import { useState, useEffect } from "react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsTooltip } from "@/components/settings-tooltip"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  Brain,
  Zap,
  FileText,
  Database,
  Globe,
  Book,
  Settings2,
  Bot,
  Music,
  Loader2,
  Check,
  Youtube,
  Image,
  List,
  LayoutGrid,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadoutManager } from "@/components/loadout-manager"
import { useSettings, type AppSettings } from "@/lib/use-settings"
import { ObsidianVaultBrowser } from "@/components/obsidian-vault-browser"
import { cn } from "@/lib/utils"
import type { SearchResultItem, WebResult, ObsidianResult } from "@/types/search"
import { 
  type EngineSettingsItem, 
  appSettingsSchema,
  type WebSourceConfig,
  type ObsidianSourceConfig,
  type LocalFilesSourceConfig,
  type AISourceConfig,
  type MusicSourceConfig,
  type YouTubeSourceConfig,
  type PhotosSourceConfig
} from "@/lib/settings-schema"

// --- Define type for valid source config keys --- START ---
// Get keys from the *non-optional* shape of the personalSources object schema
type PersonalSourcesShapeKeys = keyof typeof appSettingsSchema.shape.personalSources._def.innerType.shape;
// Exclude 'sources' and 'loadouts'
type SourceConfigKey = Exclude<PersonalSourcesShapeKeys, 'sources' | 'loadouts'>;
// Add 'web' to the list of valid keys we might handle configs for
const validSourceKeys: SourceConfigKey[] = ['web', 'obsidian', 'localFiles', 'ai', 'youtube', 'music', 'photos'];
// Type for the actual config objects
type AnySourceConfig = 
  | ObsidianSourceConfig 
  | LocalFilesSourceConfig 
  | AISourceConfig 
  | YouTubeSourceConfig 
  | MusicSourceConfig 
  | PhotosSourceConfig
  | WebSourceConfig // Add WebSourceConfig to the union type
// --- Define type for valid source config keys --- END ---

// Define interface for a single source
interface Source {
  id: string;
  label: string;
  icon: string;
  color: string;
  gradient: string;
  type?: string;
  // Add other source-specific properties if needed
  path?: string;
  vaultName?: string;
  // Add fields for AI, YouTube, Music etc. based on AppSettings
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxResults?: number;
  // clientId?: string; // Removed as MusicSourceConfig doesn't have it anymore
}

// Define props interface
interface PersonalSourcesSettingsProps {
  settings: AppSettings['personalSources']; // Expecting the 'personalSources' part of AppSettings
  updateSetting: (section: keyof AppSettings, key: string, value: any) => void;
}

export function PersonalSourcesSettings({ settings, updateSetting }: PersonalSourcesSettingsProps) {
  const { saveLoadout, selectLoadout, deleteLoadout } = useSettings()

  // Default settings within the component
  const currentSources = settings?.sources || [
      { id: "normal", label: "Web", icon: "Zap", color: "#176BEF", gradient: "from-[#176BEF]/70 to-[#FF3E30]/70" },
      { id: "obsidian", label: "Obsidian", icon: "Brain", color: "#7E6AD7", gradient: "from-[#7E6AD7]/70 to-[#9C87E0]/70" },
      { id: "localFiles", label: "Files", icon: "FileText", color: "#F7B529", gradient: "from-[#FF3E30]/70 to-[#F7B529]/70" },
      { id: "ai", label: "AI", icon: "Bot", color: "#10B981", gradient: "from-[#10B981]/70 to-[#059669]/70" },
      { id: "youtube", label: "YouTube", icon: "Youtube", color: "#FF0000", gradient: "from-[#FF0000]/70 to-[#CC0000]/70" },
      { id: "music", label: "Music", icon: "Library", color: "#FF7700", gradient: "from-[#FF7700]/70 to-[#FF3300]/70" },
      { id: "photos", label: "Photos", icon: "Image", color: "#3498DB", gradient: "from-[#3498DB]/70 to-[#2980B9]/70" },
    ];
  // Remove unused surfLoadouts state
  // const surfLoadouts = settings?.loadouts || []; 

  const [sources, setSources] = useState<Source[]>(currentSources);
  const [newSource, setNewSource] = useState<Source>({
    id: "",
    label: "",
    icon: "Database",
    color: "#176BEF",
    gradient: "from-[#176BEF]/70 to-[#FF3E30]/70",
  })
  const [newSourceType, setNewSourceType] = useState<string>("");
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false)
  const [isBrowserDialogOpen, setIsBrowserDialogOpen] = useState(false)
  // Add state for temporary path input
  const [tempObsidianPath, setTempObsidianPath] = useState<string>("");
  // Add state for vault check
  const [vaultCheckStatus, setVaultCheckStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [vaultCheckError, setVaultCheckError] = useState<string | null>(null);
  const [isAddingSource, setIsAddingSource] = useState<boolean>(false);
  const [dialogViewSelection, setDialogViewSelection] = useState<'list' | 'card'>('list');
  // State to hold temporary values while the dialog is open
  const [dialogTempSettings, setDialogTempSettings] = useState<Record<string, any>>({});

  // --- State for Input Validation in Dialog ---
  const [tempInputValues, setTempInputValues] = useState<{ [key: string]: string }>({});
  const [inputErrors, setInputErrors] = useState<{ [key: string]: string | null }>({});
  // --- End State for Input Validation ---

  // Effect to load current path into temp state OR reset check state
  useEffect(() => {
    if (isSourceDialogOpen && selectedSource) {
      // Initialize temporary settings state with current settings for the selected source
      const currentSettingsForSource = getSelectedSourceSettings();
      const currentSource = sources.find(s => s.id === selectedSource); // Find the source object
      const initialLabel = currentSource?.label ?? ''; // Get its current label

      // Deep copy to avoid modifying the original settings object indirectly
      // Use structuredClone for a more robust deep copy if available, otherwise JSON parse/stringify
      let initialDialogState: Record<string, any> = {}; // Ensure type
      try {
        initialDialogState = structuredClone(currentSettingsForSource || {});
      } catch (e) {
        console.warn("structuredClone not available, falling back to JSON.parse/stringify for deep copy.");
        initialDialogState = JSON.parse(JSON.stringify(currentSettingsForSource || {}));
      }

      // Explicitly add the label to the initial temporary state
      initialDialogState.label = initialLabel;

      setDialogTempSettings(initialDialogState); // Set the combined initial state

      // Also reset the separate tempInputValues used for numeric input feedback and errors
      setTempInputValues({});
      setInputErrors({}); // Reset errors when dialog opens

      // When dialog opens for Obsidian, load the path (if applicable)
      if (selectedSource === 'obsidian') {
        // The vault path should be part of currentSettingsForSource now
        const currentPath = currentSettingsForSource?.path ?? "";
        // No need to set tempObsidianPath separately if it's in dialogTempSettings
        // setTempObsidianPath(currentPath);
        // Reset vault check status when dialog opens for obsidian
        setVaultCheckStatus('idle');
        setVaultCheckError(null);
      }
    } else {
      // Reset Obsidian check state when dialog closes or no source is selected
      setVaultCheckStatus('idle');
      setVaultCheckError(null);
    }
    // Dependencies: Only run when dialog opens/closes or selected source changes
  }, [isSourceDialogOpen, selectedSource, sources]); // Added sources dependency

  // Update sources in settings
  const updateSources = (newSources: Source[]) => {
    setSources(newSources)
    updateSetting("personalSources", "sources", newSources)
  }

  // Reset newSource form and hide form
  const resetAndHideAddSourceForm = () => {
    setNewSource({
      id: "",
      label: "",
      icon: "Database",
      color: "#176BEF",
      gradient: "from-[#176BEF]/70 to-[#FF3E30]/70",
    });
    setNewSourceType("");
    setIsAddingSource(false);
  };

  // Add a new source
  const addSource = () => {
    if (newSource.id && newSource.label && newSourceType) {
      // Simple validation: Ensure ID is unique
      if (sources.some(s => s.id === newSource.id)) {
        alert("Source ID must be unique.");
        return;
      }
      const sourceToAdd: Source = {
        ...newSource,
        type: newSourceType.toLowerCase()
      };
      const updatedSources = [...sources, sourceToAdd]
      updateSources(updatedSources)
      resetAndHideAddSourceForm(); // Reset and hide form after adding
    }
  }

  // Remove a source
  const removeSource = (id: string) => {
    const updatedSources = sources.filter((source) => source.id !== id)
    updateSources(updatedSources)
  }

  // Move a source up in the list
  const moveSourceUp = (index: number) => {
    if (index > 0) {
      const updatedSources = [...sources]
      const temp = updatedSources[index]
      updatedSources[index] = updatedSources[index - 1]
      updatedSources[index - 1] = temp
      updateSources(updatedSources)
    }
  }

  // Move a source down in the list
  const moveSourceDown = (index: number) => {
    if (index < sources.length - 1) {
      const updatedSources = [...sources]
      const temp = updatedSources[index]
      updatedSources[index] = updatedSources[index + 1]
      updatedSources[index + 1] = temp
      updateSources(updatedSources)
    }
  }

  // Open source settings dialog
  const openSourceSettings = (sourceId: string) => {
    // Don't open settings dialog for "normal" (web) source
    if (sourceId === "normal") {
      // Show a message to users that these settings have been moved
      alert("Web search settings have been moved to the Surf Lineup tab.");
      return;
    }
    setSelectedSource(sourceId)
    setIsSourceDialogOpen(true)
  }

  // Define default configurations - Explicitly type them with imported schema types
  const defaultAISettings: AISourceConfig = { provider: "openai", model: "gpt-4o", temperature: 0.7, maxTokens: 1000, apiKey: undefined, baseUrl: undefined, resultsPerPage: 1, openNewTab: true };
  const defaultMusicSettings: MusicSourceConfig = { path: undefined, resultsPerPage: 10, openNewTab: true };
  // Ensure all relevant fields from schema have defaults
  const defaultObsidianSettings: ObsidianSourceConfig = { 
    useLocalPlugin: false, 
    path: undefined, 
    vaultName: undefined, 
    apiPort: 7777, 
    pluginApiKey: undefined,
    resultsPerPage: 10, 
    defaultObsidianView: 'list', 
    resultsColumns: 4, 
    excludedFolders: [], 
    openNewTab: true, 
  };
  const defaultLocalFilesSettings: LocalFilesSourceConfig = { 
    path: undefined, 
    fileTypes: "md,txt,pdf", 
    useIndexer: false, 
    resultsPerPage: 10, 
    openNewTab: true, 
  };
  const defaultYouTubeSettings: YouTubeSourceConfig = { 
    path: undefined, 
    download_base_path: undefined, 
    resultsPerPage: 10, 
    defaultYouTubeView: 'card', 
    resultsColumns: 4, 
    openNewTab: true,
    invidiousInstance: "yewtu.be"
  };
  const defaultPhotosSettings: PhotosSourceConfig = { 
    path: undefined, 
    resultsPerPage: 10, 
    defaultPhotosView: 'card', 
    resultsColumns: 4, 
    openNewTab: true, 
  };
  const defaultWebSettings: WebSourceConfig = { 
    resultsPerPage: 10, 
    defaultWebView: 'list', 
    resultsColumns: 4, 
    openNewTab: true, 
    searchOnCategory: true 
  };

  // Get the correctly typed settings object for the currently selected source,
  // merging current settings with defaults to ensure all keys exist.
  const getSelectedSourceSettings = (): Record<string, any> => {
    if (!selectedSource) return {};

    // Access the *specific* configuration for the source directly from the main settings prop
    const currentSourceConfig = settings ? settings[selectedSource as keyof typeof settings] : undefined;

    switch (selectedSource) {
      case "normal": // Handle the 'normal' ID used for Web
        return { ...defaultWebSettings, ...(currentSourceConfig as WebSourceConfig || {}) };
      case "obsidian":
        return { ...defaultObsidianSettings, ...(currentSourceConfig as ObsidianSourceConfig || {}) };
      case "localFiles":
        return { ...defaultLocalFilesSettings, ...(currentSourceConfig as LocalFilesSourceConfig || {}) };
      case "ai":
        return { ...defaultAISettings, ...(currentSourceConfig as AISourceConfig || {}) };
      case "youtube":
        return { ...defaultYouTubeSettings, ...(currentSourceConfig as YouTubeSourceConfig || {}) };
      case "music":
        return { ...defaultMusicSettings, ...(currentSourceConfig as MusicSourceConfig || {}) };
      case "photos":
        return { ...defaultPhotosSettings, ...(currentSourceConfig as PhotosSourceConfig || {}) };
      default:
        // Return the specific config if it exists, otherwise an empty object
        return currentSourceConfig || {};
    }
  };

  // Update a specific setting for the selected source
  const updateSelectedSourceSetting = (key: string, value: any) => {
    if (!selectedSource) return;

    // Get the current specific config based on the selected source ID
    let currentConfig: Record<string, any> | undefined;
    switch (selectedSource) {
        case "obsidian": currentConfig = settings?.obsidian; break;
        case "localFiles": currentConfig = settings?.localFiles; break;
        case "ai": currentConfig = settings?.ai; break;
        case "youtube": currentConfig = settings?.youtube; break;
        case "music": currentConfig = settings?.music; break;
        case "photos": currentConfig = settings?.photos; break;
        default: console.warn("Attempting to update settings for unknown source type:", selectedSource); return;
    }

    // Create the updated configuration object for this source type
    const updatedConfig = {
      ...(currentConfig || {}),
      [key]: value,
    };

    // Call the main updateSetting from props, passing the source ID as the key
    // within the 'personalSources' section, and the complete updated config object as the value.
    updateSetting("personalSources", selectedSource, updatedConfig);
  };

  // Available icons
  const icons = [
    { value: "Zap", label: "Zap" },
    { value: "Brain", label: "Brain" },
    { value: "FileText", label: "File" },
    { value: "Database", label: "Database" },
    { value: "Globe", label: "Globe" },
    { value: "Book", label: "Book" },
    { value: "Bot", label: "Bot" },
    { value: "Youtube", label: "YouTube" },
    { value: "Library", label: "Music" },
    { value: "Image", label: "Photos" },
  ]

  // Icon preview component
  const IconPreview = ({ iconName }: { iconName: string }) => {
    switch (iconName) {
      case "Zap":
        return <Zap className="h-4 w-4" />
      case "Brain":
        return <Brain className="h-4 w-4" />
      case "FileText":
        return <FileText className="h-4 w-4" />
      case "Database":
        return <Database className="h-4 w-4" />
      case "Globe":
        return <Globe className="h-4 w-4" />
      case "Book":
        return <Book className="h-4 w-4" />
      case "Bot":
        return <Bot className="h-4 w-4" />
      case "Youtube":
        return <Youtube className="h-4 w-4" />
      case "Library":
        return <Music className="h-4 w-4" />
      case "Image":
        return <Image className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  // --- Function to check vault validity ---
  const handleCheckVault = async () => {
    setVaultCheckStatus('checking');
    setVaultCheckError(null);
    console.log(`[Vault Check] Checking path: ${tempObsidianPath}`);

    // Basic client-side check
    if (!tempObsidianPath || !tempObsidianPath.startsWith('/')) {
      setVaultCheckStatus('invalid');
      setVaultCheckError('Invalid path format. Please provide an absolute path.');
      console.error('[Vault Check] Invalid path format provided by user');
      return;
    }

    // Construct URL for the Next.js proxy API route
    const url = new URL('/api/check/obsidian', window.location.origin);
    url.searchParams.set('path', tempObsidianPath); // Pass the path to check

    try {
      const response = await fetch(url.toString());
      const data = await response.json(); // Assume backend always returns JSON

      if (!response.ok) {
        setVaultCheckStatus('invalid');
        // Specific message and log level for 404
        if (response.status === 404) {
          console.log(`[Vault Check] API returned 404 (Path not found)`, data); // Log as info
          setVaultCheckError("Path not found. Please check the path is correct and accessible by the server.");
        } else {
          // Log other errors as errors
          console.error(`[Vault Check] API error: ${response.status}`, data);
          setVaultCheckError(data.error || `API Error: ${response.status}`);
        }
      } else if (data.valid === true) {
        // Handle success case
        setVaultCheckStatus('valid');
        console.log('[Vault Check] Path appears valid.');
      } else {
        // Handle case where backend says path is invalid (e.g., no .obsidian)
        setVaultCheckStatus('invalid');
        setVaultCheckError(data.error || "Path check failed: '.obsidian' directory not found.");
        console.log(`[Vault Check] Path invalid: ${data.error}`);
      }
    } catch (fetchError) {
      // Handle network errors
      console.error("[Vault Check] Failed to fetch from API:", fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : "Unknown network error.";
      setVaultCheckStatus('invalid');
      setVaultCheckError(`Network Error: ${errorMessage}`);
    }
  };
  // --- End Vault Check Function ---

  // --- Helper to get display text for source type from ID ---
  const getSourceTypeDisplay = (id: string): string | null => {
    // Find the source object by ID first
    const source = sources.find(s => s.id === id);
    // Get the type, could be from the source object or the ID itself if not mapped
    const type = source?.type ?? id;

    switch (type) {
      case 'normal': return 'Web Search'; // Display 'Web Search' for 'normal' type/ID
      case 'obsidian': return 'Obsidian';
      case 'localFiles': return 'Local Files';
      case 'ai': return 'AI';
      case 'youtube': return 'YouTube';
      case 'music': return 'Music';
      case 'photos': return 'Photos';
      default: return id; // Fallback for custom types - display the ID
    }
  };
  // --- End Helper ---

  // --- Unified Input Change Handler (Updates Temporary State) ---
  const handleDialogInputChange = (
    fieldName: string,
    value: string | number | boolean | string[] // Allow string array for specific fields
  ) => {
    // Handle array fields specifically if needed, otherwise treat as before
    let valueToStore = value;
    if (fieldName === 'excludedFolders' || fieldName === 'fileTypes') {
      // Ensure it's always an array, even if input processing yields something else temporarily
      if (!Array.isArray(value)) {
        console.warn(`Expected array for ${fieldName} but got ${typeof value}. Storing as empty array.`);
        valueToStore = [];
      }
      // console.log(`Storing array for ${fieldName}:`, valueToStore);
    }

    // Always update the main temporary settings state
    setDialogTempSettings(prev => ({
      ...prev,
      [fieldName]: valueToStore
    }));

    // If this field had a raw input value tracked, clear it now
    // as the canonical value is now in dialogTempSettings.
    // Do NOT clear errors here; validation handles that.
    if (tempInputValues.hasOwnProperty(fieldName)) {
       setTempInputValues(prev => {
           const newValues = { ...prev };
           delete newValues[fieldName]; // Remove the raw value override
           return newValues;
       });
    }
    // Clear any previous error for this field *if it wasn't a numeric validation failure*
    // Numeric validation will set its own errors in validateNumericInput
    if (inputErrors.hasOwnProperty(fieldName) && typeof value !== 'number') {
         setInputErrors(prev => {
             const newErrors = { ...prev };
             newErrors[fieldName] = null; // Clear non-numeric error
             return newErrors;
         });
    }
  };
  // --- End Unified Input Handler ---

  // --- Numeric Input Validation (Updates Raw Input & Errors) ---
  const validateNumericInput = (
    fieldName: string,
    value: string, // Raw string value from input
    min: number,
    max: number,
    errorMessage: string
  ): boolean => { // Return boolean indicating validity
     // 1. Update the temporary RAW string value for display
    setTempInputValues(prev => ({ ...prev, [fieldName]: value }));

    // 2. Validation
    let isValid = true;
    let error: string | null = null;

    if (value.trim() === '') {
      error = 'Cannot be empty.';
      isValid = false;
    } else {
        const numValue = parseInt(value, 10);
        if (isNaN(numValue)) {
            error = 'Must be a number.';
            isValid = false;
        } else if (numValue < min || numValue > max) {
            error = errorMessage;
            isValid = false;
        }
    }

    // 3. Update errors state
    setInputErrors(prev => ({ ...prev, [fieldName]: error }));

    // 4. If valid, update the numeric value in the main temporary settings state
    if (isValid) {
      // Directly update dialogTempSettings with the parsed number
      setDialogTempSettings(prev => ({
        ...prev,
        [fieldName]: parseInt(value, 10) // Store as number
      }));
    }
     // If invalid, dialogTempSettings retains the LAST valid numeric value (or initial)
     // because handleDialogInputChange wasn't called with the invalid parsed number.
     // The raw input (tempInputValues) shows the invalid text, and the error message appears.

    return isValid;
  };
  // --- End Numeric Validation ---

  // --- Helper to get current input value for display ---
  const getDialogInputValue = (fieldName: string, fallbackValue: string | number): string => {
    // 1. Prioritize the raw temporary input value if it exists (shows user's exact typed input)
    if (tempInputValues.hasOwnProperty(fieldName)) {
      return tempInputValues[fieldName];
    }
    // 2. Fallback to the value in the temporary settings object
    const tempSettingValue = dialogTempSettings?.[fieldName];
    if (tempSettingValue !== undefined && tempSettingValue !== null) {
      return String(tempSettingValue); // Convert to string for input field
    }
    // 3. Fallback to the original setting's value (only relevant before any edits)
    // This step might be redundant if dialogTempSettings is always initialized correctly.
    // const originalSettingValue = getSelectedSourceSettings()?.[fieldName];
    // if (originalSettingValue !== undefined && originalSettingValue !== null) {
    //   return String(originalSettingValue);
    // }
    // 4. Use the provided fallback if nothing else is found
    return String(fallbackValue);
  };
  // --- End Helper ---

  // --- Apply Changes Handler ---
  const handleApplyChanges = () => {
    if (!selectedSource) return;

    // Check if any errors exist in the inputErrors state
    const hasErrors = Object.values(inputErrors).some(err => err !== null);

    if (hasErrors) {
      console.warn("Cannot apply changes due to validation errors.", inputErrors);
      // TODO: Show a user-facing message here (e.g., using a toast)
       alert("Please fix the errors before applying changes."); // Simple alert for now
      return; // Prevent saving if any validation error exists
    }

    // Validation passed, proceed to update settings
    console.log(`Applying changes for ${selectedSource}:`, dialogTempSettings);
    updateSetting("personalSources", selectedSource, dialogTempSettings);

    // *** Add logic to update the label in the main sources array ***
    const newLabel = dialogTempSettings?.label;
    if (typeof newLabel === 'string') {
      const sourceIndex = sources.findIndex(s => s.id === selectedSource);
      if (sourceIndex !== -1) {
        const updatedSources = [...sources]; // Create a copy
        updatedSources[sourceIndex] = { ...updatedSources[sourceIndex], label: newLabel }; // Update the label
        setSources(updatedSources); // Update local state for immediate UI feedback
        updateSources(updatedSources); // Persist the change to the main settings
        console.log(`Updated label for ${selectedSource} in sources array to: ${newLabel}`);
      }
    }
    // *** End label update logic ***

    // Close the dialog and reset states
    setIsSourceDialogOpen(false);
    // Reset temporary states AFTER closing animation potentially (or immediately)
    // Setting state synchronously before closing might be cleaner
    setDialogTempSettings({});
    setTempInputValues({});
    setInputErrors({});
    setSelectedSource(null); // Clear selected source
  };
  // --- End Apply Changes ---

  // --- Cancel Changes Handler ---
  const handleCancelChanges = () => {
    setIsSourceDialogOpen(false);
    // Reset temporary states AFTER closing animation potentially (or immediately)
    setDialogTempSettings({});
    setTempInputValues({});
    setInputErrors({});
    setSelectedSource(null); // Clear selected source
  };
  // --- End Cancel Changes ---

  // +++ Add Helper Function to Render Dialog Form +++
  const renderSourceSettingsForm = () => {
    if (!selectedSource) return null; // Should not happen if dialog is open, but good practice

    const source = sources.find(s => s.id === selectedSource);
    const sourceType = source?.type ?? selectedSource;

    switch (sourceType) {
      case 'obsidian': {
        const isListView = dialogTempSettings?.defaultObsidianView === 'list';
        return (
          <>
            {/* General Settings: Label */}
            <div className="space-y-1">
                <Label htmlFor="dialog-source-label">Display Label</Label>
                <Input
                  id="dialog-source-label"
                  value={dialogTempSettings?.label ?? sources.find(s => s.id === selectedSource)?.label ?? 'Obsidian'} // Bind to temp state, fallback to current source label or default
                  onChange={(e) => handleDialogInputChange('label', e.target.value)} // Update temp state
                  placeholder="Source display name"
                />
            </div>
            <Separator className="my-4" />
            {/* Obsidian Specific Settings */}
            <div className="space-y-2">
              <Label htmlFor="obsidian-path">Vault Path (on Server)</Label>
              <SettingsTooltip content="The absolute path to your Obsidian vault on the server running SlySearch backend." />
              <div className="flex items-center space-x-2">
                <Input
                  id="obsidian-path"
                  placeholder="/path/to/your/vault"
                  value={dialogTempSettings?.path ?? ''} // Bind to temp state
                  onChange={(e) => {
                    handleDialogInputChange('path', e.target.value); // Update temp state
                    setVaultCheckStatus('idle'); // Reset check on path change
                    setVaultCheckError(null);
                  }}
                />
                {/* Vault Check Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCheckVault}
                  disabled={vaultCheckStatus === 'checking' || !dialogTempSettings?.path}
                 >
                  {vaultCheckStatus === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Check"
                  )}
                </Button>
               </div>
              {/* Display vault check status/error */}
              {vaultCheckStatus === 'checking' && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Checking...
                </p>
              )}
              {vaultCheckStatus === 'invalid' && vaultCheckError && (
                <p className="text-xs text-red-500 mt-1">{vaultCheckError}</p>
              )}
              {vaultCheckStatus === 'valid' && (
                <p className="text-xs text-green-500 mt-1 flex items-center">
                  <Check className="h-3 w-3 mr-1" /> Vault path appears valid.
                </p>
              )}
            </div>

            {/* Vault Name (Optional) */}
             <div className="space-y-1">
               <Label htmlFor="obsidian-vault-name">Vault Name (Optional)</Label>
                <SettingsTooltip content="Overrides the vault's folder name in the UI (e.g., 'My Notes')." />
               <Input
                 id="obsidian-vault-name"
                 value={dialogTempSettings?.vaultName ?? ''} // Bind to temp state
                 onChange={(e) => handleDialogInputChange('vaultName', e.target.value)} // Update temp state
                 placeholder="Display name for vault"
               />
             </div>

             {/* Excluded Folders */}
             <div className="space-y-1">
               <Label htmlFor="obsidian-excluded-folders">Exclude Folders (Comma-separated)</Label>
                <SettingsTooltip content="List of folder names (case-sensitive) within the vault to exclude from search indexing." />
               <Input
                 id="obsidian-excluded-folders"
                  // Join array from temp state for display, handle potential undefined/null
                 value={Array.isArray(dialogTempSettings?.excludedFolders) ? dialogTempSettings.excludedFolders.join(', ') : ''}
                 onChange={(e) => {
                   const folders = e.target.value
                     .split(',') // Split by comma
                     .map(f => f.trim()) // Trim whitespace
                     .filter(f => f); // Remove empty strings
                   handleDialogInputChange('excludedFolders', folders); // Update temp state with array
                 }}
                 placeholder="e.g., _templates, private, .git"
               />
             </div>

            {/* === Results View === */}
            <div className="space-y-1">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-default-obsidian-view`}>Results View</Label>
                <SettingsTooltip content="Default view mode (List or Card) for Obsidian results." />
              </div>
              <Select
                value={dialogTempSettings?.defaultObsidianView ?? 'list'} // Bind to temp state
                onValueChange={(value: 'list' | 'card') => {
                  handleDialogInputChange('defaultObsidianView', value); // Update temp state
                }}
              >
                <SelectTrigger id={`${sourceType}-default-obsidian-view`}>
                  <SelectValue placeholder="Select default view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">
                    <div className="flex items-center">
                      <List className="h-4 w-4 mr-2" />
                      List
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center">
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Card
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* === Results Per Page === */}
            <div className="space-y-1">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-results-per-page`}>Results Per Page</Label>
                <SettingsTooltip content="How many results to show per page for this source." />
              </div>
              <Input
                id={`${sourceType}-results-per-page`}
                type="text" // Use text for better validation feedback
                inputMode="numeric" // Hint for mobile keyboards
                value={getDialogInputValue('resultsPerPage', 10)} // Use temp state helper
                onChange={(e) => validateNumericInput( // Use validator
                  'resultsPerPage', e.target.value, 1, 100, 'Must be between 1 and 100.'
                )}
                className={cn(inputErrors.resultsPerPage ? 'border-red-500 focus-visible:ring-red-500' : '')}
                placeholder="10"
              />
              {inputErrors.resultsPerPage && (
                <p className="text-xs text-red-500 mt-1">{inputErrors.resultsPerPage}</p>
              )}
            </div>

            {/* === Results Columns (Conditional) === */}
            {!isListView && ( // Only show if view is Card
              <div className="space-y-1">
                <div className="flex items-center">
                  <Label htmlFor={`${sourceType}-results-columns`}>Results Columns</Label>
                  <SettingsTooltip content="Number of columns for card view results (if card view is selected)." />
                </div>
                <Input
                  id={`${sourceType}-results-columns`}
                  type="text" // Use text for validation
                  inputMode="numeric"
                  value={getDialogInputValue('resultsColumns', 4)} // Use temp state helper
                  onChange={(e) => validateNumericInput( // Use validator
                    'resultsColumns', e.target.value, 1, 10, 'Must be between 1 and 10.'
                  )}
                  className={cn(inputErrors.resultsColumns ? 'border-red-500 focus-visible:ring-red-500' : '')}
                  placeholder="4"
                />
                {inputErrors.resultsColumns && (
                  <p className="text-xs text-red-500 mt-1">{inputErrors.resultsColumns}</p>
                )}
              </div>
            )}
            
            {/* Open New Tab */} 
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
              <div className="space-y-0.5">
                 <Label>Open Links in New Tab</Label>
                 <div className="text-sm text-muted-foreground">Control link behavior for Obsidian notes.</div>
              </div>
              <Switch
                 checked={dialogTempSettings.openNewTab !== false} // Default true
                 onCheckedChange={(checked) => handleDialogInputChange('openNewTab', checked)}
              />
            </div>
          </>
        );
      }
      case 'localFiles': {
        // Use dialogTempSettings for values and handleDialogInputChange for updates
        return (
          <>
            {/* General Settings: Label */}
            <div className="space-y-1">
                <Label htmlFor="dialog-source-label">Display Label</Label>
                <Input
                  id="dialog-source-label"
                  value={dialogTempSettings?.label ?? sources.find(s => s.id === selectedSource)?.label ?? 'Files'} // Bind to temp state, fallback to current source label or default
                  onChange={(e) => handleDialogInputChange('label', e.target.value)} // Update temp state
                  placeholder="Source display name"
                />
            </div>
            <Separator className="my-4" />
            {/* Local Files Specific Settings */}
            <div className="space-y-2">
              <Label htmlFor="localfiles-path">Directory Path (on Server)</Label>
              <SettingsTooltip content="The absolute path to the directory containing files to index on the server." />
              <Input
                id="localfiles-path"
                placeholder="/path/to/your/files"
                value={dialogTempSettings?.path ?? ''} // Bind to temp state
                onChange={(e) => handleDialogInputChange('path', e.target.value)} // Update temp state
              />
               {/* Add folder check/picker later */}
            </div>

            {/* Allowed File Types */}
            <div className="space-y-1">
              <Label htmlFor="localfiles-file-types">Allowed File Types (Comma-separated)</Label>
              <SettingsTooltip content="List of file extensions (e.g., md, txt, pdf) to include in indexing. Leave empty to allow all." />
              <Input
                id="localfiles-file-types"
                // Join array from temp state for display
                value={Array.isArray(dialogTempSettings?.fileTypes) ? dialogTempSettings.fileTypes.join(', ') : ''}
                onChange={(e) => {
                  const types = e.target.value
                    .split(',')
                    .map(t => t.trim().toLowerCase()) // Trim, lowercase
                    .filter(t => t && !t.startsWith('.')); // Remove empty and leading dots
                  handleDialogInputChange('fileTypes', types); // Update temp state with array
                }}
                placeholder="e.g., md, txt, pdf, docx"
              />
            </div>

            {/* Results Per Page Setting */}
            <div className="space-y-1">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-results-per-page`}>Results Per Page</Label>
                <SettingsTooltip content="How many results to show per page for this source." />
              </div>
              <Input
                id={`${sourceType}-results-per-page`}
                type="text" // Use text for validation
                inputMode="numeric"
                value={getDialogInputValue('resultsPerPage', 10)} // Use temp state helper
                onChange={(e) => validateNumericInput( // Use validator
                  'resultsPerPage', e.target.value, 1, 100, 'Must be between 1 and 100.'
                )}
                className={cn(inputErrors.resultsPerPage ? 'border-red-500 focus-visible:ring-red-500' : '')}
                placeholder="10"
              />
              {inputErrors.resultsPerPage && (
                <p className="text-xs text-red-500 mt-1">{inputErrors.resultsPerPage}</p>
              )}
            </div>

            {/* Add Disabled Results View Setting */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-results-view`}>Results View</Label>
                <SettingsTooltip content="How results from this source are displayed (currently fixed to List)." />
              </div>
              <Input
                id={`${sourceType}-results-view`}
                value="List"
                disabled
                className="text-muted-foreground"
              />
            </div>
            
            {/* Open New Tab */} 
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
              <div className="space-y-0.5">
                 <Label>Open Links in New Tab</Label>
                 <div className="text-sm text-muted-foreground">Control link behavior for local files.</div>
              </div>
              <Switch
                 checked={dialogTempSettings.openNewTab !== false} // Default true
                 onCheckedChange={(checked) => handleDialogInputChange('openNewTab', checked)}
              />
            </div>
          </>
        );
      }
      case 'ai': {
         // Bind to dialogTempSettings, use handlers
        return (
          <>
            {/* General Settings: Label */}
            <div className="space-y-1">
                <Label htmlFor="dialog-source-label">Display Label</Label>
                <Input
                  id="dialog-source-label"
                  value={dialogTempSettings?.label ?? sources.find(s => s.id === selectedSource)?.label ?? 'AI'} // Default to the current sources value or AI
                  onChange={(e) => handleDialogInputChange('label', e.target.value)} // Update temp state
                  placeholder="Source display name"
                />
            </div>
            <Separator className="my-4" />
            {/* AI Specific Settings */}
            
            {/* Base URL (Primary setting) */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="ai-base-url">Base URL</Label>
                <SettingsTooltip content="The API endpoint URL for your AI provider. Use default provider URLs or a self-hosted endpoint (e.g., http://localhost:11434/api for Ollama)." />
              </div>
              <Input
                id="ai-base-url"
                type="text"
                value={dialogTempSettings?.baseUrl ?? ''} 
                onChange={(e) => handleDialogInputChange('baseUrl', e.target.value)}
                placeholder="e.g., https://api.openai.com/v1 or http://localhost:11434/api"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="ai-api-key">API Key (Optional)</Label>
                <SettingsTooltip content="Your API key if required by the provider. Local instances like Ollama typically don't need this." />
              </div>
              <Input
                id="ai-api-key"
                type="password"
                value={dialogTempSettings?.apiKey ?? ''}
                onChange={(e) => handleDialogInputChange("apiKey", e.target.value)}
                placeholder="Enter API key if required"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="ai-model">Model</Label>
                <SettingsTooltip content="The AI model to use for generating responses (e.g., gpt-4o, claude-3-opus, llama2)." />
              </div>
              <Input
                id="ai-model"
                value={dialogTempSettings?.model ?? 'gpt-4o'}
                onChange={(e) => handleDialogInputChange("model", e.target.value)}
                placeholder="e.g., gpt-4o, claude-3-haiku, llama2"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="ai-temperature">Temperature</Label>
                <SettingsTooltip content="Controls randomness (0=deterministic, 2=max creative)." />
              </div>
              <div className="flex items-center space-x-2">
                 {/* Use text input + validation for better control */}
                <Input
                  id="ai-temperature"
                  type="text"
                  inputMode="decimal"
                  value={getDialogInputValue('temperature', 0.7)} // Use helper
                   // Update with number validation
                  onChange={(e) => {
                     const val = e.target.value;
                     // Basic check for valid number format before validation
                     if (/^\d*\.?\d*$/.test(val)) {
                         setTempInputValues(prev => ({ ...prev, temperature: val })); // Show raw input
                         const numVal = parseFloat(val);
                         if (!isNaN(numVal) && numVal >= 0 && numVal <= 2) {
                             setInputErrors(prev => ({ ...prev, temperature: null }));
                             handleDialogInputChange('temperature', numVal); // Update if valid
                         } else if (val !== '') { // Don't show error for empty or just "."
                             setInputErrors(prev => ({ ...prev, temperature: null })); // Clear error if empty
                         } else {
                             setInputErrors(prev => ({ ...prev, temperature: null })); // Clear error if empty
                         }
                     }
                   }}
                  className={cn("w-20", inputErrors.temperature ? 'border-red-500 focus-visible:ring-red-500' : '')}
                  placeholder="0.7"
                />
                <span className="text-sm text-muted-foreground"> (0 to 2)</span>
              </div>
               {inputErrors.temperature && (
                 <p className="text-xs text-red-500 mt-1">{inputErrors.temperature}</p>
               )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="ai-max-tokens">Max Tokens</Label>
                <SettingsTooltip content="Max response length in tokens (approx words/chars)." />
              </div>
              <Input
                id="ai-max-tokens"
                type="text" // Use text for validation
                inputMode="numeric"
                value={getDialogInputValue('maxTokens', 1000)} // Use helper
                onChange={(e) => validateNumericInput( // Use validator
                   'maxTokens', e.target.value, 100, 8000, 'Must be 100-8000' // Example range
                )}
                className={cn(inputErrors.maxTokens ? 'border-red-500 focus-visible:ring-red-500' : '')}
                placeholder="1000"
              />
              {inputErrors.maxTokens && (
                 <p className="text-xs text-red-500 mt-1">{inputErrors.maxTokens}</p>
              )}
            </div>

            {/* Results Per Page Setting */}
            <div className="space-y-1">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-results-per-page`}>Results Per Page</Label>
                <SettingsTooltip content="How many results to show per page for this source. (Note: AI source often provides one detailed result)." />
              </div>
              <Input
                id={`${sourceType}-results-per-page`}
                type="text" // Use text for validation
                inputMode="numeric"
                value={getDialogInputValue('resultsPerPage', 1)} // Use helper
                onChange={(e) => validateNumericInput( // Use validator
                  'resultsPerPage', e.target.value, 1, 5, 'Must be 1-5.' // AI likely only needs 1
                )}
                className={cn(inputErrors.resultsPerPage ? 'border-red-500 focus-visible:ring-red-500' : '')}
                placeholder="1"
              />
              {inputErrors.resultsPerPage && (
                <p className="text-xs text-red-500 mt-1">{inputErrors.resultsPerPage}</p>
              )}
            </div>

            {/* Add Disabled Results View Setting */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-results-view`}>Results View</Label>
                <SettingsTooltip content="How results from this source are displayed (currently fixed to Card)." />
              </div>
              <Input
                id={`${sourceType}-results-view`}
                value="Card"
                disabled
                className="text-muted-foreground"
              />
            </div>
            
            {/* Open New Tab (Maybe less relevant for AI? Keep for consistency?) */} 
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
               <div className="space-y-0.5">
                  <Label>Open Links in New Tab</Label>
                  <div className="text-sm text-muted-foreground">Control link behavior (if applicable).</div>
               </div>
               <Switch
                  checked={dialogTempSettings.openNewTab !== false} // Default true
                  onCheckedChange={(checked) => handleDialogInputChange('openNewTab', checked)}
               />
            </div>
          </>
        );
      }
      case 'youtube': {
         // Bind to dialogTempSettings, use handlers
        const isListView = dialogTempSettings?.defaultYouTubeView === 'list';
        return (
          <>
             {/* YouTube Specific Settings */}
            <div className="space-y-1 mb-2">
              <div className="flex items-center">
                <Label htmlFor="youtube-path">Path to Tartube JSON Export File</Label>
                 <SettingsTooltip content={
                      <>
                        Enter the full path to the JSON file exported from Tartube
                        <br />
                        (e.g., /path/to/your/tartube_db_export.json).
                        <br />
                        You can generate this file via Tartube&apos;s &apos;Media &gt; Export from database...&apos; menu, selecting JSON format.
                      </>
                    }
                  />
              </div>
              <Input
                id="youtube-path"
                value={dialogTempSettings?.path ?? ''} // Bind to temp state
                onChange={(e) => handleDialogInputChange('path', e.target.value)} // Update temp state
                placeholder="e.g., /path/to/your/tartube_db_export.json"
              />
            </div>

            <div className="space-y-1 mb-2">
              <div className="flex items-center">
                <Label htmlFor="youtube-download-path">Tartube Download Directory Path</Label>
                  <SettingsTooltip content={
                      <>
                        Enter the full path to the root directory where Tartube
                        <br />
                        downloads videos and creates channel folders
                        <br />
                        (e.g., /path/to/your/tartube/downloads/).
                        <br />
                        This is needed to find local thumbnails.
                      </>
                    }
                  />
              </div>
              <Input
                id="youtube-download-path"
                value={dialogTempSettings?.download_base_path ?? ''} // Bind to temp state
                onChange={(e) => handleDialogInputChange('download_base_path', e.target.value)} // Update temp state
                placeholder="e.g., /path/to/your/tartube/downloads/"
              />
            </div>
            
            {/* General Settings: Display Name - CONVERTED TO INLINE */}
            <div className="flex items-center justify-between space-y-1 mb-2">
              <div className="flex items-center">
                <Label htmlFor="dialog-source-name" className="mr-2">Display Name</Label>
              </div>
              <Input
                id="dialog-source-name"
                value={dialogTempSettings?.label ?? sources.find(s => s.id === 'youtube')?.label ?? 'YouTube'} // Default to the current sources value or YouTube
                onChange={(e) => handleDialogInputChange('label', e.target.value)} // Update temp state
                placeholder="Source display name"
                className="w-48 text-center"
              />
            </div>

            {/* Results Per Page Setting - CONVERTED TO INLINE */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-results-per-page`} className="mr-2">Results Per Page</Label>
                <SettingsTooltip content="Number of results to show per page." />
              </div>
              <Input
                id={`${sourceType}-results-per-page`}
                type="text" // Use text for validation
                inputMode="numeric"
                value={getDialogInputValue('resultsPerPage', 10)} // Use temp state helper
                onChange={(e) => validateNumericInput( // Use validator
                  'resultsPerPage', e.target.value, 1, 100, 'Must be between 1 and 100.'
                )}
                className={cn("w-20 text-center", inputErrors.resultsPerPage ? 'border-red-500 focus-visible:ring-red-500' : '')}
                placeholder="10"
              />
            </div>
            {inputErrors.resultsPerPage && (
              <p className="text-xs text-red-500 mt-1 mb-2">{inputErrors.resultsPerPage}</p>
            )}

            {/* Results View - CONVERTED TO INLINE */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-default-youtube-view`} className="mr-2">Results View</Label>
                <SettingsTooltip content="Default view mode (List or Card) for YouTube results." />
              </div>
              <Select
                value={dialogTempSettings?.defaultYouTubeView ?? 'card'} // Bind to temp state
                onValueChange={(value: 'list' | 'card') => {
                  handleDialogInputChange('defaultYouTubeView', value); // Update temp state
                }}
              >
                <SelectTrigger id={`${sourceType}-default-youtube-view`} className="w-32 text-center">
                  <SelectValue placeholder="Select default view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="list">
                    <div className="flex items-center">
                      <List className="h-4 w-4 mr-2" />
                      List
                    </div>
                  </SelectItem>
                  <SelectItem value="card">
                    <div className="flex items-center">
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Card
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Results Columns Setting (Conditional) - CONVERTED TO INLINE */}
            {!isListView && (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <Label htmlFor={`${sourceType}-results-columns`} className="mr-2">Results Columns</Label>
                  <SettingsTooltip content="Number of columns for card view results." />
                </div>
                <Input
                  id={`${sourceType}-results-columns`}
                  type="text" // Use text for validation
                  inputMode="numeric"
                  value={getDialogInputValue('resultsColumns', 4)} // Use temp state helper
                  onChange={(e) => validateNumericInput( // Use validator
                    'resultsColumns', e.target.value, 1, 10, 'Must be between 1 and 10.'
                  )}
                  className={cn("w-20 text-center", inputErrors.resultsColumns ? 'border-red-500 focus-visible:ring-red-500' : '')}
                  placeholder="4"
                />
              </div>
            )}
            {inputErrors.resultsColumns && (
              <p className="text-xs text-red-500 mt-1 mb-2">{inputErrors.resultsColumns}</p>
            )}
            
            {/* Base Invidious URL - CONVERTED TO INLINE */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-invidious-instance`} className="mr-2">Base Invidious URL</Label>
                <SettingsTooltip content="Select the Invidious instance to use for YouTube video embedding and alternative viewing." />
              </div>
              <Select
                value={dialogTempSettings?.invidiousInstance ?? 'yewtu.be'} // Bind to temp state
                onValueChange={(value: string) => {
                  handleDialogInputChange('invidiousInstance', value); // Update temp state
                }}
              >
                <SelectTrigger id={`${sourceType}-invidious-instance`} className="w-48 text-center">
                  <SelectValue placeholder="Select Invidious instance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="yewtu.be">yewtu.be</SelectItem>
                  <SelectItem value="inv.nadeko.net">inv.nadeko.net</SelectItem>
                  <SelectItem value="invidious.nerdvpn.de">invidious.nerdvpn.de</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );
      }
      case 'music': {
         // Bind to dialogTempSettings, use handlers
        return (
          <div className="space-y-4">
             {/* General Settings: Label */}
             <div className="space-y-1">
                 <Label htmlFor="dialog-source-label">Display Label</Label>
                 <Input
                   id="dialog-source-label"
                   value={dialogTempSettings?.label ?? sources.find(s => s.id === selectedSource)?.label ?? 'Music'} // Bind to temp state, fallback to current source label or default
                   onChange={(e) => handleDialogInputChange('label', e.target.value)} // Update temp state
                   placeholder="Source display name"
                 />
             </div>
             <Separator className="my-4" />
             {/* Music Specific Settings */}
             <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="music-path">Music Library Path (on Server)</Label>
                 <SettingsTooltip content="Absolute path to the root directory containing your music files." />
              </div>
              <Input
                id="music-path"
                value={dialogTempSettings?.path ?? ''} // Bind to temp state
                onChange={(e) => handleDialogInputChange('path', e.target.value)} // Update temp state
                placeholder="/path/to/your/music"
              />
            </div>

            {/* Results Per Page Setting */}
            <div className="space-y-1">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-results-per-page`}>Results Per Page</Label>
                <SettingsTooltip content="How many results to show per page for this source." />
              </div>
              <Input
                id={`${sourceType}-results-per-page`}
                type="text" // Use text for validation
                inputMode="numeric"
                value={getDialogInputValue('resultsPerPage', 10)} // Use temp state helper
                onChange={(e) => validateNumericInput( // Use validator
                  'resultsPerPage', e.target.value, 1, 100, 'Must be between 1 and 100.'
                )}
                className={cn(inputErrors.resultsPerPage ? 'border-red-500 focus-visible:ring-red-500' : '')}
                placeholder="10"
              />
              {inputErrors.resultsPerPage && (
                <p className="text-xs text-red-500 mt-1">{inputErrors.resultsPerPage}</p>
              )}
            </div>

            {/* Add Disabled Results View Setting */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor={`${sourceType}-results-view`}>Results View</Label>
                <SettingsTooltip content="How results from this source are displayed (currently fixed to List)." />
              </div>
              <Input
                id={`${sourceType}-results-view`}
                value="List"
                disabled
                className="text-muted-foreground"
              />
            </div>
            
            {/* Open New Tab */} 
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
               <div className="space-y-0.5">
                  <Label>Open Links in New Tab</Label>
                  <div className="text-sm text-muted-foreground">Control link behavior for music results.</div>
               </div>
               <Switch
                  checked={dialogTempSettings.openNewTab !== false} // Default true
                  onCheckedChange={(checked) => handleDialogInputChange('openNewTab', checked)}
               />
            </div>
          </div>
        );
      }
      case 'photos': {
         // Bind to dialogTempSettings, use handlers
        const isListView = dialogTempSettings?.defaultPhotosView === 'list';
        return (
          <>
               {/* General Settings: Label */}
               <div className="space-y-1">
                   <Label htmlFor="dialog-source-label">Display Label</Label>
                   <Input
                     id="dialog-source-label"
                  value={dialogTempSettings?.label ?? sources.find(s => s.id === 'photos')?.label ?? 'Photos'} // Default to the current sources value or Photos
                     onChange={(e) => handleDialogInputChange('label', e.target.value)} // Update temp state
                     placeholder="Source display name"
                   />
               </div>
               <Separator className="my-4" />
               {/* Photos Specific Settings */}
            <div className="space-y-2">
                <Label htmlFor="photos-path">Library Path (on Server)</Label>
                <SettingsTooltip content="Absolute path to the directory containing photos." />
                <Input
                  id="photos-path"
                  value={dialogTempSettings?.path ?? ''} // Bind to temp state
                  placeholder="/path/to/your/photos"
                  onChange={(e) => handleDialogInputChange('path', e.target.value)} // Update temp state
                />
              </div>

              {/* Results Per Page Setting */}
              <div className="space-y-1">
                <div className="flex items-center">
                  <Label htmlFor={`${sourceType}-results-per-page`}>Results Per Page</Label>
                  <SettingsTooltip content="How many results to show per page for this source." />
                </div>
                <Input
                  id={`${sourceType}-results-per-page`}
                  type="text" // Use text for validation
                  inputMode="numeric"
                  value={getDialogInputValue('resultsPerPage', 10)} // Use temp state helper
                  onChange={(e) => validateNumericInput( // Use validator
                    'resultsPerPage', e.target.value, 1, 100, 'Must be between 1 and 100.'
                  )}
                  className={cn(inputErrors.resultsPerPage ? 'border-red-500 focus-visible:ring-red-500' : '')}
                  placeholder="10"
                />
                {inputErrors.resultsPerPage && (
                  <p className="text-xs text-red-500 mt-1">{inputErrors.resultsPerPage}</p>
                )}
              </div>

              {/* Default Results View Setting */}
              <div className="space-y-1">
                <div className="flex items-center">
                  <Label htmlFor={`${sourceType}-default-photos-view`}>Results View</Label>
                  <SettingsTooltip content="Default view mode (List or Card) for Photos results." />
                </div>
                <Select
                  value={dialogTempSettings?.defaultPhotosView ?? 'card'} // Bind to temp state
                  onValueChange={(value: 'list' | 'card') => {
                    handleDialogInputChange('defaultPhotosView', value); // Update temp state
                  }}
                >
                  <SelectTrigger id={`${sourceType}-default-photos-view`}>
                    <SelectValue placeholder="Select default view" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="list">
                      <div className="flex items-center">
                        <List className="h-4 w-4 mr-2" />
                        List
                      </div>
                    </SelectItem>
                    <SelectItem value="card">
                      <div className="flex items-center">
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Card
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Results Columns Setting (Conditional) */}
              {!isListView && (
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Label htmlFor={`${sourceType}-results-columns`}>Results Columns</Label>
                    <SettingsTooltip content="Number of columns for card view results." />
                  </div>
                  <Input
                    id={`${sourceType}-results-columns`}
                    type="text" // Use text for validation
                    inputMode="numeric"
                    value={getDialogInputValue('resultsColumns', 4)} // Use temp state helper
                    onChange={(e) => validateNumericInput( // Use validator
                      'resultsColumns', e.target.value, 1, 10, 'Must be between 1 and 10.'
                    )}
                    className={cn(inputErrors.resultsColumns ? 'border-red-500 focus-visible:ring-red-500' : '')}
                    placeholder="4"
                  />
                  {inputErrors.resultsColumns && (
                    <p className="text-xs text-red-500 mt-1">{inputErrors.resultsColumns}</p>
                  )}
                </div>
              )}
              
              {/* Open New Tab */} 
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                 <div className="space-y-0.5">
                    <Label>Open Links in New Tab</Label>
                    <div className="text-sm text-muted-foreground">Control link behavior for photo results.</div>
                 </div>
                 <Switch
                    checked={dialogTempSettings.openNewTab !== false} // Default true
                    onCheckedChange={(checked) => handleDialogInputChange('openNewTab', checked)}
                 />
              </div>
          </>
        );
      }
      case 'normal': { // Corresponds to 'web' source config
        // Bind to dialogTempSettings, use handlers
        const isListView = dialogTempSettings?.defaultWebView === 'list';
        return (
          <>
               {/* General Settings: Label */}
               <div className="space-y-1">
                 <Label htmlFor="dialog-source-label">Display Label</Label>
                 <Input
                   id="dialog-source-label"
                  value={dialogTempSettings?.label ?? sources.find(s => s.id === 'normal')?.label ?? 'Web'} // Default to the current sources value or Web
                  onChange={(e) => handleDialogInputChange('label', e.target.value)} // Update temp state
                   placeholder="Source display name"
                 />
               </div>
               <Separator className="my-4" />
            {/* Web Specific Settings */}
              <div className="space-y-1">
                <div className="flex items-center">
                  <Label htmlFor={`${sourceType}-results-per-page`}>Results Per Page</Label>
                  <SettingsTooltip content="How many results to show per page for this source." />
                </div>
                <Input
                  id={`${sourceType}-results-per-page`}
                  type="text"
                  inputMode="numeric"
                  value={getDialogInputValue('resultsPerPage', 10)}
                  onChange={(e) => validateNumericInput(
                    'resultsPerPage', e.target.value, 1, 100, 'Must be between 1 and 100.'
                  )}
                  className={cn(inputErrors.resultsPerPage ? 'border-red-500 focus-visible:ring-red-500' : '')}
                  placeholder="10"
                />
                {inputErrors.resultsPerPage && (
                  <p className="text-xs text-red-500 mt-1">{inputErrors.resultsPerPage}</p>
                )}
              </div>

              {/* Results Columns (Conditional on temp state) */}
              {!isListView ? (
                <div className="space-y-1">
                  <div className="flex items-center">
                    <Label htmlFor={`${sourceType}-results-columns`}>Results Columns</Label>
                    <SettingsTooltip content="Number of columns for card view results." />
                  </div>
                  <Input
                    id={`${sourceType}-results-columns`}
                    type="text"
                    inputMode="numeric"
                    value={getDialogInputValue('resultsColumns', 4)}
                    onChange={(e) => validateNumericInput(
                      'resultsColumns', e.target.value, 1, 10, 'Must be between 1 and 10.'
                    )}
                    className={cn(inputErrors.resultsColumns ? 'border-red-500 focus-visible:ring-red-500' : '')}
                    placeholder="4"
                  />
                  {inputErrors.resultsColumns && (
                    <p className="text-xs text-red-500 mt-1">{inputErrors.resultsColumns}</p>
                  )}
                </div>
              ) : null}

              {/* Open New Tab Switch */}
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                <div className="space-y-0.5">
                   <Label>Open Links in New Tab</Label>
                   <div className="text-sm text-muted-foreground">Control link behavior for web search.</div>
                </div>
                <Switch
                   checked={dialogTempSettings.openNewTab !== false} // Default true
                   onCheckedChange={(checked) => handleDialogInputChange('openNewTab', checked)}
                />
              </div>
              
              {/* Search on Category Change Switch */}
              <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                <div className="space-y-0.5">
                  <Label>Search When Filters Change</Label>
                  <div className="text-sm text-muted-foreground">
                    Automatically trigger a new search when category filters are toggled.
                  </div>
                </div>
                <Switch
                  checked={dialogTempSettings.searchOnCategory === true} // Check explicit true
                  onCheckedChange={(checked) => handleDialogInputChange('searchOnCategory', checked)}
                />
              </div>
           </>
        )
      }
      default: {
        // Fallback for unknown source types
        return (
           <>
              {/* General Settings: Label */}
              <div className="space-y-1">
                <Label htmlFor="dialog-source-label">Display Label</Label>
                <Input
                  id="dialog-source-label"
                  value={dialogTempSettings?.label ?? ''}
                  onChange={(e) => handleDialogInputChange('label', e.target.value)}
                  placeholder="Source display name"
                />
              </div>
              <Separator className="my-4" />
              <Alert variant="default">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Configuration Not Available</AlertTitle>
                <AlertDescription>
                  Specific configuration options for this source type ({getSourceTypeDisplay(selectedSource ?? '') || selectedSource}) are not implemented yet.
                </AlertDescription>
              </Alert>
            </>
         );
      }
    }
  };
  // --- End Helper Function ---

  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>The Local Lagoon</CardTitle> {/* Changed from The Surf */}
          <CardDescription>Manage your knowledge spots & choose your lagoon loadout</CardDescription> {/* Changed surf to lagoon */}
        </CardHeader>
        <CardContent>
          {/* Ensure the Surf LoadoutManager section is fully removed */}
          {/* 
          <div className="mb-6 pb-6 border-b border-border/40">
            <LoadoutManager
              type="surf"
              loadouts={surfLoadouts} // This would cause an error now anyway
              currentConfig={sources}
              onSaveLoadout={(name, config) => saveLoadout("surf", name, config)}
              onSelectLoadout={(id) => selectLoadout("surf", id)}
              onDeleteLoadout={(id) => deleteLoadout("surf", id)}
            />
          </div> 
          */}

          <div className="space-y-4">
            {sources.map((source, index) => (
              <div key={source.id} className="flex items-center justify-between p-3 border border-gray-800 rounded-md">
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 flex items-center justify-center rounded-full"
                    style={{ backgroundColor: source.color + "20" }}
                  >
                    <IconPreview iconName={source.icon} />
                  </div>
                  <div>
                    <p className="font-medium">{source.label}</p>
                    {/* Wrap Type and ID in a div with margin-top */}
                    <div className="mt-1 space-y-0.5"> {/* Adjust spacing inside if needed */}
                      {// Conditionally display the type
                      getSourceTypeDisplay(source.id) && (
                        <p className="text-muted-foreground text-[11px] leading-snug">
                          Type: {getSourceTypeDisplay(source.id)}
                        </p>
                      )}
                      <p className="text-muted-foreground text-[11px] leading-snug">ID: {source.id}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => moveSourceUp(index)} disabled={index === 0}>
                    <MoveUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => moveSourceDown(index)}
                    disabled={index === sources.length - 1}
                  >
                    <MoveDown className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      "text-muted-foreground hover:text-foreground",
                      source.id === 'normal' ? "opacity-50 cursor-not-allowed" : ""
                    )}
                    disabled={source.id === 'normal'}
                    onClick={() => openSourceSettings(source.id)}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  {/* Always render Trash button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    // Conditionally disable and grey out if source.id is 'normal'
                    disabled={source.id === 'normal'}
                    className={cn(
                      "hover:bg-red-500/10",
                      source.id === 'normal' 
                        ? "text-muted-foreground cursor-not-allowed opacity-50" 
                        : "text-red-500 hover:text-red-600"
                    )}
                    onClick={() => source.id !== 'normal' && removeSource(source.id)} // Prevent onClick action when disabled
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* === Add New Source Section === */}
            {/* Button to show the form */} 
            {!isAddingSource && (
              <Button 
                variant="outline" 
                className="w-full mt-4"
                onClick={() => setIsAddingSource(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Lagoon Source {/* Changed from Surf */}
              </Button>
            )}

            {/* The form itself, conditionally rendered */}
            {isAddingSource && (
              <div className="border border-dashed border-gray-700 rounded-md p-4 mt-4">
                <h4 className="text-sm font-medium mb-3">Add New Lagoon Source</h4> {/* Changed from Surf */}
                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Label htmlFor="source-id" className="text-xs">ID</Label>
                      <SettingsTooltip 
                        content={ // Use JSX fragment for line breaks
                          <>
                            Unique internal identifier<br />
                            (e.g., 'my_files').<br />
                            No spaces.
                          </>
                        }
                      />
                    </div>
                    <Input
                      id="source-id"
                      value={newSource.id}
                      onChange={(e) => setNewSource({ ...newSource, id: e.target.value })}
                      placeholder="unique-id"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Label htmlFor="source-label" className="text-xs">Label</Label>
                      <SettingsTooltip content="Display name shown in the UI (e.g., 'My Documents')." />
                    </div>
                    <Input
                      id="source-label"
                      value={newSource.label}
                      onChange={(e) => setNewSource({ ...newSource, label: e.target.value })}
                      placeholder="Display Name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Label htmlFor="source-icon" className="text-xs">Icon</Label>
                      <SettingsTooltip content="Visual icon for this source." />
                    </div>
                    <Select value={newSource.icon} onValueChange={(value) => setNewSource({ ...newSource, icon: value })}>
                      <SelectTrigger id="source-icon">
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {icons.map((icon) => (
                          <SelectItem key={icon.value} value={icon.value}>
                            <div className="flex items-center">
                              <IconPreview iconName={icon.value} />
                              <span className="ml-2">{icon.label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <Label htmlFor="source-type" className="text-xs">Type</Label>
                      <SettingsTooltip content="Determines the configuration options available." />
                    </div>
                    <Select value={newSourceType} onValueChange={setNewSourceType}>
                      <SelectTrigger id="source-type">
                        <SelectValue placeholder="Select source type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="obsidian">Obsidian</SelectItem>
                        <SelectItem value="localFiles">Local Files</SelectItem>
                        <SelectItem value="ai">AI</SelectItem>
                        <SelectItem value="youtube">YouTube</SelectItem>
                        <SelectItem value="music">Music</SelectItem>
                        <SelectItem value="photos">Photos</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Buttons Container */}
                <div className="flex w-full space-x-2 mt-4"> 
                  <Button 
                    variant="outline"
                    className="flex-1" // Make button grow
                    onClick={resetAndHideAddSourceForm} // Use the reset function
                  >
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1" // Make button grow
                    onClick={addSource} 
                    disabled={!newSource.id || !newSource.label}
                  >
                    Add Source
                  </Button>
                </div>
              </div>
            )}
          </div>

        </CardContent>
      </Card>

      {/* Source Settings Dialog */}
      <Dialog open={isSourceDialogOpen} onOpenChange={(isOpen) => !isOpen && handleCancelChanges()}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            {/* Provide fallback for null display type */}
            <DialogTitle>Configure {getSourceTypeDisplay(selectedSource ?? '') || 'Source'} Settings</DialogTitle>
            <DialogDescription>
              Adjust settings for the {getSourceTypeDisplay(selectedSource ?? '') || 'selected'} source. Changes are temporary until applied.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Render form based on selectedSource */} 
            {/* Replace immediately invoked function with helper call */}
            {selectedSource && renderSourceSettingsForm()}
          </div>

          {/* --- Single Open New Tab Control (Applies to selected source) --- */}
          {selectedSource && selectedSource !== 'ai' && ( // Optionally hide for AI if truly not applicable
            <div className="flex items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
              <div className="space-y-0.5">
                <Label>Open Links in New Tab</Label>
                <div className="text-sm text-muted-foreground">
                  Control link behavior for this source.
                </div>
              </div>
              <Switch
                // Bind to the temporary setting for the selected source
                checked={dialogTempSettings.openNewTab !== false} // Default true based on schema
                onCheckedChange={(checked) => handleDialogInputChange('openNewTab', checked)}
              />
            </div>
          )}
          {/* --- End Single Control --- */}

        </DialogContent>
      </Dialog>
    </div>
  )
}
