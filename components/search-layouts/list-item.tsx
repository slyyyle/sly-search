"use client"

import type React from "react"
import { ExternalLink, Calendar, Star, Tag, Info, FileText, Brain, Image, Folder } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SearchResultItem, WebResult, ObsidianResult, YouTubeResultItem, PhotoResultItem } from "@/types/search"
import { cn } from "@/lib/utils"
import { useSettings } from "@/lib/use-settings"

// --- Helper Favicon Component ---
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

interface ListItemProps {
  result: SearchResultItem
  openInNewTab?: boolean
}

function formatDate(dateString?: string | number): string | null {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    console.warn("Failed to parse date:", dateString);
    return null;
  }
}

function isObsidianResult(result: SearchResultItem): result is ObsidianResult {
  return result.source === 'obsidian';
}

function isYouTubeResult(result: SearchResultItem): result is YouTubeResultItem {
    return result.source === 'youtube';
}

function isPhotoResult(result: SearchResultItem): result is PhotoResultItem {
    return result.source === 'photos';
}

const ListItem: React.FC<ListItemProps> = ({ result, openInNewTab = true }) => {
  // Get Invidious instance from settings
  const { settings } = useSettings();
  const invidiousInstance = settings?.personalSources?.youtube?.invidiousInstance || "yewtu.be";

  const isObsidian = isObsidianResult(result);
  const isYouTube = isYouTubeResult(result);
  const isPhoto = isPhotoResult(result);
  const isWeb = !isObsidian && !isYouTube && !isPhoto; // Helper to identify web results

  // --- Determine Display Date ---
  let displayDate: string | null = null;
  if (isObsidian && result.modified_time) {
    displayDate = formatDate(result.modified_time);
  } else if (isPhoto && result.modified_time) {
    displayDate = formatDate(result.modified_time); // Use photo modified time
  } else if (!isObsidian && !isYouTube && !isPhoto && (result as WebResult).publishedDate) { // Assume WebResult
    displayDate = formatDate((result as WebResult).publishedDate);
  }
  // --- End Determine Display Date ---

  // --- Determine Title ---
  let displayTitle: string = "Untitled";
  if (isPhoto) {
    displayTitle = result.filename; // Use filename for photos
  } else if ('title' in result) {
    displayTitle = result.title;
  }
  // --- End Determine Title ---

  // --- Determine Display Source Name ---
  let displaySource = "Unknown";
  if ('engines' in result && result.engines) { // Check if 'engines' exists
    displaySource = Array.isArray(result.engines) ? result.engines.join(", ") : result.engines;
  } else if (result.source) {
    if (result.source === 'web' || result.source === 'normal') {
      displaySource = "Web";
    } else if (result.source === 'obsidian') {
      displaySource = "Obsidian";
    } else if (result.source === 'youtube') {
      displaySource = "YouTube";
    } else if (result.source === 'photos') {
      displaySource = "Photos"; // Add photos
    } else if (result.source === 'music') {
      displaySource = "Music";
    } else {
      displaySource = result.source.charAt(0).toUpperCase() + result.source.slice(1);
    }
  }
  // --- End Determine Display Source Name ---

  // --- Determine Description / Snippet ---
  let description: string | undefined | null = undefined;
  if (isPhoto) {
    description = result.relative_path; // Use relative path as description for photos
  } else if ('snippet' in result) {
    description = result.snippet;
  } else if ('content' in result) {
    description = result.content;
  }
  description = description || ""; // Ensure it's at least an empty string
  // --- End Determine Description / Snippet ---

  // --- Determine Thumbnail URL ---
  let thumbnailUrl: string | null | undefined = undefined;
  if (isYouTube && result.thumbnail_url) {
    thumbnailUrl = result.thumbnail_url;
  } else if (isPhoto && result.thumbnail_url) {
    thumbnailUrl = result.thumbnail_url;
  }
  // Add logic for other types if needed
  // --- End Determine Thumbnail URL ---

  // Construct embedUrl only if it's a YouTube result and has vid
  const embedUrl = isYouTube && result.vid ? `https://${invidiousInstance}/embed/${result.vid}` : null;

  // --- Determine Primary Link URL ---
  let primaryUrl: string | undefined = undefined;
  if (isObsidian) {
    primaryUrl = undefined; // No title link for obsidian
  } else if (isYouTube) {
    primaryUrl = result.url; // Original YouTube URL
  } else if (isPhoto) {
    // Photos might have a direct API link or just display inline?
    // For now, no direct link on the title, similar to Obsidian.
    // If backend provides a direct file link, use `result.file_url` or similar here.
    primaryUrl = undefined;
  } else {
    // Default to WebResult logic
    primaryUrl = (result as WebResult).link || (result as WebResult).url;
  }
  // --- End Determine Primary Link URL ---

  // Determine base URL for Favicon (only for web results)
  const faviconBaseUrl = isWeb ? (result as WebResult).link || (result as WebResult).url : undefined;

  // --- Determine Pretty URL/Path/Filename ---
  let displayPath: string | undefined | null = undefined;
   if (isObsidian) {
     displayPath = result.path;
   } else if (isYouTube) {
     displayPath = result.channel_name || (result.url ? new URL(result.url).hostname : undefined);
   } else if (isPhoto) {
     displayPath = result.relative_path; // Use relative path for photos
   } else {
     // Default to WebResult logic
     const webResult = result as WebResult;
     displayPath = webResult.url;
   }
  // --- End Determine Pretty URL/Path/Filename ---

  return (
    <div className="flex gap-4 space-y-1.5">
      {/* Conditional Thumbnail Rendering */}
      {thumbnailUrl && (
        <div className="flex-shrink-0 w-32 h-auto">
          <img
            src={thumbnailUrl}
            alt={`Thumbnail for ${displayTitle}`}
            className="rounded object-cover w-full h-full"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}

      <div className="flex-grow min-w-0">
        {/* Title Rendering */}
        <div className={cn("flex items-center", (isObsidian || isPhoto) && "mb-1")}> {/* Adjust spacing */}
           {isObsidian && <Brain className="h-4 w-4 mr-1.5 text-purple-400 flex-shrink-0" />}
           {/* Add Photo icon if needed */}
           {isPhoto && <Image className="h-4 w-4 mr-1.5 text-blue-400 flex-shrink-0" />} {/* Example Icon */}

           {primaryUrl ? (
             <a
               href={primaryUrl}
               target={openInNewTab ? "_blank" : "_self"}
               rel={openInNewTab ? "noopener noreferrer" : ""}
               className={cn(
                 "text-lg font-semibold group line-clamp-2",
                 isYouTube ? "text-red-400 hover:underline" : "text-blue-400 group-hover:underline" // Style YT differently
               )}
             >
               {displayTitle}
               {openInNewTab && (
                 <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity inline-block" />
               )}
             </a>
           ) : (
             // Render title without link (e.g., for Obsidian, Photos)
             <h3 className={cn(
               "text-lg font-semibold line-clamp-2",
                isObsidian ? "text-purple-300" : isPhoto ? "text-blue-300" : "text-inherit"
             )}>
               {displayTitle}
             </h3>
           )}
        </div>

        {/* Path/URL Display */}
        {displayPath && (
           <p className={cn(
             "text-xs flex items-center truncate",
             "text-muted-foreground",
             (isObsidian || isPhoto) && "mt-0"
           )}>
             {/* Conditional Favicon for Web Results using helper component */}
             {isWeb && <WebResultFavicon baseUrl={faviconBaseUrl} />}

             {/* Existing Icons - moved after favicon */}
             {isObsidian && <FileText className="h-3 w-3 mr-1 flex-shrink-0" />}
             {isPhoto && <Folder className="h-3 w-3 mr-1 flex-shrink-0" />}

             {/* Render span only if displayPath is definitely a string */}
             {typeof displayPath === 'string' && <span>{displayPath}</span>}
           </p>
         )}

        {/* Description */}
        {description && <p className="text-sm mt-1">{description}</p>}

        {/* YouTube Specific Watch Links */}
        {isYouTube && result.vid && embedUrl && (
          <div className="mt-2 flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-blue-400">
            <span className="text-gray-400">Watch on:</span>
            <a href={`https://${invidiousInstance}/watch?v=${result.vid}`} target="_blank" rel="noopener noreferrer" className="hover:underline">Invidious</a>
            <a
              href={embedUrl} // Already constructed embedUrl
              target="_blank" // Embed usually opens fullscreen or new tab
              rel="noopener noreferrer"
              className="hover:underline"
            >
              (Fullscreen)
            </a>
            {/* <a href={`https://cinemaphile.com/watch?v=${result.vid}`} target="_blank" rel="noopener noreferrer" className="hover:underline">HookTube</a> */}
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:underline">YouTube</a>
          </div>
        )}

        {/* Metadata (Source, Score, Date, Tags) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
          {/* Source Info */}
          {displaySource && displaySource !== 'Unknown' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger className="flex items-center hover:text-gray-300 cursor-default">
                  <Info className="h-3 w-3 mr-1" />
                  <span>{displaySource}</span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Source: {displaySource}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Score Info - Conditionally render based on existence */}
          {('score' in result && result.score != null) && (
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
                  <p>Date: {displayDate}</p> {/* Consider adding original date string here */}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* Tags (Example for WebResult) - Check type */}
          {result.source === 'web' && (result as WebResult).tags && (result as WebResult).tags.length > 0 && (
            <div className="flex items-center gap-1">
              <Tag className="h-3 w-3" />
              {(result as WebResult).tags.map((tag) => (
                <span key={tag} className="px-1.5 py-0.5 bg-gray-700 rounded text-xs">{tag}</span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListItem;
