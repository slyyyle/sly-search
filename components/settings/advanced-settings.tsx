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
    <div className="space-y-6 w-full">
      <Card className="w-full">
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

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Server Features</CardTitle>
          <CardDescription>Advanced server-side features</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center">
                <Label htmlFor="limiter">Rate Limiter</Label>
                <SettingsTooltip content="Enable rate limiting to protect against bots and abuse." />
              </div>
              <div className="text-sm text-muted-foreground">Protect your spot from the masses</div>
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
                <SettingsTooltip content="Enable features designed only for public instances, like rate limiting and abuse protection." />
              </div>
              <div className="text-sm text-muted-foreground">Optimize for public access</div>
            </div>
            <Switch
              id="public-instance"
              checked={currentSettings.publicInstance === true}
              onCheckedChange={(checked) => updateSetting("advanced", "publicInstance", checked)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="redis-url">Redis URL (optional)</Label>
              <SettingsTooltip content="URL to connect to Redis database. Used for caching and rate limiting." />
            </div>
            <Input
              id="redis-url"
              placeholder="unix:///usr/local/searxng-redis/run/redis.sock?db=0"
              value={currentSettings.redisUrl || ""}
              onChange={(e) => updateSetting("advanced", "redisUrl", e.target.value)}
              disabled={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
