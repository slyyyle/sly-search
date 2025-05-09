"use client"

import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SettingsTooltip } from "@/components/settings-tooltip"
import type { AppSettings } from "@/lib/use-settings"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/use-settings"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Plus, Trash2, Edit2, Image, Link2, Globe } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { FontSwitcher } from "@/components/font-switcher"

interface AppearanceSettingsProps {
  settings: AppSettings['appearance']
  updateSetting: (section: keyof AppSettings, key: string, value: any) => void
}

interface QuickLink {
  id: string;
  label: string;
  url: string;
  thumbnail?: string;
  category?: string;
  starred?: boolean;
}

// Helper function to get domain from URL
const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
};

// Helper function to generate favicon URL based on resolver
const getFaviconUrl = (url: string, resolver: string = 'google'): string | null => {
  const domain = getDomainFromUrl(url);
  
  switch (resolver) {
    case 'off':
      return null;
    case 'allesedv':
      return `https://icons.allesedv.com/google/${domain}`;
    case 'duckduckgo':
      return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
    case 'google':
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
    case 'yandex':
      return `https://favicon.yandex.net/favicon/${domain}`;
    default:
      return null;
  }
};

export function AppearanceSettings({ settings, updateSetting }: AppearanceSettingsProps) {
  const currentSettings = settings || {}
  // Get full settings to access advanced section and general section for favicon resolver
  const { settings: fullSettings } = useSettings();
  const advancedSettings = fullSettings?.advanced || {};
  const generalSettings = fullSettings?.general || {};
  const faviconResolver = generalSettings.faviconResolver || 'off';
  
  // Quick Links state
  const [quickLinks, setQuickLinks] = useState<QuickLink[]>(currentSettings.quickLinks || []);
  const [isAddLinkOpen, setIsAddLinkOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<QuickLink | null>(null);
  const [newLink, setNewLink] = useState<QuickLink>({
    id: '',
    label: '',
    url: '',
    thumbnail: '',
    category: ''
  });
  
  // Sorting state
  const [sortPreference, setSortPreference] = useState<'alphabetical' | 'category'>('category');

  // Update links when favicon resolver changes
  useEffect(() => {
    if (quickLinks.length > 0) {
      const updatedLinks = quickLinks.map(link => {
        // Only update links that don't have custom thumbnails
        if (!link.thumbnail || link.thumbnail.includes('favicon')) {
          // Generate new favicon URL
          return {
            ...link,
            thumbnail: getFaviconUrl(link.url, faviconResolver) || undefined
          };
        }
        return link;
      });
      
      // Update state and settings if links have changed
      if (JSON.stringify(updatedLinks) !== JSON.stringify(quickLinks)) {
        setQuickLinks(updatedLinks);
        updateSetting("appearance", "quickLinks", updatedLinks);
      }
    }
  }, [faviconResolver]);

  // Function to group links by category
  const getGroupedLinks = () => {
    if (sortPreference === 'alphabetical') {
      return { 'All Links': [...quickLinks].sort((a, b) => a.label.localeCompare(b.label)) };
    }
    
    const grouped: Record<string, QuickLink[]> = {};
    
    // Group by category
    quickLinks.forEach(link => {
      const category = link.category || 'Uncategorized';
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(link);
    });
    
    // Sort each category alphabetically
    Object.keys(grouped).forEach(category => {
      grouped[category].sort((a, b) => a.label.localeCompare(b.label));
    });
    
    // Sort categories alphabetically, but keep 'Uncategorized' at the end
    const sortedGroups: Record<string, QuickLink[]> = {};
    Object.keys(grouped)
      .sort((a, b) => {
        if (a === 'Uncategorized') return 1;
        if (b === 'Uncategorized') return -1;
        return a.localeCompare(b);
      })
      .forEach(key => {
        sortedGroups[key] = grouped[key];
      });
    
    return sortedGroups;
  };

  // Handle adding/editing quick links
  const handleAddLink = () => {
    const id = editingLink ? editingLink.id : `link-${Date.now()}`;
    
    // Generate favicon if not provided and resolver is not 'off'
    let thumbnail = newLink.thumbnail;
    if ((!thumbnail || thumbnail.trim() === '') && faviconResolver !== 'off') {
      thumbnail = getFaviconUrl(newLink.url, faviconResolver) || undefined;
    }
    
    const linkToAdd = {
      ...newLink,
      id,
      thumbnail
    };
    
    let updatedLinks;
    
    if (editingLink) {
      // Update existing link
      updatedLinks = quickLinks.map(link => link.id === id ? linkToAdd : link);
    } else {
      // Add new link
      updatedLinks = [...quickLinks, linkToAdd];
    }
    
    setQuickLinks(updatedLinks);
    updateSetting("appearance", "quickLinks", updatedLinks);
    
    // Reset state
    setIsAddLinkOpen(false);
    setEditingLink(null);
    setNewLink({
      id: '',
      label: '',
      url: '',
      thumbnail: '',
      category: ''
    });
  };

  const handleRemoveLink = (id: string) => {
    const updatedLinks = quickLinks.filter(link => link.id !== id);
    setQuickLinks(updatedLinks);
    updateSetting("appearance", "quickLinks", updatedLinks);
  };

  const handleEditLink = (link: QuickLink) => {
    setEditingLink(link);
    setNewLink(link);
    setIsAddLinkOpen(true);
  };

  return (
    <div className="space-y-6 w-full">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Wax & Decals</CardTitle>
          <CardDescription>Customize the look and feel of your board</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Board Style */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label>Board Style</Label>
              <SettingsTooltip content="Select the visual theme for the application's gradients." />
            </div>
            <div className="max-w-[200px] w-full">
              <ThemeSwitcher 
                value={currentSettings.theme || 'google-original'} 
                onThemeChange={(themeId) => updateSetting("appearance", "theme", themeId)}
              />
            </div>
          </div>

          {/* Font Style - New Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label>Font Style</Label>
              <SettingsTooltip 
                content="Select the application-wide font."
                additionalContent="(More fonts coming soon.)"
              />
            </div>
            <div className="max-w-[200px] w-full">
              <FontSwitcher 
                value={currentSettings.font || 'hack-local'} 
                onFontChange={(fontId) => updateSetting("appearance", "font", fontId)}
              />
            </div>
          </div>

          {/* Results Flow */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="results-layout">Results Flow</Label>
              <SettingsTooltip content="Choose how search results are displayed on the page." />
            </div>
            <Select
              value={currentSettings.resultsLayout || "list"}
              onValueChange={(value) => updateSetting("appearance", "resultsLayout", value)}
            >
              <SelectTrigger id="results-layout" className="max-w-[200px]">
                <SelectValue placeholder="Select layout" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="list">List</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
                <SelectItem value="compact">Compact</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Endless Summer Scroll */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="endless-summer-scroll">Endless Summer Scroll</Label>
              <SettingsTooltip content="Enable infinite scrolling to automatically load more results as you scroll down." />
            </div>
            <Switch
              id="endless-summer-scroll"
              checked={currentSettings.infiniteScroll !== false}
              onCheckedChange={(checked) => updateSetting("appearance", "infiniteScroll", checked)}
            />
          </div>

          {/* Quick Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="hotkeys">Quick Controls</Label>
              <SettingsTooltip content="Keyboard shortcut configuration for navigating search results." />
            </div>
            <Select
              value={currentSettings.hotkeys || "default"}
              onValueChange={(value) => updateSetting("appearance", "hotkeys", value)}
            >
              <SelectTrigger id="hotkeys" className="max-w-[200px]">
                <SelectValue placeholder="Select hotkey style" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="vim">Vim</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Link Style */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label htmlFor="url-format">Link Style</Label>
              <SettingsTooltip content="Controls how URLs are displayed in search results: pretty (shortened), full (complete URL), or host (domain only)." />
            </div>
            <Select
              value={currentSettings.urlFormat || "pretty"}
              onValueChange={(value) => updateSetting("appearance", "urlFormat", value)}
            >
              <SelectTrigger id="url-format" className="max-w-[200px]">
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
      
      {/* Quick Links Section */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Quick Links</CardTitle>
          <CardDescription>Add bookmark tiles to your dashboard for your favorite sites</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Enable Quick Links Switch */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="enable-quick-links">Enable Quick Links</Label>
              <div className="text-sm text-muted-foreground">Display quick access tiles on your dashboard</div>
            </div>
            <Switch
              id="enable-quick-links"
              checked={currentSettings.enableQuickLinks !== false}
              onCheckedChange={(checked) => updateSetting("appearance", "enableQuickLinks", checked)}
            />
          </div>
          
          {/* Only show these options if quick links are enabled */}
          {currentSettings.enableQuickLinks !== false && (
            <div className="space-y-4 mt-4 pt-4 border-t">
              {/* Sort Controls */}
              <div className="flex items-center justify-between mb-4">
                <Label>Sort Links</Label>
                <Select
                  value={sortPreference}
                  onValueChange={(value: 'alphabetical' | 'category') => setSortPreference(value)}
                >
                  <SelectTrigger className="max-w-[180px]">
                    <SelectValue placeholder="Choose sorting" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alphabetical">Alphabetically</SelectItem>
                    <SelectItem value="category">By Category</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Quick Links Grid with Grouping */}
              {quickLinks.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(getGroupedLinks()).map(([category, links]) => (
                    <div key={category} className="space-y-3">
                      {/* Category Header */}
                      <div className="border-b pb-1">
                        <h3 className="text-sm font-medium text-foreground">{category}</h3>
                      </div>
                      
                      {/* Links Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {links.map(link => (
                          <div 
                            key={link.id} 
                            className="relative group p-3 border rounded-lg h-24 flex flex-col items-center justify-center bg-background/60 themed-gradient-border hover:bg-background/80 transition-all"
                          >
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                const updatedLinks = quickLinks.map(l => 
                                  l.id === link.id ? { ...l, starred: !l.starred } : l
                                );
                                console.log('Updating starred state for link:', link.id, 'New state:', !link.starred);
                                setQuickLinks(updatedLinks);
                                updateSetting("appearance", "quickLinks", updatedLinks);
                                console.log('Settings updated with new quick links:', updatedLinks);
                              }}
                              className="absolute top-1 left-1 p-1 rounded-full hover:bg-background/50 transition-colors"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill={link.starred ? "currentColor" : "none"}
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className={cn(
                                  "text-yellow-500",
                                  link.starred ? "fill-current" : "fill-none"
                                )}
                              >
                                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                              </svg>
                            </button>
                            <div className="flex flex-col items-center">
                              {link.thumbnail ? (
                                <div className="w-10 h-10 rounded mb-2 overflow-hidden flex items-center justify-center">
                                  <img 
                                    src={link.thumbnail}
                                    alt={link.label} 
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233498DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                                    }}
                                  />
                                </div>
                              ) : faviconResolver !== 'off' ? (
                                <div className="w-10 h-10 rounded mb-2 overflow-hidden flex items-center justify-center">
                                  <img 
                                    src={getFaviconUrl(link.url, faviconResolver) || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233498DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>'}
                                    alt={link.label} 
                                    className="max-w-full max-h-full object-contain"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="%233498DB" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>';
                                    }}
                                  />
                                </div>
                              ) : (
                                <Globe className="w-10 h-10 mb-2 text-blue-400" />
                              )}
                              <span className="text-sm font-medium truncate max-w-full">{link.label}</span>
                            </div>
                            
                            <div className="absolute top-1 right-1 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6" 
                                onClick={() => handleEditLink(link)}
                              >
                                <Edit2 className="h-3 w-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 text-red-400 hover:text-red-600 hover:bg-red-100/10" 
                                onClick={() => handleRemoveLink(link.id)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 border border-dashed rounded-lg">
                  <Globe className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-muted-foreground">No quick links added yet</p>
                </div>
              )}
              
              {/* Add Button */}
              <div className="flex justify-end">
                <Dialog open={isAddLinkOpen} onOpenChange={setIsAddLinkOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => {
                      setEditingLink(null);
                      setNewLink({
                        id: '',
                        label: '',
                        url: '',
                        thumbnail: '',
                        category: ''
                      });
                    }}>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Quick Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>{editingLink ? 'Edit Quick Link' : 'Add Quick Link'}</DialogTitle>
                      <DialogDescription>
                        {editingLink ? 'Update your quick link details' : 'Add a new site to your dashboard'}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="link-label">Label</Label>
                        <Input
                          id="link-label"
                          value={newLink.label}
                          onChange={(e) => setNewLink({...newLink, label: e.target.value})}
                          placeholder="Google"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-url">URL</Label>
                        <Input
                          id="link-url"
                          value={newLink.url}
                          onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                          placeholder="https://google.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-thumbnail">Custom Thumbnail</Label>
                        <Input
                          id="link-thumbnail"
                          value={newLink.thumbnail || ''}
                          onChange={(e) => setNewLink({...newLink, thumbnail: e.target.value})}
                          placeholder={faviconResolver === 'off' ? 
                            "https://example.com/image.jpg (required)" : 
                            "https://example.com/image.jpg (optional)"}
                        />
                        {faviconResolver !== 'off' && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Leave blank to use {faviconResolver} favicon service
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="link-category">Category</Label>
                        <Input
                          id="link-category"
                          value={newLink.category || ''}
                          onChange={(e) => setNewLink({...newLink, category: e.target.value})}
                          placeholder="Work, Personal, Shopping, etc."
                        />
                        <p className="text-sm text-muted-foreground mt-1">
                          Optional: Categorize your quick link
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline">Cancel</Button>
                      </DialogClose>
                      <Button onClick={handleAddLink}>{editingLink ? 'Save Changes' : 'Add Link'}</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Quick links will appear in a grid on your homepage for fast access to your favorite sites.</p>
                <p className="mt-1">
                  {faviconResolver === 'off' 
                    ? "Favicon resolver is disabled. You'll need to provide custom thumbnails." 
                    : `Using ${faviconResolver} for auto-generating icons. Change this in Surf Lineup settings.`}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
