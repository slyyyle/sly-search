"use client"

import { useState } from "react"
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
  Youtube,
  Music,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadoutManager } from "@/components/loadout-manager"
import { useSettings, type AppSettings, type ObsidianSourceConfig, type LocalFilesSourceConfig, type AISourceConfig, type YouTubeSourceConfig, type SoundCloudSourceConfig } from "@/lib/use-settings"
import { ObsidianVaultBrowser } from "@/components/obsidian-vault-browser"

// Define interface for a single source
interface Source {
  id: string;
  label: string;
  icon: string;
  color: string;
  gradient: string;
  // Add other source-specific properties if needed
  path?: string;
  vaultName?: string;
  // Add fields for AI, YouTube, SoundCloud etc. based on AppSettings
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxResults?: number;
  clientId?: string;
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
      { id: "local", label: "Files", icon: "FileText", color: "#F7B529", gradient: "from-[#FF3E30]/70 to-[#F7B529]/70" },
      { id: "ai", label: "AI", icon: "Bot", color: "#10B981", gradient: "from-[#10B981]/70 to-[#059669]/70" },
      { id: "youtube", label: "YouTube", icon: "Youtube", color: "#FF0000", gradient: "from-[#FF0000]/70 to-[#CC0000]/70" },
      { id: "soundcloud", label: "SoundCloud", icon: "Music", color: "#FF7700", gradient: "from-[#FF7700]/70 to-[#FF3300]/70" },
    ];
  const surfLoadouts = settings?.loadouts || []; // Assuming loadouts are part of personalSources settings

  const [sources, setSources] = useState<Source[]>(currentSources);
  const [newSource, setNewSource] = useState<Source>({
    id: "",
    label: "",
    icon: "Database",
    color: "#176BEF",
    gradient: "from-[#176BEF]/70 to-[#FF3E30]/70",
  })
  const [selectedSource, setSelectedSource] = useState<string | null>(null)
  const [isSourceDialogOpen, setIsSourceDialogOpen] = useState(false)
  const [isBrowserDialogOpen, setIsBrowserDialogOpen] = useState(false)

  // Update sources in settings
  const updateSources = (newSources: Source[]) => {
    setSources(newSources)
    updateSetting("personalSources", "sources", newSources)
  }

  // Add a new source
  const addSource = () => {
    if (newSource.id && newSource.label) {
      // Simple validation: Ensure ID is unique
      if (sources.some(s => s.id === newSource.id)) {
        alert("Source ID must be unique.");
        return;
      }
      const updatedSources = [...sources, newSource]
      updateSources(updatedSources)
      // Reset newSource form
      setNewSource({
        id: "",
        label: "",
        icon: "Database",
        color: "#176BEF",
        gradient: "from-[#176BEF]/70 to-[#FF3E30]/70",
      })
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
    setSelectedSource(sourceId)
    setIsSourceDialogOpen(true)
  }

  // Define default configurations based on use-settings.tsx defaults
  const defaultAISettings: AISourceConfig = { provider: "openai", model: "gpt-4o", temperature: "0.7", maxTokens: "1000", apiKey: undefined, baseUrl: undefined };
  const defaultYouTubeSettings: YouTubeSourceConfig = { maxResults: "10", includeChannels: true, includePlaylists: true, apiKey: undefined };
  const defaultSoundCloudSettings: SoundCloudSourceConfig = { maxResults: "10", includeUsers: true, includePlaylists: true, clientId: undefined };
  const defaultObsidianSettings: ObsidianSourceConfig = { useLocalPlugin: false, path: undefined, vaultName: undefined, apiPort: undefined, pluginApiKey: undefined };
  const defaultLocalFilesSettings: LocalFilesSourceConfig = { fileTypes: "md,txt,pdf", useIndexer: false, path: undefined };

  // Get the correctly typed settings object for the currently selected source,
  // merging current settings with defaults to ensure all keys exist.
  const getSelectedSourceSettings = (): Record<string, any> => {
    if (!selectedSource) return {};

    const currentPersonalSettings = settings || {};

    switch (selectedSource) {
      case "obsidian":
        return { ...defaultObsidianSettings, ...(currentPersonalSettings.obsidian || {}) };
      case "localFiles": // Note: ID used might be "local" in some places, ensure consistency or map if needed
        return { ...defaultLocalFilesSettings, ...(currentPersonalSettings.localFiles || {}) };
      case "ai":
        return { ...defaultAISettings, ...(currentPersonalSettings.ai || {}) };
      case "youtube":
        return { ...defaultYouTubeSettings, ...(currentPersonalSettings.youtube || {}) };
      case "soundcloud":
        return { ...defaultSoundCloudSettings, ...(currentPersonalSettings.soundcloud || {}) };
      default:
        return {};
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
        case "soundcloud": currentConfig = settings?.soundcloud; break;
        // Add other source types here
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
    { value: "Music", label: "Music" },
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
      case "Music":
        return <Music className="h-4 w-4" />
      default:
        return <Database className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>The Surf</CardTitle>
          <CardDescription>Manage your knowledge spots & choose your surf loadout</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Add the LoadoutManager component */}
          <div className="mb-6 pb-6 border-b border-border/40">
            <LoadoutManager
              type="surf"
              loadouts={surfLoadouts}
              currentConfig={sources}
              onSaveLoadout={(name, config) => saveLoadout("surf", name, config)}
              onSelectLoadout={(id) => selectLoadout("surf", id)}
              onDeleteLoadout={(id) => deleteLoadout("surf", id)}
            />
          </div>

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
                    <p className="text-xs text-muted-foreground">ID: {source.id}</p>
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
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => openSourceSettings(source.id)}
                  >
                    <Settings2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    onClick={() => removeSource(source.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            <div className="border border-dashed border-gray-700 rounded-md p-4 mt-4">
              <h4 className="text-sm font-medium mb-3">Add New Surf Source</h4>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div className="space-y-1">
                  <Label htmlFor="source-id" className="text-xs">
                    ID
                  </Label>
                  <Input
                    id="source-id"
                    value={newSource.id}
                    onChange={(e) => setNewSource({ ...newSource, id: e.target.value })}
                    placeholder="unique-id"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="source-label" className="text-xs">
                    Label
                  </Label>
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
                  <Label htmlFor="source-icon" className="text-xs">
                    Icon
                  </Label>
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
                  <Label htmlFor="source-color" className="text-xs">
                    Color
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="source-color"
                      type="color"
                      value={newSource.color}
                      onChange={(e) => setNewSource({ ...newSource, color: e.target.value })}
                      className="w-12 h-8 p-1"
                    />
                    <Input
                      value={newSource.color}
                      onChange={(e) => setNewSource({ ...newSource, color: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>

              <Button className="w-full mt-2" onClick={addSource} disabled={!newSource.id || !newSource.label}>
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Source Settings Dialog */}
      <Dialog open={isSourceDialogOpen} onOpenChange={setIsSourceDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit {sources.find(s => s.id === selectedSource)?.label || 'Source'} Settings</DialogTitle>
            <DialogDescription>
              Configure settings for this knowledge source.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            {/* --- Obsidian Settings --- */}
            {selectedSource === 'obsidian' && (() => {
                const obsSettings = getSelectedSourceSettings() as ObsidianSourceConfig;
                if (!obsSettings || Object.keys(obsSettings).length === 0) return null;
                return (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="obsidian-path">Vault Path (on Server)</Label>
                      <SettingsTooltip content="The absolute path to your Obsidian vault on the server running SlySearch backend." />
                      <div className="flex items-center gap-2">
                        <Input
                          id="obsidian-path"
                          placeholder="/path/to/your/vault"
                          value={obsSettings.path ?? ''}
                          onChange={(e) => updateSelectedSourceSetting('path', e.target.value)}
                          className="flex-grow"
                        />
                        {/* Add Browse Button */}
                        <Button
                          variant="outline"
                          onClick={() => setIsBrowserDialogOpen(true)}
                        >
                          Browse Vault
                        </Button>
                      </div>
                    </div>
                  </>
                );
            })()}

            {/* --- Local Files Settings --- */}
            {selectedSource === 'localFiles' && (() => {
                const lfSettings = getSelectedSourceSettings() as LocalFilesSourceConfig;
                if (!lfSettings || Object.keys(lfSettings).length === 0) return null;
                return (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="localfiles-path">Directory Path (on Server)</Label>
                      <SettingsTooltip content="The absolute path to the directory containing files to index on the server." />
                      <Input
                        id="localfiles-path"
                        placeholder="/path/to/your/files"
                        value={lfSettings.path ?? ''}
                        onChange={(e) => updateSelectedSourceSetting('path', e.target.value)}
                      />
                    </div>
                  </>
                );
            })()}

            {/* --- AI Settings --- */}
            {selectedSource === 'ai' && (() => {
              const aiSettings = getSelectedSourceSettings() as AISourceConfig;
              if (!aiSettings || Object.keys(aiSettings).length === 0) return null;
              return (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="ai-provider">AI Provider</Label>
                      <SettingsTooltip content="Select the AI provider to use for generating responses." />
                    </div>
                    <Select
                      value={aiSettings.provider}
                      onValueChange={(value) => updateSelectedSourceSetting("provider", value)}
                    >
                      <SelectTrigger id="ai-provider">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="openai">OpenAI</SelectItem>
                        <SelectItem value="anthropic">Anthropic</SelectItem>
                        <SelectItem value="google">Google AI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="ai-api-key">API Key</Label>
                      <SettingsTooltip content="Your API key for the selected AI provider." />
                    </div>
                    <Input
                      id="ai-api-key"
                      type="password"
                      value={aiSettings.apiKey ?? ''}
                      onChange={(e) => updateSelectedSourceSetting("apiKey", e.target.value)}
                      placeholder="Enter API key"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="ai-model">Model</Label>
                      <SettingsTooltip content="The AI model to use for generating responses." />
                    </div>
                    <Select
                      value={aiSettings.model}
                      onValueChange={(value) => updateSelectedSourceSetting("model", value)}
                    >
                      <SelectTrigger id="ai-model">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                        <SelectItem value="gpt-4">GPT-4</SelectItem>
                        <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                        <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                        <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                        <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="ai-temperature">Temperature</Label>
                      <SettingsTooltip content="Controls randomness in the AI's responses. Lower values are more deterministic, higher values are more creative." />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="ai-temperature"
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={aiSettings.temperature}
                        onChange={(e) => updateSelectedSourceSetting("temperature", e.target.value)}
                        className="flex-1"
                      />
                      <span className="text-sm w-10 text-center">{aiSettings.temperature}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="ai-max-tokens">Max Tokens</Label>
                      <SettingsTooltip content="Maximum number of tokens in the AI's response." />
                    </div>
                    <Input
                      id="ai-max-tokens"
                      type="number"
                      min="100"
                      max="4000"
                      step="100"
                      value={aiSettings.maxTokens}
                      onChange={(e) => updateSelectedSourceSetting("maxTokens", e.target.value)}
                      placeholder="1000"
                    />
                  </div>
                </>
              );
            })()}

            {/* --- YouTube Settings --- */}
            {selectedSource === 'youtube' && (() => {
                const ytSettings = getSelectedSourceSettings() as YouTubeSourceConfig;
                if (!ytSettings || Object.keys(ytSettings).length === 0) return null;
                return (
                  <>
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label htmlFor="youtube-api-key">YouTube API Key</Label>
                        <SettingsTooltip content="Your YouTube Data API key for searching videos." />
                      </div>
                      <Input
                        id="youtube-api-key"
                        type="password"
                        value={ytSettings.apiKey ?? ''}
                        onChange={(e) => updateSelectedSourceSetting("apiKey", e.target.value)}
                        placeholder="Enter API key"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label htmlFor="youtube-max-results">Max Results</Label>
                        <SettingsTooltip content="Maximum number of results to return from YouTube searches." />
                      </div>
                      <Input
                        id="youtube-max-results"
                        type="number"
                        min="1"
                        max="50"
                        value={ytSettings.maxResults}
                        onChange={(e) => updateSelectedSourceSetting("maxResults", e.target.value)}
                        placeholder="10"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Label htmlFor="youtube-include-channels">Include Channels</Label>
                          <SettingsTooltip content="Include YouTube channels in search results." />
                        </div>
                        <div className="text-sm text-muted-foreground">Show channel results in searches</div>
                      </div>
                      <Switch
                        id="youtube-include-channels"
                        checked={ytSettings.includeChannels === true}
                        onCheckedChange={(checked) => updateSelectedSourceSetting("includeChannels", checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center">
                          <Label htmlFor="youtube-include-playlists">Include Playlists</Label>
                          <SettingsTooltip content="Include YouTube playlists in search results." />
                        </div>
                        <div className="text-sm text-muted-foreground">Show playlist results in searches</div>
                      </div>
                      <Switch
                        id="youtube-include-playlists"
                        checked={ytSettings.includePlaylists === true}
                        onCheckedChange={(checked) => updateSelectedSourceSetting("includePlaylists", checked)}
                      />
                    </div>
                  </>
                );
            })()}

            {/* --- SoundCloud Settings --- */}
            {selectedSource === 'soundcloud' && (() => {
                const scSettings = getSelectedSourceSettings() as SoundCloudSourceConfig;
                if (!scSettings || Object.keys(scSettings).length === 0) return null;

                // Assign properties to local constants AFTER the check
                const clientId = scSettings.clientId ?? '';
                const maxResults = scSettings.maxResults;
                const includeUsers = scSettings.includeUsers === true;
                const includePlaylists = scSettings.includePlaylists === true;

                return (
                  <>
                    <div className="space-y-2">
                       <Label>SoundCloud Client ID</Label>
                      <Input
                        id="soundcloud-client-id"
                        type="password"
                        value={clientId} // Use constant
                        onChange={(e) => updateSelectedSourceSetting("clientId", e.target.value)}
                        placeholder="Enter Client ID"
                      />
                    </div>
                    <div className="space-y-2">
                       <Label>Max Results</Label>
                      <Input
                        id="soundcloud-max-results"
                        type="number"
                        min="1"
                        max="50"
                        value={maxResults} // Use constant
                        onChange={(e) => updateSelectedSourceSetting("maxResults", e.target.value)}
                        placeholder="10"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                       <Label>Include Users</Label>
                      <Switch
                        id="soundcloud-include-users"
                        checked={includeUsers} // Use constant
                        onCheckedChange={(checked) => updateSelectedSourceSetting("includeUsers", checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                       <Label>Include Playlists</Label>
                      <Switch
                        id="soundcloud-include-playlists"
                        checked={includePlaylists} // Use constant
                        onCheckedChange={(checked) => updateSelectedSourceSetting("includePlaylists", checked)}
                      />
                    </div>
                  </>
                );
             })()}

            {/* --- Settings for Newly Added Custom Source Types --- */}
            {selectedSource && !['obsidian', 'local', 'ai', 'youtube', 'soundcloud', 'normal'].includes(selectedSource) && (
               <Alert>
                 <AlertCircle className="h-4 w-4" />
                 <AlertTitle>Custom Source</AlertTitle>
                 <AlertDescription>
                   No specific configuration UI available for this source type yet.
                 </AlertDescription>
               </Alert>
            )}

          </div>

          {/* <DialogFooter>
            <Button onClick={() => setIsSourceDialogOpen(false)}>Close</Button>
          </DialogFooter> */} {/* Footer might be implicit or part of DialogContent styling */}
        </DialogContent>
      </Dialog>

      {/* Obsidian Vault Browser Dialog (triggered from within the settings dialog) */}
      <Dialog open={isBrowserDialogOpen} onOpenChange={setIsBrowserDialogOpen}>
        <DialogContent className="sm:max-w-[700px] h-[80vh]">
          <DialogHeader>
            <DialogTitle>Obsidian Vault Browser</DialogTitle>
            <DialogDescription>
              Browse the vault structure. This reads from the path configured on the server.
            </DialogDescription>
          </DialogHeader>
          {/* Render the browser component */}
          {/* Pass initialPath if desired, e.g., from settings */}
          <ObsidianVaultBrowser onClose={() => setIsBrowserDialogOpen(false)} />
        </DialogContent>
      </Dialog>

    </div>
  )
}
