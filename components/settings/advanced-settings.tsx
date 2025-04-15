"use client"

import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsTooltip } from "@/components/settings-tooltip"
import { Checkbox } from "@/components/ui/checkbox"
import type { AppSettings } from "@/lib/use-settings"

interface AdvancedSettingsProps {
  settings: AppSettings['advanced']
  updateSetting: (section: keyof AppSettings, key: string, value: any) => void
}

export function AdvancedSettings({ settings, updateSetting }: AdvancedSettingsProps) {
  const currentSettings = settings || {}

  // Helper function to safely update formats array
  const updateFormats = (format: string, checked: boolean | string) => {
    const currentFormats = currentSettings.formats || ["json", "html"]
    let newFormats = [...currentFormats]
    if (checked) {
      if (!newFormats.includes(format)) {
        newFormats.push(format)
      }
    } else {
      newFormats = newFormats.filter(f => f !== format)
    }
    updateSetting("advanced", "formats", newFormats)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Base Setup</CardTitle>
          <CardDescription>Your core connection & timing settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="instance-url">Backend URL</Label>
              <SettingsTooltip content="The base URL of your SearXNG instance. For local instances, typically http://localhost:8888." />
            </div>
            <Input
              id="instance-url"
              value={currentSettings.instanceUrl || "http://localhost:8888"}
              onChange={(e) => updateSetting("advanced", "instanceUrl", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="request-timeout">Paddle Out Timeout (sec)</Label>
              <SettingsTooltip content="Default timeout in seconds for requests to search engines. Can be overridden by individual engines." />
            </div>
            <Input
              id="request-timeout"
              type="number"
              value={currentSettings.requestTimeout || "5"}
              min="1"
              max="30"
              onChange={(e) => updateSetting("advanced", "requestTimeout", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="max-request-timeout">Max Paddle Out Timeout (sec)</Label>
              <SettingsTooltip content="The maximum timeout in seconds for any search engine request." />
            </div>
            <Input
              id="max-request-timeout"
              type="number"
              value={currentSettings.maxRequestTimeout || "10"}
              min="1"
              max="60"
              onChange={(e) => updateSetting("advanced", "maxRequestTimeout", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Settings</CardTitle>
          <CardDescription>Configure API formats & headless mode</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label>Supported Response Formats</Label>
              <SettingsTooltip content="Select which response formats your SearXNG instance should support." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="format-json"
                  checked={currentSettings.formats?.includes("json") !== false}
                  onCheckedChange={(checked) => updateFormats("json", checked)}
                />
                <Label htmlFor="format-json">JSON (API)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="format-html"
                  checked={currentSettings.formats?.includes("html") !== false}
                  onCheckedChange={(checked) => updateFormats("html", checked)}
                />
                <Label htmlFor="format-html">HTML</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="format-csv"
                  checked={currentSettings.formats?.includes("csv") === true}
                  onCheckedChange={(checked) => updateFormats("csv", checked)}
                />
                <Label htmlFor="format-csv">CSV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="format-rss"
                  checked={currentSettings.formats?.includes("rss") === true}
                  onCheckedChange={(checked) => updateFormats("rss", checked)}
                />
                <Label htmlFor="format-rss">RSS</Label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="headless-mode">Headless Mode</Label>
                <SettingsTooltip content="Enable headless mode for API-only operation. Disables the web UI." />
              </div>
              <div className="text-sm text-muted-foreground">Optimize for API-only usage (no UI)</div>
            </div>
            <Switch
              id="headless-mode"
              checked={currentSettings.headlessMode === true}
              onCheckedChange={(checked) => updateSetting("advanced", "headlessMode", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Result Link Proxy</CardTitle>
          <CardDescription>Route result links through the shack</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="enable-result-proxy">Enable Result Proxy</Label>
                <SettingsTooltip content="Enable proxying of search results through SearXNG for enhanced privacy." />
              </div>
              <div className="text-sm text-muted-foreground">Proxy result links through your instance</div>
            </div>
            <Switch
              id="enable-result-proxy"
              checked={currentSettings.enableResultProxy === true}
              onCheckedChange={(checked) => updateSetting("advanced", "enableResultProxy", checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="result-proxy-url">Result Proxy URL</Label>
              <SettingsTooltip content="URL for the result proxy. Usually the same as your instance URL with /proxy appended." />
            </div>
            <Input
              id="result-proxy-url"
              placeholder="http://localhost:8888/proxy"
              value={currentSettings.resultProxyUrl || ""}
              onChange={(e) => updateSetting("advanced", "resultProxyUrl", e.target.value)}
              disabled={!currentSettings.enableResultProxy}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="result-proxy-key">Result Proxy Key</Label>
              <SettingsTooltip content="Secret key for the result proxy. Should be a random string." />
            </div>
            <Input
              id="result-proxy-key"
              type="password"
              placeholder="Enter proxy key"
              value={currentSettings.resultProxyKey || ""}
              onChange={(e) => updateSetting("advanced", "resultProxyKey", e.target.value)}
              disabled={!currentSettings.enableResultProxy}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connection Tuning</CardTitle>
          <CardDescription>Fine-tune connection pool & HTTP settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="pool-connections">Max Concurrent Connections</Label>
              <SettingsTooltip content="The maximum number of concurrent connections that may be established." />
            </div>
            <Input
              id="pool-connections"
              type="number"
              value={currentSettings.poolConnections || "100"}
              min="10"
              max="500"
              onChange={(e) => updateSetting("advanced", "poolConnections", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="pool-maxsize">Keep-Alive Connection Limit</Label>
              <SettingsTooltip content="Allow the connection pool to maintain keep-alive connections below this point." />
            </div>
            <Input
              id="pool-maxsize"
              type="number"
              value={currentSettings.poolMaxsize || "20"}
              min="5"
              max="100"
              onChange={(e) => updateSetting("advanced", "poolMaxsize", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="enable-http2">Enable HTTP/2</Label>
                <SettingsTooltip content="Enable HTTP/2 support for potentially faster connections." />
              </div>
              <div className="text-sm text-muted-foreground">Enable HTTP/2 for faster connections</div>
            </div>
            <Switch
              id="enable-http2"
              checked={currentSettings.enableHttp2 !== false}
              onCheckedChange={(checked) => updateSetting("advanced", "enableHttp2", checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dev Tools & Custom Code</CardTitle>
          <CardDescription>Debugging options and custom CSS</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="debug-mode">Debug Mode</Label>
                <SettingsTooltip content="Enable debug mode for more verbose logging and potentially sensitive information display." />
              </div>
              <div className="text-sm text-muted-foreground">Enable debug mode for detailed logging</div>
            </div>
            <Switch
              id="debug-mode"
              checked={currentSettings.debugMode === true}
              onCheckedChange={(checked) => updateSetting("advanced", "debugMode", checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="custom-css">Custom Board Spray</Label>
              <Label htmlFor="redis-url">Redis URL</Label>
              <SettingsTooltip content="URL to connect to Redis database. Used for caching and session management." />
            </div>
            <Input
              id="redis-url"
              placeholder="redis://username:password@localhost:6379/0"
              value={currentSettings.redisUrl || ""}
              onChange={(e) => updateSetting("advanced", "redisUrl", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="limiter">Rate Limiter</Label>
                <SettingsTooltip content="Rate limit the number of requests on the instance, block some bots." />
              </div>
              <div className="text-sm text-muted-foreground">Limit request rate to prevent abuse</div>
            </div>
            <Switch
              id="limiter"
              checked={currentSettings.limiter === true}
              onCheckedChange={(checked) => updateSetting("advanced", "limiter", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="public-instance">Public Instance</Label>
                <SettingsTooltip content="Enable features designed only for public instances. Adds additional security measures." />
              </div>
              <div className="text-sm text-muted-foreground">Enable public instance features</div>
            </div>
            <Switch
              id="public-instance"
              checked={currentSettings.publicInstance === true}
              onCheckedChange={(checked) => updateSetting("advanced", "publicInstance", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
