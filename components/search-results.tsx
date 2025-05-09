"use client"

import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import WebListResults from "@/components/search-layouts/WebListResults"
import YoutubeGridResults from "@/components/search-layouts/youtube-grid-results"
import PhotoGridResults from "@/components/search-layouts/photo-results"
import WebGridResults from "./search-layouts/web-grid-results"
import WebCompactResults from "./search-layouts/WebCompactResults"
import WebInfoboxResults from "./search-layouts/WebInfoboxResults"
import { useSettings } from "@/lib/use-settings"
import type { SearchResultsState, WebResult, YouTubeResultItem, PhotoResultItem, SearchResultItem, Infobox } from "@/types/search"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface SearchResultsProps {
  isLoading: boolean
  resultsData: SearchResultsState | null
  query: string
  knowledgeSource: string // The UI selected source (e.g., 'web', 'obsidian-notes')
  // openInNewTab?: boolean // REMOVED - Will be determined dynamically
  webResultsView?: "list" | "card"
  activeTab?: string
  defaultYouTubeView?: "list" | "card"
  defaultPhotosView?: "list" | "card"
}

const SearchResults: React.FC<SearchResultsProps> = ({
  isLoading,
  resultsData,
  query,
  knowledgeSource, // UI selected source
  // openInNewTab = true, // REMOVED
  webResultsView = "list",
  activeTab = "all",
  defaultYouTubeView = "card",
  defaultPhotosView = "card",
}) => {
  const { settings } = useSettings()
  
  // Get the Results Flow setting from appearance settings
  const resultsLayout = settings?.appearance?.resultsLayout || "list";

  // console.log("SearchResults received source from data:", resultsData?.source);
  // console.log("SearchResults received knowledgeSource from UI:", knowledgeSource);
  // console.log("SearchResults received webResultsView:", webResultsView);

  // --- Determine the correct openInNewTab setting ---
  let openInNewTabValue = true; // Default to true
  const resultSourceKey = resultsData?.source; // Actual source from the backend response

  if (resultSourceKey) {
    // UPDATED: Directly check if the source key exists in personalSources settings
    if (settings.personalSources && resultSourceKey in settings.personalSources) {
      // Use source-specific setting if available (handles 'web' now too)
      const sourceConfig = settings.personalSources[resultSourceKey as keyof typeof settings.personalSources];
      if (sourceConfig && typeof sourceConfig === 'object' && 'openNewTab' in sourceConfig) {
         openInNewTabValue = sourceConfig.openNewTab ?? true;
      } else {
         // Fallback if structure is unexpected (should have default)
         console.warn(`Source config for '${resultSourceKey}' missing 'openNewTab' property or has unexpected structure. Defaulting to true.`);
         openInNewTabValue = true;
      }
    } else {
      // Fallback for unknown or unconfigured sources
      console.warn(`Unknown or unconfigured source type '${resultSourceKey}' encountered in SearchResults. Defaulting openInNewTab to true.`);
      openInNewTabValue = true;
    }
  } else if (isLoading) {
      // While loading, default doesn't matter much
      openInNewTabValue = true;
  } else {
      // No resultsData or source, default to true
      openInNewTabValue = true;
  }
  // --- End determining openInNewTab setting ---


  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[400px]" />
            <Skeleton className="h-4 w-[300px]" />
            <Skeleton className="h-4 w-[500px]" />
          </div>
        ))}
      </div>
    )
  }

  // No results state (or no infobox data for knowledge tab)
  if (!resultsData || (!resultsData.searchResults || resultsData.searchResults.length === 0) && (!resultsData.infoboxes || resultsData.infoboxes.length === 0)) {
     // If NO searchResults AND NO infoboxes, then show no results message
     console.log("No search results or infoboxes found.");
    return (
      <div>
        {query ? (
          <p>
            No results found for "{query}" using {knowledgeSource}.
          </p>
        ) : (
          <p>Enter a search query to see results.</p>
        )}
      </div>
    )
  }

  // Extract the actual list of results (might be empty if only infoboxes exist)
  const searchResultsList = resultsData.searchResults || [];

  // Helper to assert type for rendering (use cautiously)
  const isWebResultArray = (results: SearchResultItem[]): results is WebResult[] => {
      // Basic check, assumes homogeneity if the first item fits
      return results.length > 0 && 'url' in results[0] && 'title' in results[0] && 'content' in results[0];
  };
  const isYoutubeResultArray = (results: SearchResultItem[]): results is YouTubeResultItem[] => {
      // Use a property specific to YouTubeResultItem, like vid or channel_name
      return results.length > 0 && ('vid' in results[0] || 'channel_name' in results[0]) && results[0].source === 'youtube';
  };
  const isPhotoResultArray = (results: SearchResultItem[]): results is PhotoResultItem[] => {
      // Use properties specific to PhotoResultItem
      return results.length > 0 && 'filename' in results[0] && 'relative_path' in results[0] && results[0].source === 'photos';
  };

  return (
    <>
      {/* Display non-critical errors for Obsidian */}
      {resultsData.source === 'obsidian' && resultsData.nonCriticalErrors && resultsData.nonCriticalErrors.length > 0 && (
        <Alert variant="destructive" className="mb-4 bg-yellow-900/30 border-yellow-700 text-yellow-300">
          <AlertCircle className="h-4 w-4 text-yellow-500" />
          <AlertDescription>
            <p className="font-medium mb-1">Note: Some files could not be searched:</p>
            <ul className="list-disc list-inside text-xs">
              {resultsData.nonCriticalErrors.map((err: string, index: number) => (
                <li key={`obsidian-error-${index}`}>{err}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* --- Render logic based on knowledgeSource --- */}
      {knowledgeSource === 'web' ? (
        // --- START: Rendering for 'web' (Web/SearXNG) Source ---
        (() => { // Wrap in IIFE to define displayMode
          // Determine the display mode: force grid for images/videos, else use setting
          const displayMode = 
            (activeTab === 'images' || activeTab === 'videos') 
            ? 'grid' // Force grid for image/video tabs
            : resultsLayout; // Use the setting value otherwise
          
          console.log(`[SearchResults Render] knowledgeSource: web, activeTab: ${activeTab}, SettingLayout: ${resultsLayout}, Final displayMode: ${displayMode}`); // Log decision

          return (
        <>
              {/* 1. Render Infoboxes if they exist - USE RENAMED COMPONENT */}
          {resultsData?.infoboxes && resultsData.infoboxes.length > 0 && (
            <div className="mb-6">
                  <WebInfoboxResults infoboxes={resultsData.infoboxes} openInNewTab={openInNewTabValue}/>
            </div>
          )}

              {/* 2. Render Standard Results based on calculated displayMode - USE RENAMED COMPONENTS */}
          {searchResultsList.length > 0 && (
            <>
                  {displayMode === "list" && (
                    <WebListResults results={searchResultsList} openInNewTab={openInNewTabValue} />
              )}
                  {displayMode === "grid" && isWebResultArray(searchResultsList) && (
                <WebGridResults 
                  results={searchResultsList} 
                  openInNewTab={openInNewTabValue} 
                  resultsColumns={settings?.personalSources?.web?.resultsColumns || 4}
                />
              )}
                  {displayMode === "compact" && isWebResultArray(searchResultsList) && (
                    <WebCompactResults 
                  results={searchResultsList} 
                  openInNewTab={openInNewTabValue} 
                />
              )}
                  {/* Fallback to list view - USE RENAMED COMPONENT */}
                  {(displayMode === "grid" || displayMode === "compact") && !isWebResultArray(searchResultsList) && (
                    <WebListResults results={searchResultsList} openInNewTab={openInNewTabValue} />
              )}
            </>
          )}
          
          {/* Add rendering for Answers/Suggestions if needed here */}
          {/* {resultsData?.answers && resultsData.answers.length > 0 && <AnswersComponent answers={resultsData.answers} />} */}
          {/* {resultsData?.suggestions && resultsData.suggestions.length > 0 && <SuggestionsComponent suggestions={resultsData.suggestions} />} */}
        </>
          );
        })()
        // --- END: Rendering for 'web' Source ---

      ) : (
        // --- START: Refactored Rendering for OTHER Knowledge Sources ---
        <>
          {/* Place the existing logic for YouTube, Photos, Obsidian, etc. here */}
          {/* Only render this section if searchResultsList is not empty for non-normal sources */}
          {searchResultsList.length > 0 && (() => {
            const source = resultsData.source; // Use the source from the data itself

            // Specific source layouts take precedence (YouTube, Photos)
            // REPLACED IF/ELSE CHAIN WITH SWITCH STATEMENT
            switch (source) {
              case 'youtube':
                if (isYoutubeResultArray(searchResultsList)) {
                  // Use defaultYouTubeView prop from parent (app/search/page.tsx)
              if (defaultYouTubeView === 'card') {
                    console.log("[SearchResults Render] Rendering YoutubeGridResults");
                return <YoutubeGridResults results={searchResultsList} openInNewTab={openInNewTabValue} />;
              } else {
                    console.log("[SearchResults Render] Rendering WebListResults for YouTube"); // Log updated
                    return <WebListResults results={searchResultsList} openInNewTab={openInNewTabValue} />; // USE RENAMED COMPONENT
              }
            }
                // Fallback if type guard fails
                console.warn("Data source is 'youtube' but results don't match YouTubeResultItem structure. Falling back to WebListResults."); // Log updated
                return <WebListResults results={searchResultsList} openInNewTab={openInNewTabValue} />; // USE RENAMED COMPONENT

              case 'photos':
                if (isPhotoResultArray(searchResultsList)) {
                   // Use defaultPhotosView prop from parent (app/search/page.tsx)
              if (defaultPhotosView === 'card') {
                    console.log("[SearchResults Render] Rendering PhotoGridResults");
                return <PhotoGridResults results={searchResultsList} openInNewTab={openInNewTabValue} />;
              } else {
                    console.log("[SearchResults Render] Rendering WebListResults for Photos"); // Log updated
                    return <WebListResults results={searchResultsList} openInNewTab={openInNewTabValue} />; // USE RENAMED COMPONENT
              }
            }
                 // Fallback if type guard fails
                console.warn("Data source is 'photos' but results don't match PhotoResultItem structure. Falling back to WebListResults."); // Log updated
                return <WebListResults results={searchResultsList} openInNewTab={openInNewTabValue} />; // USE RENAMED COMPONENT

              case 'obsidian':
                console.log("[SearchResults Render] Rendering WebListResults for obsidian source"); // Log updated
                return <WebListResults results={searchResultsList} openInNewTab={openInNewTabValue} />; // USE RENAMED COMPONENT

              case 'localFiles':
              case 'ai':
                console.log(`[SearchResults Render] Rendering WebListResults for source: ${source}`); // <-- Updated log
                // Assuming WebListResults is the desired view for these
                return <WebListResults results={searchResultsList} openInNewTab={openInNewTabValue} />;

              default:
                // Fallback for any unexpected source type or if source is missing from data
                console.warn(`[SearchResults Render] Unhandled source type: ${source}. Falling back to WebListResults.`); // <-- Updated log
                return <WebListResults results={searchResultsList} openInNewTab={openInNewTabValue} />;
            }
          })()}
        </>
        // --- END: Refactored Rendering for OTHER Knowledge Sources ---
      )}
      
    </>
  );
}

export default SearchResults
