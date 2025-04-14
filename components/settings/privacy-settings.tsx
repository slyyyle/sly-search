"use client"

import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsTooltip } from "@/components/settings-tooltip"
import type { AppSettings } from "@/lib/use-settings"

interface PrivacySettingsProps {
  settings: AppSettings['privacy']
  updateSetting: (section: keyof AppSettings, key: string, value: any) => void
}

export function PrivacySettings({ settings, updateSetting }: PrivacySettingsProps) {
  const currentSettings = settings || {}

  return (
    <Card>
      <CardHeader>
        <CardTitle>Private Bungalow</CardTitle>
        <CardDescription>Configure privacy-related options</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Label htmlFor="remove-trackers">Remove Trackers</Label>
              <SettingsTooltip content="When enabled, SearXNG will attempt to remove tracking elements from URLs in search results." />
            </div>
            <div className="text-sm text-muted-foreground">Remove tracking elements from URLs</div>
          </div>
          <Switch
            id="remove-trackers"
            checked={currentSettings.removeTrackers !== false}
            onCheckedChange={(checked) => updateSetting("privacy", "removeTrackers", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Label htmlFor="proxy-images">Proxy Images</Label>
              <SettingsTooltip content="Route image requests through SearXNG to prevent direct connections to image hosts, enhancing privacy." />
            </div>
            <div className="text-sm text-muted-foreground">Route image requests through SearXNG</div>
          </div>
          <Switch
            id="proxy-images"
            checked={currentSettings.proxyImages !== false}
            onCheckedChange={(checked) => updateSetting("privacy", "proxyImages", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Label htmlFor="query-in-title">Query in Page Title</Label>
              <SettingsTooltip content="Include search query in the page title. Note: This decreases privacy as browser history will contain your search terms." />
            </div>
            <div className="text-sm text-muted-foreground">Include search query in the page title</div>
          </div>
          <Switch
            id="query-in-title"
            checked={currentSettings.queryInTitle === true}
            onCheckedChange={(checked) => updateSetting("privacy", "queryInTitle", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Label htmlFor="method">HTTP Method</Label>
              <SettingsTooltip content="POST queries are more secure as they don't show up in history but may cause problems when using Firefox containers." />
            </div>
            <div className="text-sm text-muted-foreground">Method for sending search queries</div>
          </div>
          <Select
            value={currentSettings.method || "POST"}
            onValueChange={(value) => updateSetting("privacy", "method", value)}
          >
            <SelectTrigger id="method" className="w-24">
              <SelectValue placeholder="Method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="GET">GET</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Label htmlFor="url-anonymizer">URL Anonymizer</Label>
              <SettingsTooltip content="Route search result clicks through an anonymizing service to prevent sites from knowing you came from a search engine." />
            </div>
            <div className="text-sm text-muted-foreground">Anonymize outgoing result links</div>
          </div>
          <Switch
            id="url-anonymizer"
            checked={currentSettings.urlAnonymizer === true}
            onCheckedChange={(checked) => updateSetting("privacy", "urlAnonymizer", checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center">
              <Label htmlFor="block-cookies">Block Cookies</Label>
              <SettingsTooltip content="Prevent search engines from setting cookies when SearXNG makes requests to them." />
            </div>
            <div className="text-sm text-muted-foreground">Block cookies from search engines</div>
          </div>
          <Switch
            id="block-cookies"
            checked={currentSettings.blockCookies !== false}
            onCheckedChange={(checked) => updateSetting("privacy", "blockCookies", checked)}
          />
        </div>
      </CardContent>
    </Card>
  )
}
