"use client"

import { useState, useEffect } from "react"
import { Settings, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSettings } from "@/lib/use-settings"
import Link from "next/link"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface QuickSettingsMenuProps {
  compact?: boolean
}

export function QuickSettingsMenu({ compact = false }: QuickSettingsMenuProps) {
  const { settings, updateSetting, saveSettings } = useSettings()
  const [isOpen, setIsOpen] = useState(false)

  // Track local state for results per page
  const [resultsPerPage, setResultsPerPage] = useState(settings.general?.resultsPerPage || "10")

  // Update local state when settings change
  useEffect(() => {
    setResultsPerPage(settings.general?.resultsPerPage || "10")
  }, [settings.general?.resultsPerPage])

  // Save settings when dropdown closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    if (!open) {
      // Save settings when menu closes
      saveSettings()
    }
  }

  // Handle results per page change
  const handleResultsPerPageChange = (value: string) => {
    console.log("Setting results per page to:", value)
    updateSetting("general", "resultsPerPage", value)
    setResultsPerPage(value)
    // Save settings immediately to ensure persistence
    setTimeout(() => saveSettings(), 0)
  }

  // Get display name for current results layout
  const getResultsLayoutDisplayName = () => {
    const layout = settings.appearance?.resultsLayout || "list"
    return layout.charAt(0).toUpperCase() + layout.slice(1)
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "sm" : "icon"} className={compact ? "" : "rounded-full"}>
          <Settings className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end">
        <DropdownMenuGroup>
          {/* Engines with emoji */}
          <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
            <span className="flex items-center">
              <span className="mr-1">🚀</span>
              Engines
            </span>
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground">
              Default
            </Button>
          </DropdownMenuItem>

          {/* Surf Toggle */}
          <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
            <span className="flex items-center">
              <span className="mr-1">🏄</span>
              Surf
            </span>
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground">
              Default
            </Button>
          </DropdownMenuItem>

          {/* Results Layout */}
          <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
            <span className="flex items-center">
              <span className="mr-1">📋</span>
              Results
            </span>
            <Button variant="ghost" size="sm" className="text-xs h-6 px-2 text-muted-foreground hover:text-foreground">
              {getResultsLayoutDisplayName()}
            </Button>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* RAG Toggle */}
          <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
            <span className="flex items-center">
              <span className="mr-1">🤖</span>
              RAG
            </span>
            <Switch
              checked={settings.general?.ragEnabled === true}
              onCheckedChange={(checked) => updateSetting("general", "ragEnabled", checked)}
            />
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Open in New Tab */}
          <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
            <span>Open in New Tab</span>
            <Switch
              checked={settings.general?.openNewTab !== false}
              onCheckedChange={(checked) => updateSetting("general", "openNewTab", checked)}
            />
          </DropdownMenuItem>

          {/* Results Per Page */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Results Per Page</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent>
                {["10", "20", "30", "50", "100"].map((value) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => handleResultsPerPageChange(value)}
                    onSelect={(e) => e.preventDefault()}
                  >
                    <span>{value}</span>
                    {(resultsPerPage === value || (!resultsPerPage && value === "10")) && (
                      <Check className="h-4 w-4 ml-auto" />
                    )}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
                <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                  <span>Infinite Scroll</span>
                  <Switch
                    checked={settings.general?.infiniteScroll !== false}
                    onCheckedChange={(checked) => updateSetting("general", "infiniteScroll", checked)}
                  />
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          {/* Privacy & Security Options */}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>
              <span>Privacy & Security</span>
            </DropdownMenuSubTrigger>
            <DropdownMenuPortal>
              <DropdownMenuSubContent className="w-60">
                {/* Safe Search */}
                <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                  <span>Safe Search</span>
                  <Select
                    value={settings.general?.safeSearch || "0"}
                    onValueChange={(value) => updateSetting("general", "safeSearch", value)}
                    className="w-24"
                  >
                    <SelectTrigger className="h-7">
                      <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Off</SelectItem>
                      <SelectItem value="1">Moderate</SelectItem>
                      <SelectItem value="2">Strict</SelectItem>
                    </SelectContent>
                  </Select>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                  <span>Remove Trackers</span>
                  <Switch
                    checked={settings.privacy?.removeTrackers !== false}
                    onCheckedChange={(checked) => updateSetting("privacy", "removeTrackers", checked)}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                  <span>Proxy Images</span>
                  <Switch
                    checked={settings.privacy?.proxyImages !== false}
                    onCheckedChange={(checked) => updateSetting("privacy", "proxyImages", checked)}
                  />
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center justify-between" onSelect={(e) => e.preventDefault()}>
                  <span>Block Cookies</span>
                  <Switch
                    checked={settings.privacy?.blockCookies !== false}
                    onCheckedChange={(checked) => updateSetting("privacy", "blockCookies", checked)}
                  />
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuPortal>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          {/* Advanced Options - without chevron */}
          <Link href="/settings" passHref>
            <DropdownMenuItem
              className="flex items-center justify-between cursor-pointer"
              onSelect={(e) => e.preventDefault()}
            >
              <span>All Options</span>
            </DropdownMenuItem>
          </Link>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
