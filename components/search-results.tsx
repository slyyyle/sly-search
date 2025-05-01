"use client"

import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import ListResults from "@/components/search-layouts/list-results"
import YoutubeGridResults from "@/components/search-layouts/youtube-grid-results"
import PhotoGridResults from "@/components/search-layouts/photo-results"
import WebGridResults from "./search-layouts/web-grid-results"
import CompactResults from "./search-layouts/compact-results"
import InfoboxResults from "./search-layouts/infobox-results"
import { useSettings } from "@/lib/use-settings"
import type { SearchResultsState, WebResult, YouTubeResultItem, PhotoResultItem, SearchResultItem, Infobox } from "@/types/search"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface SearchResultsProps {
  isLoading: boolean
  resultsData: SearchResultsState | null
  query: string
  knowledgeSource: string // The UI selected source (e.g., 'normal', 'obsidian-notes')
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
      // Use source-specific setting if available (handles 'normal'/'web' now too)
      const sourceConfig = settings.personalSources[resultSourceKey as keyof typeof settings.personalSources];
      if (sourceConfig && typeof sourceConfig === 'object' && 'openNewTab' in sourceConfig) {
         openInNewTabValue = sourceConfig.openNewTab ?? true;
      } else {
         // Fallback if structure is unexpected (should have default)
         console.warn(`Source config for '${resultSourceKey}' missing 'openNewTab' property or has unexpected structure. Defaulting to true.`);
         openInNewTabValue = true;
      }
    } else {
      // Fallback for unknown or unconfigured sources (shouldn't include 'normal' anymore)
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
      {knowledgeSource === 'normal' ? (
        // --- START: Rendering for 'normal' (Web/SearXNG) Source ---
        <>
          {/* 1. Render Infoboxes if they exist */}
          {resultsData?.infoboxes && resultsData.infoboxes.length > 0 && (
            <div className="mb-6">
              <InfoboxResults infoboxes={resultsData.infoboxes} openInNewTab={openInNewTabValue}/>
            </div>
          )}

          {/* 2. Render Standard Results based on resultsLayout setting */}
          {searchResultsList.length > 0 && (
            <>
              {resultsLayout === "list" && (
                <ListResults results={searchResultsList} openInNewTab={openInNewTabValue} />
              )}
              {resultsLayout === "grid" && isWebResultArray(searchResultsList) && (
                <WebGridResults 
                  results={searchResultsList} 
                  openInNewTab={openInNewTabValue} 
                  resultsColumns={settings?.personalSources?.web?.resultsColumns || 4}
                />
              )}
              {resultsLayout === "compact" && isWebResultArray(searchResultsList) && (
                <CompactResults 
                  results={searchResultsList} 
                  openInNewTab={openInNewTabValue} 
                />
              )}
              {/* Fallback to list view if grid/compact selected but results aren't web results */}
              {(resultsLayout === "grid" || resultsLayout === "compact") && !isWebResultArray(searchResultsList) && (
                <ListResults results={searchResultsList} openInNewTab={openInNewTabValue} />
              )}
            </>
          )}
          
          {/* Add rendering for Answers/Suggestions if needed here */}
          {/* {resultsData?.answers && resultsData.answers.length > 0 && <AnswersComponent answers={resultsData.answers} />} */}
          {/* {resultsData?.suggestions && resultsData.suggestions.length > 0 && <SuggestionsComponent suggestions={resultsData.suggestions} />} */}
        </>
        // --- END: Rendering for 'normal' Source ---

      ) : (
        // --- START: Rendering for OTHER Knowledge Sources ---
        <>
          {/* Place the existing logic for YouTube, Photos, Obsidian, etc. here */}
          {/* Only render this section if searchResultsList is not empty for non-normal sources */}
          {searchResultsList.length > 0 && (() => {
            const source = resultsData.source; // Use the source from the data itself

            // Specific source layouts take precedence (YouTube, Photos)
            if (source === 'youtube' && isYoutubeResultArray(searchResultsList)) {
              if (defaultYouTubeView === 'card') {
                console.log("Rendering YoutubeGridResults");
                return <YoutubeGridResults results={searchResultsList} openInNewTab={openInNewTabValue} />;
              } else {
                console.log("Rendering ListResults for YouTube");
                return <ListResults results={searchResultsList} openInNewTab={openInNewTabValue} />;
              }
            }

            if (source === 'photos' && isPhotoResultArray(searchResultsList)) {
              if (defaultPhotosView === 'card') {
                console.log("Rendering PhotoGridResults");
                return <PhotoGridResults results={searchResultsList} openInNewTab={openInNewTabValue} />;
              } else {
                console.log("Rendering ListResults for Photos");
                return <ListResults results={searchResultsList} openInNewTab={openInNewTabValue} />;
              }
            }

            // Handle Obsidian (Always List view for now)
            if (source === 'obsidian') {
                console.log(`Rendering ListResults for obsidian source`);
                return <ListResults results={searchResultsList} openInNewTab={openInNewTabValue} />;
            }
            
            // Handle other potential sources (localFiles, ai, etc.) - Defaulting to List view
            // The List/Card toggle modified webResultsView applies here conceptually, 
            // but we're currently forcing ListResults. Can be refined later if Card view is needed for these.
            if (source === 'localFiles' || source === 'ai' || !source /* Treat missing source as non-normal */) {
               console.log(`Rendering ListResults for non-normal source: ${source || 'unknown'}`);
               return <ListResults results={searchResultsList} openInNewTab={openInNewTabValue} />;
               /* 
               // Example if Card view was desired for these based on the toggle:
               if (webResultsView === 'card') {
                  // Potentially render a generic CardGrid or reuse WebGridResults if appropriate
                  console.log(`Rendering Card view for non-normal source: ${source}`);
                  return <WebGridResults results={searchResultsList} openInNewTab={openInNewTabValue} resultsColumns={4} />; 
               } else {
                  console.log(`Rendering List view for non-normal source: ${source}`);
                  return <ListResults results={searchResultsList} openInNewTab={openInNewTabValue} />;
               }
               */
            }

            // Fallback for any truly unexpected source type
            console.warn(`Unhandled non-normal source type: ${source}. Falling back to ListResults.`);
            return <ListResults results={searchResultsList} openInNewTab={openInNewTabValue} />;

          })()}
        </>
        // --- END: Rendering for OTHER Knowledge Sources ---
      )}
      
    </>
  );
}

export default SearchResults
