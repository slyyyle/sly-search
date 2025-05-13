"use client"

import React from "react"
import { ExternalLink, Calendar, Star, Tag, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { type WebResult } from "@/types/search" 
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/use-settings"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent } from "@/components/ui/context-menu"
import { useToast } from "@/components/ui/use-toast"

// --- Helper Favicon Component --- Keep as it's web-specific
interface WebResultFaviconProps {
  baseUrl: string | undefined | null;
}

const WebResultFavicon: React.FC<WebResultFaviconProps> = ({ baseUrl }) => {
  if (typeof baseUrl !== 'string') {
    return null;
  }

  try {
    const hostname = new URL(baseUrl).hostname;
    const faviconSrc = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=32`;
    return (
      <img
        src={faviconSrc}
        alt=""
        className="w-3.5 h-3.5 mr-1.5 rounded-sm flex-shrink-0" // Added flex-shrink-0
        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
      />
    );
  } catch (error) {
    // console.error("Error parsing URL for favicon:", baseUrl, error); // Optional logging
    return null; // Don't render img if URL is invalid
  }
};
// --- End Helper Favicon Component ---

// Interface specific to WebListItem
interface WebListItemProps {
  result: WebResult;
  openInNewTab?: boolean;
}

// Simplified formatDate for web results
function formatDate(dateString?: string): string | null {
  if (!dateString) return null;
  try {
    // Attempt to parse common web date formats
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric", month: "short", day: "numeric"
    });
  } catch (e) {
    console.warn("Failed to parse date:", dateString);
    return null;
  }
}

// Removed isObsidianResult, isYouTubeResult, isPhotoResult type guards

// --- Type Guard for WebResult with Tags --- (Keep as it's web-specific)
function hasTags(result: WebResult): result is WebResult & { tags: string[] } {
  return 'tags' in result && Array.isArray(result.tags) && result.tags.length > 0;
}

export const WebListItem: React.FC<WebListItemProps> = ({ result, openInNewTab = true }) => {
  const { settings, updateSetting } = useSettings();
  const { toast } = useToast();

  // Simplified variables - directly use result properties for WebResult
  const displayTitle = result.title || "Untitled";
  const displayDate = formatDate(result.publishedDate);
  // Determine primary link (prefer link, fallback to url)
  const primaryUrl = result.link || result.url;
  const faviconBaseUrl = primaryUrl;
  // Use pretty_url if available, otherwise derive from primaryUrl
  let displayPath: string | undefined = result.pretty_url;
  if (!displayPath && primaryUrl) {
    try {
      displayPath = new URL(primaryUrl).hostname.replace(/^www\./, '');
    } catch { /* Ignore invalid URLs */ }
  }
  const description = result.snippet || result.content || "";
  const displaySource = Array.isArray(result.engines) ? result.engines.join(", ") : result.engines || "Web";


  // --- Quick Links Handlers (Keep) ---
  // Function to add link to quick links with category
  const handleAddToQuickLinks = (url: string | undefined, title: string, category: string = 'General') => {
    if (!url) {
      toast({ title: "Cannot add link", description: "No valid URL found for this item.", variant: "default" });
      return;
    }
    try {
      if (!settings || !settings.appearance || !updateSetting) {
        throw new Error("Settings or update function not available");
      }
      
      const currentQuickLinks = settings.appearance.quickLinks || []
      const newLink = {
        id: `link-${Date.now()}`,
        label: title,
        url: url,
        category: category
      }
      
      // Check if link already exists
      if (currentQuickLinks.some(link => link.url === url)) {
        toast({
          title: "Link already exists",
          description: "This link is already in your quick links.",
          variant: "default",
        })
        return
      }

      const updatedQuickLinks = [...currentQuickLinks, newLink]
      updateSetting("appearance", "quickLinks", updatedQuickLinks)
      
      toast({
        title: "Link added",
        description: `The link has been added to your quick links in the ${category} category.`,
        variant: "default",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to add link to quick links.",
        variant: "destructive",
      })
    }
  }

  // Function to remove link from quick links
  const handleRemoveFromQuickLinks = (url: string | undefined) => {
    if (!url) return;
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

  // Function to check if a link is in quick links
  const isLinkInQuickLinks = (url: string | undefined) => {
    if (!url) return false;
    return settings?.appearance?.quickLinks?.some(link => link.url === url) || false;
  }
  // --- End Quick Links Handlers ---

  return (
    // Removed outer flex container - assume parent provides layout
    <div className="flex-grow min-w-0 mb-6"> 
      {/* Title Rendering - Always link for web results */}
      <div className={cn("flex items-center mb-1")}>
         {primaryUrl ? (
           <ContextMenu>
             <ContextMenuTrigger>
               <a
                 href={primaryUrl}
                 target={openInNewTab ? "_blank" : "_self"}
                 rel={openInNewTab ? "noopener noreferrer" : ""}
                 className={cn(
                   "text-lg font-semibold group text-blue-400 group-hover:underline line-clamp-2"
                 )}
               >
                 {displayTitle}
                 {openInNewTab && (
                   <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity inline-block" />
                 )}
               </a>
             </ContextMenuTrigger>
             <ContextMenuContent>
               <ContextMenuSub>
                 <ContextMenuSubTrigger>Add to Quick Links</ContextMenuSubTrigger>
                 <ContextMenuSubContent>
                   {Array.from(new Set(settings?.appearance?.quickLinks?.map(link => link.category || 'General') || ['General'])).map(category => (
                     <ContextMenuItem 
                       key={category}
                       onClick={() => handleAddToQuickLinks(primaryUrl, displayTitle, category)}
                       disabled={!primaryUrl}
                     >
                       {category}
                     </ContextMenuItem>
                   ))}
                 </ContextMenuSubContent>
               </ContextMenuSub>
               {isLinkInQuickLinks(primaryUrl) && (
                 <ContextMenuItem 
                   onClick={() => handleRemoveFromQuickLinks(primaryUrl)}
                   className="text-red-500"
                   disabled={!primaryUrl}
                 >
                   Remove from Quick Links
                 </ContextMenuItem>
               )}
             </ContextMenuContent>
           </ContextMenu>
         ) : (
           // Fallback if no primaryUrl (should be rare for WebResult)
           <h3 className="text-lg font-semibold line-clamp-2 text-inherit">
             {displayTitle}
           </h3>
         )}
      </div>

      {/* Path/URL Display */}
      {displayPath && (
         <p className={cn(
           "text-xs flex items-center truncate",
           "text-muted-foreground"
         )}>
           {/* Always show favicon for web */}
           <WebResultFavicon baseUrl={faviconBaseUrl} />
           {typeof displayPath === 'string' && <span>{displayPath}</span>}
         </p>
       )}

      {/* Description */}
      {description && <p className="text-sm mt-1" dangerouslySetInnerHTML={{ __html: description }} />}

      {/* Metadata (Source, Score, Date, Tags) */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
        {/* Source Info */}
        {displaySource && displaySource !== "Unknown" && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center hover:text-gray-300 cursor-default">
                <Info className="h-3 w-3 mr-1" />
                <span>{displaySource}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Source Engines: {displaySource}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Score Info */}
        {(result.score != null) && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center hover:text-gray-300 cursor-default">
                <Star className="h-3 w-3 mr-1" />
                <span>{typeof result.score === "number" ? result.score.toFixed(2) : result.score}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Relevance score: {result.score}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Date Info */}
        {displayDate && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center hover:text-gray-300 cursor-default">
                <Calendar className="h-3 w-3 mr-1" />
                <span>{displayDate}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Published: {displayDate}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Tags */}
        {hasTags(result) && (
          <div className="flex items-center gap-1">
            <Tag className="h-3 w-3" />
            {result.tags.map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">{tag}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Note: No default export anymore 