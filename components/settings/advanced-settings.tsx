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

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Instance Configuration</CardTitle>
          <CardDescription>Configure your SearXNG instance connection</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="instance-url">SearXNG Instance URL</Label>
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
              <Label htmlFor="request-timeout">Request Timeout (seconds)</Label>
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
              <Label htmlFor="max-request-timeout">Maximum Request Timeout (seconds)</Label>
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
          <CardTitle>API Configuration</CardTitle>
          <CardDescription>Configure API-specific settings for headless operation</CardDescription>
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
                  onCheckedChange={(checked) => {
                    const formats = [...(currentSettings.formats || ["json", "html"])]
                    if (checked) {
                      if (!formats.includes("json")) formats.push("json")
                    } else {
                      const index = formats.indexOf("json")
                      if (index > -1) formats.splice(index, 1)
                    }
                    updateSetting("advanced", "formats", formats)
                  }}
                />
                <Label htmlFor="format-json">JSON (API)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="format-html"
                  checked={currentSettings.formats?.includes("html") !== false}
                  onCheckedChange={(checked) => {
                    const formats = [...(currentSettings.formats || ["json", "html"])]
                    if (checked) {
                      if (!formats.includes("html")) formats.push("html")
                    } else {
                      const index = formats.indexOf("html")
                      if (index > -1) formats.splice(index, 1)
                    }
                    updateSetting("advanced", "formats", formats)
                  }}
                />
                <Label htmlFor="format-html">HTML</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="format-csv"
                  checked={currentSettings.formats?.includes("csv") === true}
                  onCheckedChange={(checked) => {
                    const formats = [...(currentSettings.formats || ["json", "html"])]
                    if (checked) {
                      if (!formats.includes("csv")) formats.push("csv")
                    } else {
                      const index = formats.indexOf("csv")
                      if (index > -1) formats.splice(index, 1)
                    }
                    updateSetting("advanced", "formats", formats)
                  }}
                />
                <Label htmlFor="format-csv">CSV</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="format-rss"
                  checked={currentSettings.formats?.includes("rss") === true}
                  onCheckedChange={(checked) => {
                    const formats = [...(currentSettings.formats || ["json", "html"])]
                    if (checked) {
                      if (!formats.includes("rss")) formats.push("rss")
                    } else {
                      const index = formats.indexOf("rss")
                      if (index > -1) formats.splice(index, 1)
                    }
                    updateSetting("advanced", "formats", formats)
                  }}
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
              <div className="text-sm text-muted-foreground">Optimize for API-only usage</div>
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
          <CardTitle>Result Proxy Configuration</CardTitle>
          <CardDescription>Configure proxy settings for search results</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="enable-result-proxy">Enable Result Proxy</Label>
                <SettingsTooltip content="Enable proxying of search results through SearXNG for enhanced privacy." />
              </div>
              <div className="text-sm text-muted-foreground">Proxy search results through SearXNG</div>
            </div>
            <Switch
              id="enable-result-proxy"
              checked={settings.enableResultProxy === true}
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
              value={settings.resultProxyUrl || ""}
              onChange={(e) => updateSetting("advanced", "resultProxyUrl", e.target.value)}
              disabled={!settings.enableResultProxy}
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
              value={settings.resultProxyKey || ""}
              onChange={(e) => updateSetting("advanced", "resultProxyKey", e.target.value)}
              disabled={!settings.enableResultProxy}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Connection Settings</CardTitle>
          <CardDescription>Configure connection pool and HTTP settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="pool-connections">Pool Connections</Label>
              <SettingsTooltip content="The maximum number of concurrent connections that may be established." />
            </div>
            <Input
              id="pool-connections"
              type="number"
              value={settings.poolConnections || "100"}
              min="10"
              max="500"
              onChange={(e) => updateSetting("advanced", "poolConnections", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="pool-maxsize">Pool Max Size</Label>
              <SettingsTooltip content="Allow the connection pool to maintain keep-alive connections below this point." />
            </div>
            <Input
              id="pool-maxsize"
              type="number"
              value={settings.poolMaxsize || "20"}
              min="5"
              max="100"
              onChange={(e) => updateSetting("advanced", "poolMaxsize", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="enable-http2">Enable HTTP/2</Label>
                <SettingsTooltip content="Enable HTTP/2 support for outgoing connections to search engines." />
              </div>
              <div className="text-sm text-muted-foreground">Use HTTP/2 for outgoing connections</div>
            </div>
            <Switch
              id="enable-http2"
              checked={settings.enableHttp2 !== false}
              onCheckedChange={(checked) => updateSetting("advanced", "enableHttp2", checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="http-protocol">HTTP Protocol Version</Label>
              <SettingsTooltip content="HTTP protocol version to use for outgoing requests. 1.0 and 1.1 are supported." />
            </div>
            <Select
              value={settings.httpProtocol || "1.0"}
              onValueChange={(value) => updateSetting("advanced", "httpProtocol", value)}
            >
              <SelectTrigger id="http-protocol">
                <SelectValue placeholder="Select HTTP version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1.0">HTTP 1.0</SelectItem>
                <SelectItem value="1.1">HTTP 1.1</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Miscellaneous Settings</CardTitle>
          <CardDescription>Additional advanced configuration options</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="custom-css">Custom CSS</Label>
              <SettingsTooltip content="Add custom CSS to modify the appearance of your SearXNG instance." />
            </div>
            <Textarea
              id="custom-css"
              placeholder="/* Add your custom CSS here */"
              className="font-mono text-sm"
              rows={5}
              value={settings.customCss || ""}
              onChange={(e) => updateSetting("advanced", "customCss", e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="debug-mode">Debug Mode</Label>
                <SettingsTooltip content="Enable debug information. Useful for troubleshooting but should be disabled in production." />
              </div>
              <div className="text-sm text-muted-foreground">Enable debug information</div>
            </div>
            <Switch
              id="debug-mode"
              checked={settings.debugMode === true}
              onCheckedChange={(checked) => updateSetting("advanced", "debugMode", checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="redis-url">Redis URL</Label>
              <SettingsTooltip content="URL to connect to Redis database. Used for caching and session management." />
            </div>
            <Input
              id="redis-url"
              placeholder="redis://username:password@localhost:6379/0"
              value={settings.redisUrl || ""}
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
              checked={settings.limiter === true}
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
              checked={settings.publicInstance === true}
              onCheckedChange={(checked) => updateSetting("advanced", "publicInstance", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
