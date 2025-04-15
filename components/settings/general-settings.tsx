"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsTooltip } from "@/components/settings-tooltip"
import { Button } from "@/components/ui/button"
import type { AppSettings } from "@/lib/use-settings"

// Define props interface for better type checking
interface GeneralSettingsProps {
  settings: AppSettings['general']; // Expecting the 'general' part of AppSettings
  updateSetting: (section: keyof AppSettings, key: string, value: any) => void;
}

export function GeneralSettings({ settings, updateSetting }: GeneralSettingsProps) {
  // Default settings within the component if the settings prop might be undefined
  const currentSettings = settings || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>The Lineup</CardTitle>
          <CardDescription>Check the conditions & set your basic surf preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="instance-name">Spot Name</Label>
              <SettingsTooltip content="The name displayed in the header of your SearXNG instance. Default is 'SearXNG'." />
            </div>
            <Input
              id="instance-name"
              value={currentSettings.instanceName || "SlySearch"}
              onChange={(e) => updateSetting("general", "instanceName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="default-lang">Local Tongue</Label>
              <SettingsTooltip content="Default search language. Set to 'auto' to detect from browser information or use specific language codes." />
            </div>
            <Select
              value={currentSettings.defaultLanguage || "auto"}
              onValueChange={(value) => updateSetting("general", "defaultLanguage", value)}
            >
              <SelectTrigger id="default-lang">
                <SelectValue placeholder="Select language" />
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
              <Label htmlFor="safe-search">Safe Search</Label>
              <SettingsTooltip content="Filter results: 0: None, 1: Moderate, 2: Strict" />
            </div>
            <Select
              value={String(currentSettings.safeSearch ?? "0")}
              onValueChange={(value) => updateSetting("general", "safeSearch", value)}
            >
              <SelectTrigger id="safe-search">
                <SelectValue placeholder="Select safe search level" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Off</SelectItem>
                <SelectItem value="1">Moderate</SelectItem>
                <SelectItem value="2">Strict</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="autocomplete">Autocomplete</Label>
                <SettingsTooltip content="Enable search suggestions as you type. Available backends include: 360search, baidu, brave, dbpedia, duckduckgo, google, yandex, and more." />
              </div>
              <div className="text-sm text-muted-foreground">Get wave tips while paddling out</div>
            </div>
            <Switch
              id="autocomplete"
              checked={currentSettings.autocomplete !== false}
              onCheckedChange={(checked) => updateSetting("general", "autocomplete", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="engines-loadout">Engines</Label>
                <SettingsTooltip content="Select which engine loadout to use for searches." />
              </div>
              <div className="text-sm text-muted-foreground">Choose your search engine configuration</div>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <span className="flex items-center">
                <span className="mr-1">🚀</span>
                Default
              </span>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="waves-surfboard">Surf</Label>
                <SettingsTooltip content="Configure the default behavior for Surf." />
              </div>
              <div className="text-sm text-muted-foreground">Set default behavior for Surf</div>
            </div>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <span className="flex items-center">
                <span className="mr-1">🏄</span>
                Default
              </span>
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="rag-enabled">AI Spotter</Label>
                <SettingsTooltip content="Enable Retrieval-Augmented Generation for enhanced search results." />
              </div>
              <div className="text-sm text-muted-foreground">Use AI to scope the conditions</div>
            </div>
            <Switch
              id="rag-enabled"
              checked={currentSettings.ragEnabled === true}
              onCheckedChange={(checked) => updateSetting("general", "ragEnabled", checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="autocomplete-min">Autocomplete Minimum Characters</Label>
              <SettingsTooltip content="Minimum characters to type before autocompleter starts suggesting terms." />
            </div>
            <Input
              id="autocomplete-min"
              type="number"
              value={currentSettings.autocompleteMin || "4"}
              min="1"
              max="10"
              onChange={(e) => updateSetting("general", "autocompleteMin", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="favicon-resolver">Favicon Resolver</Label>
              <SettingsTooltip content="Backend for the favicon near URL in search results. Available resolvers: allesedv, duckduckgo, google, yandex." />
            </div>
            <Select
              value={currentSettings.faviconResolver || "off"}
              onValueChange={(value) => updateSetting("general", "faviconResolver", value)}
            >
              <SelectTrigger id="favicon-resolver">
                <SelectValue placeholder="Select favicon resolver" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="allesedv">allesedv</SelectItem>
                <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="yandex">Yandex</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="ban-time">Wipeout Cooldown (sec)</Label>
              <SettingsTooltip content="Ban time in seconds after engine errors. Engines that fail will be temporarily disabled." />
            </div>
            <Input
              id="ban-time"
              type="number"
              value={currentSettings.banTime || "5"}
              min="0"
              max="600"
              onChange={(e) => updateSetting("general", "banTime", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="max-ban-time">Max Wipeout Cooldown (sec)</Label>
              <SettingsTooltip content="Maximum ban time in seconds after engine errors." />
            </div>
            <Input
              id="max-ban-time"
              type="number"
              value={currentSettings.maxBanTime || "120"}
              min="0"
              max="86400"
              onChange={(e) => updateSetting("general", "maxBanTime", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ride Style</CardTitle>
          <CardDescription>How you want your search results to flow</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="open-new-tab">Open Links in New Window</Label>
                <SettingsTooltip content="When enabled, search result links will open in a new browser tab." />
              </div>
              <div className="text-sm text-muted-foreground">Pop open links in a fresh window</div>
            </div>
            <Switch
              id="open-new-tab"
              checked={currentSettings.openNewTab !== false}
              onCheckedChange={(checked) => updateSetting("general", "openNewTab", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="infinite-scroll">Endless Summer Scroll</Label>
                <SettingsTooltip content="When enabled, automatically loads the next page when scrolling to bottom of the current page." />
              </div>
              <div className="text-sm text-muted-foreground">Keep the results rolling in</div>
            </div>
            <Switch
              id="infinite-scroll"
              checked={currentSettings.infiniteScroll !== false}
              onCheckedChange={(checked) => updateSetting("general", "infiniteScroll", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="search-on-category">Search When Switching Breaks</Label>
                <SettingsTooltip content="When enabled, automatically runs a new search when you switch categories (e.g., Images, Videos)." />
              </div>
              <div className="text-sm text-muted-foreground">Auto-search when you switch breaks (Images, Videos...)</div>
            </div>
            <Switch
              id="search-on-category"
              checked={currentSettings.searchOnCategory !== false}
              onCheckedChange={(checked) => updateSetting("general", "searchOnCategory", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
