"use client"

import type React from "react"
import { Skeleton } from "@/components/ui/skeleton"
import ListResults from "@/components/search-layouts/list-results"
import { useSettings } from "@/lib/use-settings"

interface SearchResultsProps {
  isLoading: boolean
  results: any
  query: string
  knowledgeSource: string
  openInNewTab?: boolean
}

const SearchResults: React.FC<SearchResultsProps> = ({
  isLoading,
  results,
  query,
  knowledgeSource,
  openInNewTab = true,
}) => {
  const { settings } = useSettings()
  const resultsLayout = settings.appearance?.resultsLayout || "list"

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

  // No results state
  if (!results || !results.results || results.results.length === 0) {
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

  // Render the appropriate layout based on settings
  switch (resultsLayout) {
    case "list":
    default:
      return <ListResults results={results.results} openInNewTab={openInNewTab} />
    case "grid":
      // Grid layout will be implemented later
      return <div className="text-yellow-500">Grid layout not yet implemented. Showing list view instead.</div>
    case "compact":
      // Compact layout will be implemented later
      return <div className="text-yellow-500">Compact layout not yet implemented. Showing list view instead.</div>
  }
}

export default SearchResults
