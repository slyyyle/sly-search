"use client"

import type React from "react"
import Link from "next/link"
import { ExternalLink } from "lucide-react"
import type { SearchResultItem, WebResult } from "@/types/search"

interface CompactResultsProps {
  results: SearchResultItem[]
  openInNewTab?: boolean
}

const isWebResult = (result: SearchResultItem): result is WebResult => {
  return 'url' in result && 'title' in result;
};

const CompactResults: React.FC<CompactResultsProps> = ({ results, openInNewTab = true }) => {
  if (!results || results.length === 0) {
    return <p>No results found.</p>
  }

  return (
    <div className="space-y-2">
      {results.map((result, index) => {
        // Only process web results
        if (!isWebResult(result)) return null;
        
        const webResult = result as WebResult;
        const resultUrl = webResult.url || "#";
        const resultTitle = webResult.title || "Untitled";
        
        // Extract domain from URL for display
        let displayUrl = resultUrl;
        try {
          const url = new URL(resultUrl);
          displayUrl = url.hostname;
        } catch (e) {
          // If URL parsing fails, use the original URL
        }
        
        return (
          <div key={`compact-result-${index}`} className="py-1">
            <Link
              href={resultUrl}
              target={openInNewTab ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className="text-sm flex items-center text-primary hover:underline"
            >
              <span className="truncate mr-1">{resultTitle}</span>
              {openInNewTab && <ExternalLink className="h-3 w-3 inline flex-shrink-0" />}
              <span className="ml-2 text-xs text-muted-foreground truncate">{displayUrl}</span>
            </Link>
          </div>
        );
      })}
    </div>
  )
}

export default CompactResults
