"use client"

import React, { useState } from "react"
import { Globe } from "lucide-react"
import { useSettings } from "@/lib/use-settings"
import { cn } from "@/lib/utils"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu"
import { useToast } from "@/components/ui/use-toast"

interface QuickLink {
  id: string
  label: string
  url: string
  thumbnail?: string
  category?: string
  starred?: boolean
}

// Helper function to get domain from URL - same as in appearance-settings.tsx
const getDomainFromUrl = (url: string): string => {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url;
  }
};

// Helper function to generate favicon URL based on resolver - same as in appearance-settings.tsx
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

const QuickLinksGrid: React.FC = () => {
  const { settings, updateSetting } = useSettings();
  const { toast } = useToast();
  const appearanceSettings = settings.appearance || {};
  const quickLinks = (appearanceSettings.quickLinks || []) as QuickLink[];
  const enableQuickLinks = appearanceSettings.enableQuickLinks !== false;
  const faviconResolver = settings.general?.faviconResolver || 'off';
  
  // Category filter state and derived lists
  const [activeCategory, setActiveCategory] = useState<string>('Quick');
  const categories = Array.from(new Set(quickLinks.map(link => link.category || 'Uncategorized')));
  const filteredQuickLinks = activeCategory === 'Quick'
    ? quickLinks.filter(link => link.starred)
    : quickLinks.filter(link => (link.category || 'Uncategorized') === activeCategory);
  
  // Function to remove link from quick links
  const handleRemoveFromQuickLinks = (url: string) => {
    try {
      if (!settings || !settings.appearance || !updateSetting) {
        throw new Error("Settings or update function not available");
      }
      
      const currentQuickLinks = settings.appearance.quickLinks || []
      const updatedQuickLinks = currentQuickLinks.filter(link => link.url !== url)
      
      updateSetting("appearance", "quickLinks", updatedQuickLinks)
      
      toast({
        title: "Link removed",
        description: "The link has been removed from your quick links.",
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to remove link from quick links.",
        variant: "destructive",
      })
    }
  }
  
  // Don't render anything if quick links are disabled
  if (!enableQuickLinks) {
    return null;
  }
  
  // Show a message when there are no quick links
  if (quickLinks.length === 0) {
    return (
      <div className="mt-8 p-4 border border-dashed rounded-md text-center themed-gradient-border">
        <Globe className="mx-auto h-6 w-6 text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Quick Links Enabled: You have no quick links! Paddle over to settings to set some up or disable this feature!
        </p>
      </div>
    );
  }
  
  // Render the quick links grid
  return (
    <div className="mt-8">
      <div className="p-4 border rounded-md themed-gradient-border bg-background/30">
        <div className="flex items-center border-b border-border/50 pb-3 mb-4">
          <div className="flex gap-1 w-full">
            <button
              onClick={() => setActiveCategory('Quick')}
              className={cn(
                'px-4 py-2 text-sm transition-all duration-200 flex-1',
                activeCategory === 'Quick'
                  ? 'bg-primary/10 text-primary font-medium border-b-2 border-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              Quick
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  'px-4 py-2 text-sm transition-all duration-200 flex-1',
                  activeCategory === cat
                    ? 'bg-primary/10 text-primary font-medium border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
          {filteredQuickLinks.map(link => (
            <ContextMenu key={link.id}>
              <ContextMenuTrigger>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center justify-center p-3 rounded-md hover:bg-background/80 transition-all text-center"
                >
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
                  <span className="text-sm font-medium truncate w-full">{link.label}</span>
                </a>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem 
                  onClick={() => handleRemoveFromQuickLinks(link.url)}
                  className="text-red-500"
                >
                  Remove from Quick Links
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickLinksGrid; 