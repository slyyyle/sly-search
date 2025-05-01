"use client"

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { useSettings } from "@/lib/use-settings";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { Input } from "../ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from "../ui/select";
import { SettingsTooltip } from "@/components/settings-tooltip";

export function PrivacySettings() {
  const { settings, updateSetting } = useSettings();
  const currentSettings = settings?.privacy || {};

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Privacy Basics</CardTitle>
          <CardDescription>
            Configure privacy settings to protect your data when searching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="remove-trackers">Remove Trackers</Label>
              <SettingsTooltip content="Clean tracking parameters from URLs." />
            </div>
            {/* INFERRED: Using || false pattern makes this explicitly OFF by default (opt-in) */}
            <Switch
              id="remove-trackers"
              checked={currentSettings.removeTrackers || false}
              onCheckedChange={(value) => updateSetting("privacy", "removeTrackers", value)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="proxy-images">Proxy Images</Label>
              <SettingsTooltip content="Anonymize image requests in search results." />
            </div>
            {/* INFERRED: Using || false pattern makes this explicitly OFF by default (opt-in) */}
            <Switch
              id="proxy-images"
              checked={currentSettings.proxyImages || false}
              onCheckedChange={(value) => updateSetting("privacy", "proxyImages", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="block-cookies">Block Cookies</Label>
              <SettingsTooltip content="Block cookies when visiting search result pages." />
            </div>
            <Switch
              id="block-cookies"
              checked={currentSettings.blockCookies || false}
              onCheckedChange={(value) => updateSetting("privacy", "blockCookies", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="query-in-title">Query in Title</Label>
              <SettingsTooltip content="Include the search query in the page title and browser history." />
            </div>
            {/* INFERRED: Using || false pattern makes this explicitly OFF by default (opt-in) */}
            <Switch
              id="query-in-title"
              checked={currentSettings.queryInTitle || false}
              onCheckedChange={(value) => updateSetting("privacy", "queryInTitle", value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="http-method">HTTP Method</Label>
              <SettingsTooltip content="This setting is controlled at the system level." />
            </div>
            <Select
              value={currentSettings.method || "GET"}
              onValueChange={(value) => updateSetting("privacy", "method", value)}
              disabled={true}
            >
              <SelectTrigger id="http-method" className="w-[200px] cursor-not-allowed opacity-70">
                <SelectValue placeholder="HTTP Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Result Link Proxy</CardTitle>
          <CardDescription>
            Configure a proxy service to anonymize clicks on search results
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="enable-link-proxy">Enable Link Proxy</Label>
              <SettingsTooltip content="Route search result clicks through a proxy service." />
            </div>
            {/* INFERRED: Using || false pattern makes this explicitly OFF by default (opt-in) 
                Privacy features typically default to off unless explicitly enabled */}
            <Switch
              id="enable-link-proxy"
              checked={currentSettings.enableResultProxy || false}
              onCheckedChange={(value) => updateSetting("privacy", "enableResultProxy", value)}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Label htmlFor="proxy-url">Proxy URL</Label>
              <SettingsTooltip content="The URL of your proxy service." />
            </div>
            <Input
              id="proxy-url"
              placeholder="https://your-proxy.com"
              disabled={!currentSettings.enableResultProxy}
              value={currentSettings.resultProxyUrl || ""}
              onChange={(e) => updateSetting("privacy", "resultProxyUrl", e.target.value)}
            />
          </div>

          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Label htmlFor="proxy-api-key">API Key</Label>
              <SettingsTooltip content="Optional API key for your proxy service." />
            </div>
            <Input
              id="proxy-api-key"
              disabled={!currentSettings.enableResultProxy}
              value={currentSettings.resultProxyKey || ""}
              onChange={(e) => updateSetting("privacy", "resultProxyKey", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
