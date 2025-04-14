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
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { LoadoutManager } from "@/components/loadout-manager"
import { useSettings, type AppSettings, type ObsidianSourceConfig, type LocalFilesSourceConfig, type AISourceConfig, type YouTubeSourceConfig, type SoundCloudSourceConfig } from "@/lib/use-settings"

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

  // Get the correctly typed settings object for the currently selected source
  const getSelectedSourceSettings = (): Record<string, any> => { // Return type allows general access in UI for now
    if (!selectedSource || !settings) return {};

    switch (selectedSource) {
      case "obsidian":
        return settings.obsidian || {};
      case "localFiles": // Assuming the ID used in the UI is "local" but the setting key is "localFiles"
        return settings.localFiles || {};
      case "ai":
        return settings.ai || {};
      case "youtube":
        return settings.youtube || {};
      case "soundcloud":
        return settings.soundcloud || {};
      // Add cases for other custom source types if they have specific configs
      default:
        // For "normal" web search or unknown custom sources, return empty object
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
          <CardDescription>Configure and customize your personal knowledge sources</CardDescription>
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
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{sources.find((s) => s.id === selectedSource)?.label || "Source"} Settings</DialogTitle>
            <DialogDescription>Configure this knowledge source</DialogDescription>
          </DialogHeader>

          {selectedSource === "obsidian" && (
            <div className="space-y-4">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Due to browser security restrictions, direct access to your Obsidian vault requires a local bridge API
                  or plugin.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="vault-path">Obsidian Vault Path</Label>
                  <SettingsTooltip content="The full path to your Obsidian vault on your local machine." />
                </div>
                <Input
                  id="vault-path"
                  value={(getSelectedSourceSettings() as ObsidianSourceConfig).path || ""}
                  onChange={(e) => updateSelectedSourceSetting("path", e.target.value)}
                  placeholder="C:\Users\YourName\Documents\ObsidianVault"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Label htmlFor="use-local-plugin">Use Local REST API Plugin</Label>
                    <SettingsTooltip content="Enable if you're using the Local REST API plugin for Obsidian." />
                  </div>
                  <div className="text-sm text-muted-foreground">Connect via Obsidian plugin</div>
                </div>
                <Switch
                  id="use-local-plugin"
                  checked={(getSelectedSourceSettings() as ObsidianSourceConfig).useLocalPlugin || false}
                  onCheckedChange={(checked) => updateSelectedSourceSetting("useLocalPlugin", checked)}
                />
              </div>

              {((getSelectedSourceSettings() as ObsidianSourceConfig).useLocalPlugin) && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="api-port">API Port</Label>
                      <SettingsTooltip content="The port number for the Local REST API plugin." />
                    </div>
                    <Input
                      id="api-port"
                      type="number"
                      value={(getSelectedSourceSettings() as ObsidianSourceConfig).apiPort || "27123"}
                      onChange={(e) => updateSelectedSourceSetting("apiPort", e.target.value)}
                      placeholder="27123"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label htmlFor="plugin-api-key">API Key</Label>
                      <SettingsTooltip content="The API key for the Local REST API plugin." />
                    </div>
                    <Input
                      id="plugin-api-key"
                      type="password"
                      value={(getSelectedSourceSettings() as ObsidianSourceConfig).pluginApiKey || ""}
                      onChange={(e) => updateSelectedSourceSetting("pluginApiKey", e.target.value)}
                      placeholder="Enter API key"
                    />
                  </div>
                </>
              )}
            </div>
          )}

          {selectedSource === "local" && (
            <div className="space-y-4">
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Due to browser security restrictions, direct access to your local files requires a local indexer or
                  bridge API.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="index-path">Files Directory</Label>
                  <SettingsTooltip content="The directory containing your local files to be indexed." />
                </div>
                <Input
                  id="index-path"
                  value={(getSelectedSourceSettings() as LocalFilesSourceConfig).path || ""}
                  onChange={(e) => updateSelectedSourceSetting("path", e.target.value)}
                  placeholder="C:\Users\YourName\Documents"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="file-types">File Types</Label>
                  <SettingsTooltip content="Comma-separated list of file extensions to index." />
                </div>
                <Input
                  id="file-types"
                  value={(getSelectedSourceSettings() as LocalFilesSourceConfig).fileTypes || "md,txt,pdf"}
                  onChange={(e) => updateSelectedSourceSetting("fileTypes", e.target.value)}
                  placeholder="md,txt,pdf"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Label htmlFor="use-indexer">Use Local Indexer</Label>
                    <SettingsTooltip content="Enable if you're using a local indexer service." />
                  </div>
                  <div className="text-sm text-muted-foreground">Connect via local indexer service</div>
                </div>
                <Switch
                  id="use-indexer"
                  checked={(getSelectedSourceSettings() as LocalFilesSourceConfig).useIndexer || false}
                  onCheckedChange={(checked) => updateSelectedSourceSetting("useIndexer", checked)}
                />
              </div>
            </div>
          )}

          {selectedSource === "ai" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="ai-provider">AI Provider</Label>
                  <SettingsTooltip content="Select the AI provider to use for generating responses." />
                </div>
                <Select
                  value={(getSelectedSourceSettings() as AISourceConfig).provider || "openai"}
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
                  value={(getSelectedSourceSettings() as AISourceConfig).apiKey || ""}
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
                  value={(getSelectedSourceSettings() as AISourceConfig).model || "gpt-4o"}
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
                    value={(getSelectedSourceSettings() as AISourceConfig).temperature || "0.7"}
                    onChange={(e) => updateSelectedSourceSetting("temperature", Number.parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm w-10 text-center">{((getSelectedSourceSettings() as AISourceConfig).temperature) || "0.7"}</span>
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
                  value={(getSelectedSourceSettings() as AISourceConfig).maxTokens || "1000"}
                  onChange={(e) => updateSelectedSourceSetting("maxTokens", Number.parseInt(e.target.value))}
                  placeholder="1000"
                />
              </div>
            </div>
          )}

          {selectedSource === "youtube" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="youtube-api-key">YouTube API Key</Label>
                  <SettingsTooltip content="Your YouTube Data API key for searching videos." />
                </div>
                <Input
                  id="youtube-api-key"
                  type="password"
                  value={(getSelectedSourceSettings() as YouTubeSourceConfig).apiKey || ""}
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
                  value={(getSelectedSourceSettings() as YouTubeSourceConfig).maxResults || "10"}
                  onChange={(e) => updateSelectedSourceSetting("maxResults", Number.parseInt(e.target.value))}
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
                  checked={(getSelectedSourceSettings() as YouTubeSourceConfig).includeChannels !== false}
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
                  checked={(getSelectedSourceSettings() as YouTubeSourceConfig).includePlaylists !== false}
                  onCheckedChange={(checked) => updateSelectedSourceSetting("includePlaylists", checked)}
                />
              </div>
            </div>
          )}

          {selectedSource === "soundcloud" && (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="soundcloud-client-id">SoundCloud Client ID</Label>
                  <SettingsTooltip content="Your SoundCloud API client ID for searching tracks." />
                </div>
                <Input
                  id="soundcloud-client-id"
                  type="password"
                  value={(getSelectedSourceSettings() as SoundCloudSourceConfig).clientId || ""}
                  onChange={(e) => updateSelectedSourceSetting("clientId", e.target.value)}
                  placeholder="Enter Client ID"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center">
                  <Label htmlFor="soundcloud-max-results">Max Results</Label>
                  <SettingsTooltip content="Maximum number of results to return from SoundCloud searches." />
                </div>
                <Input
                  id="soundcloud-max-results"
                  type="number"
                  min="1"
                  max="50"
                  value={(getSelectedSourceSettings() as SoundCloudSourceConfig).maxResults || "10"}
                  onChange={(e) => updateSelectedSourceSetting("maxResults", Number.parseInt(e.target.value))}
                  placeholder="10"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Label htmlFor="soundcloud-include-users">Include Users</Label>
                    <SettingsTooltip content="Include SoundCloud users in search results." />
                  </div>
                  <div className="text-sm text-muted-foreground">Show user results in searches</div>
                </div>
                <Switch
                  id="soundcloud-include-users"
                  checked={(getSelectedSourceSettings() as SoundCloudSourceConfig).includeUsers !== false}
                  onCheckedChange={(checked) => updateSelectedSourceSetting("includeUsers", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="flex items-center">
                    <Label htmlFor="soundcloud-include-playlists">Include Playlists</Label>
                    <SettingsTooltip content="Include SoundCloud playlists in search results." />
                  </div>
                  <div className="text-sm text-muted-foreground">Show playlist results in searches</div>
                </div>
                <Switch
                  id="soundcloud-include-playlists"
                  checked={(getSelectedSourceSettings() as SoundCloudSourceConfig).includePlaylists !== false}
                  onCheckedChange={(checked) => updateSelectedSourceSetting("includePlaylists", checked)}
                />
              </div>
            </div>
          )}

          {selectedSource &&
            !["obsidian", "local", "ai", "youtube", "soundcloud", "normal"].includes(selectedSource) && (
              <div className="space-y-4">
                <p className="text-muted-foreground">Configure custom source settings.</p>

                {/* Placeholder for future custom source settings */}
                <div className="p-4 border border-dashed border-gray-700 rounded-md text-center text-muted-foreground">
                  Custom source configuration options will appear here in a future update.
                </div>
              </div>
            )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
