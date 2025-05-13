"use client"

import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import WebCompactResults from "./search-layouts/WebCompactResults"
import WebInfoboxResults from "./search-layouts/WebInfoboxResults"
import { useSettings } from "@/lib/use-settings"
import type { SearchResultsState, WebResult, YouTubeResultItem, PhotoResultItem, SearchResultItem, Infobox } from "@/types/search"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { GenericListResults } from "./search-layouts/generic-list-results"
import GenericGridResults from "./search-layouts/generic-grid-results"

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
  const infoboxes = resultsData?.infoboxes || []; // Also define infoboxes here

  // --- INSERT NEW LOGIC START ---
  // --- Determine View Mode ---
  const userPreferredLayout = settings?.appearance?.resultsLayout || "list";
  let finalViewMode: "list" | "grid" | "compact" = "list"; // Default

  if (resultsData.source) { // source was defined earlier
    switch (resultsData.source) {
      case 'photos':
      case 'youtube':
        finalViewMode = 'grid';
        break;
      case 'obsidian':
      case 'music':
      case 'freshrss':
        finalViewMode = 'list';
        break;
      case 'web':
        finalViewMode = userPreferredLayout as "list" | "grid" | "compact";
        break;
      // Add cases for other known sources if they have specific rules
      // case 'localFiles':
      // case 'ai':
      default:
        // For unknown or unhandled sources, default to list
        finalViewMode = 'list';
        console.warn(`SearchResults: Unknown or unhandled source type "${resultsData.source}". Defaulting to list view.`);
        break;
    }
  } else if (infoboxes.length > 0 && searchResultsList.length === 0) {
      // If only infoboxes exist, we treat it as web for rendering the infobox
      console.log("Only infoboxes found, no search results to determine view mode.");
  } else {
    console.warn("SearchResults: Could not determine source from results data. Defaulting to list view.");
    finalViewMode = 'list'; // Default if source is somehow missing
  }

  // --- Determine openInNewTab Setting ---
  let openInNewTabValue = true; // Default to true
  const source = resultsData?.source; // Define source here for clarity
  const resultSourceKey = source as keyof typeof settings.personalSources;

  // Check if resultSourceKey is a valid key before accessing settings
  if (source && source !== 'web' && settings.personalSources && typeof resultSourceKey === 'string' && resultSourceKey in settings.personalSources) {
    // Add type assertion for indexing
    const sourceSettings = settings.personalSources[resultSourceKey as keyof typeof settings.personalSources];
    // Ensure sourceSettings is an object and has the openNewTab boolean property
    if (sourceSettings && typeof sourceSettings === 'object' && 'openNewTab' in sourceSettings && typeof sourceSettings.openNewTab === 'boolean') {
      openInNewTabValue = sourceSettings.openNewTab;
    }
  } else if (source === 'web' && typeof settings.personalSources?.web?.openNewTab === 'boolean') { // Corrected: openNewTab
      openInNewTabValue = settings.personalSources.web.openNewTab;
  }
  // --- End openInNewTab Setting ---

  // --- Render Results ---
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

      {/* Render Infoboxes (Always at the top for 'web' source) */}
      {infoboxes.length > 0 && (
        <WebInfoboxResults infoboxes={infoboxes} openInNewTab={openInNewTabValue} />
      )}

      {/* Render Search Results based on finalViewMode */}
      {searchResultsList.length > 0 && (
        <>
          {finalViewMode === 'list' && (
            <GenericListResults results={searchResultsList} openInNewTab={openInNewTabValue} />
          )}
          {finalViewMode === 'grid' && (
            <GenericGridResults results={searchResultsList} openInNewTab={openInNewTabValue} />
          )}
          {finalViewMode === 'compact' && (
            <WebCompactResults results={searchResultsList as WebResult[]} openInNewTab={openInNewTabValue} />
          )}
        </>
      )}
    </> // This is the closing tag from the *new* return statement's fragment
  );
}

export default SearchResults
