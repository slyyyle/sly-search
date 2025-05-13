"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsTooltip } from "@/components/settings-tooltip"
import { Button } from "@/components/ui/button"
import { List, LayoutGrid } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { useSettings } from "@/lib/use-settings"
import type { AppSettings } from "@/lib/use-settings"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

// Local interface definition provides component isolation
interface WebSourceConfig {
  resultsPerPage?: number;
  defaultWebView?: 'list' | 'card';
  resultsColumns?: number;
  searchOnCategory?: boolean;
  openNewTab?: boolean;
}

// Define props interface for better type checking
interface GeneralSettingsProps {
  settings: AppSettings['general']; // Expecting the 'general' part of AppSettings
  updateSetting: (section: keyof AppSettings, key: string, value: any) => void;
}

export function GeneralSettings({ settings, updateSetting }: GeneralSettingsProps) {
  // Component accepts props but also uses hooks for flexibility
  const { settings: fullSettings } = useSettings();
  
  // Default settings within the component if the settings prop might be undefined
  const currentSettings = settings || {};
  
  // Access web settings from the personalSources section if available
  const webSettings = fullSettings?.personalSources?.web || {
    resultsPerPage: 10,
    defaultWebView: 'list',
    resultsColumns: 4,
    openNewTab: true,
    searchOnCategory: true
  };

  // Set default language to English
  useEffect(() => {
    if (!currentSettings.defaultLanguage) {
      updateSetting("general", "defaultLanguage", "en");
    }
  }, [currentSettings.defaultLanguage, updateSetting]);

  // Temporary input states for number fields
  const [autocompleteMinInput, setAutocompleteMinInput] = useState<string>(String(currentSettings.autocompleteMin || "4"));
  const [banTimeInput, setBanTimeInput] = useState<string>(String(currentSettings.banTime || "5"));
  const [maxBanTimeInput, setMaxBanTimeInput] = useState<string>(String(currentSettings.maxBanTime || "120"));
  const [resultsPerPageInput, setResultsPerPageInput] = useState<string>(String(currentSettings.resultsPerPage || "10"));
  const [requestTimeoutInput, setRequestTimeoutInput] = useState<string>(String(currentSettings.requestTimeout || "5"));
  const [maxRequestTimeoutInput, setMaxRequestTimeoutInput] = useState<string>(String(currentSettings.maxRequestTimeout || "10"));

  // Update temporary states when props change
  useEffect(() => {
    setAutocompleteMinInput(String(currentSettings.autocompleteMin || "4"));
    setBanTimeInput(String(currentSettings.banTime || "5"));
    setMaxBanTimeInput(String(currentSettings.maxBanTime || "120"));
    setResultsPerPageInput(String(currentSettings.resultsPerPage || "10"));
    setRequestTimeoutInput(String(currentSettings.requestTimeout || "5"));
    setMaxRequestTimeoutInput(String(currentSettings.maxRequestTimeout || "10"));
  }, [currentSettings]);

  // Function to update web settings
  const updateWebSettings = (key: keyof WebSourceConfig, value: any) => {
    const updatedSettings = {
      ...webSettings,
      [key]: value
    };
    updateSetting("personalSources", "web", updatedSettings);
  };

  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Web Surf Lineup</CardTitle>
          <CardDescription>Check the conditions & set your basic surf preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Backend URL - Moved from Base Setup */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 mr-4">
              <Label htmlFor="instance-url" className="whitespace-nowrap">Backend URL</Label>
              <SettingsTooltip content="The base URL of your SearXNG instance. This setting is controlled at the system level." />
            </div>
            <Input
              id="instance-url"
              value={currentSettings.instanceUrl || "http://127.0.0.1:8000"}
              onChange={(e) => updateSetting("general", "instanceUrl", e.target.value)}
              disabled={true}
              className="max-w-sm cursor-not-allowed opacity-70"
            />
          </div>

          {/* Spot Name */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="instance-name">Spot Name</Label>
              <SettingsTooltip content="The name displayed in the header of your SearXNG instance. Default is 'SearXNG'." />
            </div>
            <Input
              id="instance-name"
              value={currentSettings.instanceName || "SlySearch"}
              onChange={(e) => updateSetting("general", "instanceName", e.target.value)}
              className="max-w-[200px]"
            />
          </div>

          {/* Local Tongue - Removed and defaulted to English */}

          {/* Autocomplete */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="autocomplete">Autocomplete</Label>
                <SettingsTooltip content="Enable search suggestions as you type. Available backends include: 360search, baidu, brave, dbpedia, duckduckgo, google, yandex, and more." />
              </div>
            </div>
            {/* INFERRED: !== false: Feature should be ON by default if undefined (opt-out) */}
            <Switch
              id="autocomplete"
              checked={currentSettings.autocomplete !== false}
              onCheckedChange={(checked) => updateSetting("general", "autocomplete", checked)}
            />
          </div>

          {/* Favicon Resolver */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="favicon-resolver">Favicon Resolver</Label>
              <SettingsTooltip content="Backend for the favicon near URL in search results. Available resolvers: allesedv, duckduckgo, google, yandex." />
            </div>
            <Select
              value={currentSettings.faviconResolver || "off"}
              onValueChange={(value) => updateSetting("general", "faviconResolver", value)}
            >
              <SelectTrigger id="favicon-resolver" className="max-w-[200px]">
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

          {/* Wipeout Rest Break */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="ban-time">Wipeout Rest Break (sec)</Label>
              <SettingsTooltip content="Ban time in seconds after engine errors. Engines that fail will be temporarily disabled." />
            </div>
            <Input
              id="ban-time"
              type="text"
              inputMode="numeric"
              value={banTimeInput}
              onChange={(e) => setBanTimeInput(e.target.value)}
              onBlur={() => {
                const value = parseInt(banTimeInput);
                if (!isNaN(value) && value >= 0 && value <= 600) {
                  updateSetting("general", "banTime", String(value));
                } else {
                  setBanTimeInput(String(currentSettings.banTime || "5"));
                }
              }}
              min="0"
              max="600"
              className="max-w-[200px]"
            />
          </div>

          {/* Max Wipeout Rest Break */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="max-ban-time">Max Wipeout Rest Break (sec)</Label>
              <SettingsTooltip content="Maximum ban time in seconds after engine errors." />
            </div>
            <Input
              id="max-ban-time"
              type="text"
              inputMode="numeric"
              value={maxBanTimeInput}
              onChange={(e) => setMaxBanTimeInput(e.target.value)}
              onBlur={() => {
                const value = parseInt(maxBanTimeInput);
                if (!isNaN(value) && value >= 0 && value <= 86400) {
                  updateSetting("general", "maxBanTime", String(value));
                } else {
                  setMaxBanTimeInput(String(currentSettings.maxBanTime || "120"));
                }
              }}
              min="0"
              max="86400"
              className="max-w-[200px]"
            />
          </div>
          
          {/* Paddle Out Timeout - Moved up near Wipeout Rest Break */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="request-timeout">Paddle Out Timeout (sec)</Label>
              <SettingsTooltip content="Default timeout in seconds for requests to search engines. Can be overridden by individual engines." />
            </div>
            <Input
              id="request-timeout"
              type="text"
              inputMode="numeric"
              value={requestTimeoutInput}
              onChange={(e) => setRequestTimeoutInput(e.target.value)}
              onBlur={() => {
                const value = parseInt(requestTimeoutInput);
                if (!isNaN(value) && value >= 1 && value <= 30) {
                  updateSetting("general", "requestTimeout", String(value));
                } else {
                  setRequestTimeoutInput(String(currentSettings.requestTimeout || "5"));
                }
              }}
              min="1"
              max="30"
              className="max-w-[200px]"
            />
          </div>

          {/* Max Paddle Out Timeout - Moved up near Wipeout Rest Break */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="max-request-timeout">Max Paddle Out Timeout (sec)</Label>
              <SettingsTooltip content="The maximum timeout in seconds for any search engine request." />
            </div>
            <Input
              id="max-request-timeout"
              type="text"
              inputMode="numeric"
              value={maxRequestTimeoutInput}
              onChange={(e) => setMaxRequestTimeoutInput(e.target.value)}
              onBlur={() => {
                const value = parseInt(maxRequestTimeoutInput);
                if (!isNaN(value) && value >= 1 && value <= 60) {
                  updateSetting("general", "maxRequestTimeout", String(value));
                } else {
                  setMaxRequestTimeoutInput(String(currentSettings.maxRequestTimeout || "10"));
                }
              }}
              min="1"
              max="60"
              className="max-w-[200px]"
            />
          </div>

          {/* Results Per Page */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="results-per-page">Web Results Per Page</Label>
              <SettingsTooltip content="How many web results to show per page (Applies globally to web searches)." />
            </div>
            <Input
              id="results-per-page"
              type="text"
              inputMode="numeric"
              value={resultsPerPageInput}
              onChange={(e) => setResultsPerPageInput(e.target.value)}
              onBlur={() => {
                const value = parseInt(resultsPerPageInput);
                if (!isNaN(value) && value >= 1 && value <= 100) {
                  updateSetting('general', 'resultsPerPage', String(value));
                } else {
                  setResultsPerPageInput(String(currentSettings.resultsPerPage || "10"));
                }
              }}
              min="1"
              max="100"
              className="max-w-[200px]"
            />
          </div>

          {/* Open Links in New Tab Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Open Links in New Tab</Label>
              <SettingsTooltip content="Control link behavior for web search." />
            </div>
            <Switch
              checked={webSettings?.openNewTab !== false}
              onCheckedChange={(checked) => updateWebSettings('openNewTab', checked)}
            />
          </div>
          
          {/* Search on Category Change Switch */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label>Search When Filters Change</Label>
              <SettingsTooltip content="Automatically trigger a new search when category filters are toggled." />
            </div>
            <Switch
              checked={webSettings?.searchOnCategory === true}
              onCheckedChange={(checked) => updateWebSettings('searchOnCategory', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
