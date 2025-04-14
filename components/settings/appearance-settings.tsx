"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsTooltip } from "@/components/settings-tooltip"
import type { AppSettings } from "@/lib/use-settings"

interface AppearanceSettingsProps {
  settings: AppSettings['appearance']
  updateSetting: (section: keyof AppSettings, key: string, value: any) => void
}

export function AppearanceSettings({ settings, updateSetting }: AppearanceSettingsProps) {
  const currentSettings = settings || {}

  return (
    <Card>
      <CardHeader>
        <CardTitle>Appearance Settings</CardTitle>
        <CardDescription>Customize the look and feel of SlySearch</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center">
            <Label>Theme Style</Label>
            <SettingsTooltip content="Select the visual theme for your SearXNG instance." />
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              className={`justify-start ${currentSettings.theme === "cyberpunk" ? "border-purple-500/50 bg-gradient-to-br from-purple-900/20 to-cyan-900/20" : ""}`}
              onClick={() => updateSetting("appearance", "theme", "cyberpunk")}
            >
              Cyberpunk
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Label htmlFor="center-alignment">Center Alignment</Label>
              <SettingsTooltip content="When enabled, search results will be centered on the page instead of left-aligned." />
            </div>
            <div className="text-sm text-muted-foreground">Center align the search results</div>
          </div>
          <Switch
            id="center-alignment"
            checked={currentSettings.centerAlignment === true}
            onCheckedChange={(checked) => updateSetting("appearance", "centerAlignment", checked)}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="results-layout">Results Layout</Label>
            <SettingsTooltip content="Choose how search results are displayed on the page." />
          </div>
          <Select
            value={currentSettings.resultsLayout || "list"}
            onValueChange={(value) => updateSetting("appearance", "resultsLayout", value)}
          >
            <SelectTrigger id="results-layout">
              <SelectValue placeholder="Select layout" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="list">List</SelectItem>
              <SelectItem value="grid">Grid</SelectItem>
              <SelectItem value="compact">Compact</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="default-locale">Default Interface Locale</Label>
            <SettingsTooltip content="Default interface language. Leave blank to detect from browser information." />
          </div>
          <Select
            value={currentSettings.defaultLocale || "auto"}
            onValueChange={(value) => updateSetting("appearance", "defaultLocale", value)}
          >
            <SelectTrigger id="default-locale">
              <SelectValue placeholder="Select locale" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto Detect</SelectItem>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="it">Italian</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="hotkeys">Hotkeys</Label>
            <SettingsTooltip content="Keyboard shortcut configuration for navigating search results." />
          </div>
          <Select
            value={currentSettings.hotkeys || "default"}
            onValueChange={(value) => updateSetting("appearance", "hotkeys", value)}
          >
            <SelectTrigger id="hotkeys">
              <SelectValue placeholder="Select hotkey style" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default</SelectItem>
              <SelectItem value="vim">Vim</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Label htmlFor="url-format">URL Formatting</Label>
            <SettingsTooltip content="Controls how URLs are displayed in search results: pretty (shortened), full (complete URL), or host (domain only)." />
          </div>
          <Select
            value={currentSettings.urlFormat || "pretty"}
            onValueChange={(value) => updateSetting("appearance", "urlFormat", value)}
          >
            <SelectTrigger id="url-format">
              <SelectValue placeholder="Select URL format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pretty">Pretty</SelectItem>
              <SelectItem value="full">Full</SelectItem>
              <SelectItem value="host">Host</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
