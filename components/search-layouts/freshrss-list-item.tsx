"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, Rss, Calendar, User } from "lucide-react"; // Import relevant icons
import { type FreshRSSResult } from "@/types/search"; // Import the specific type
import { Badge } from "@/components/ui/badge"; // For displaying categories/tags

interface FreshRSSListItemProps {
  result: FreshRSSResult;
  openInNewTab?: boolean;
}

// Helper to format timestamp (optional)
const formatTimestamp = (timestamp: number | undefined): string | null => {
  if (!timestamp) return null;
  try {
    return new Date(timestamp * 1000).toLocaleDateString(undefined, { 
      year: "numeric", month: "short", day: "numeric" 
    });
  } catch (e) {
    console.error("Error formatting timestamp:", e);
    return null;
  }
};

export const FreshRSSListItem: React.FC<FreshRSSListItemProps> = ({
  result,
  openInNewTab = true,
}) => {
  const target = openInNewTab ? "_blank" : "_self";
  const displayUrl = result.url || "N/A"; // <<< Display raw URL or N/A
  const rawDate = result.published_time; // <<< Use raw timestamp

  return (
    <div className="mb-6 p-4 border border-border/40 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 bg-card text-card-foreground">
      {/* Title and Link */}
      <h3 className="text-lg font-medium mb-1">
        <Link
          href={result.url}
          target={target}
          rel="noopener noreferrer"
          className="hover:underline text-primary hover:text-primary/80 transition-colors"
        >
          {result.title || "Untitled Article"}
        </Link>
      </h3>

      {/* Snippet / Content */}
      {result.snippet && (
        <p 
          className="text-sm text-muted-foreground mb-2" 
          // dangerouslySetInnerHTML={{ __html: result.snippet }} // Assuming snippet might contain basic HTML
        >
          {result.snippet} {/* Render as plain text */}
        </p>
      )}

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-2">
        {/* Source Info */}
        <div className="flex items-center gap-1">
          <Rss className="w-3 h-3 text-orange-500" /> 
          <span>
            FreshRSS 
            {result.feed_title && `: ${result.feed_title}`}
          </span> 
        </div>

        {/* Display URL */}
        <div className="flex items-center gap-1 hover:text-foreground transition-colors">
            <ExternalLink className="w-3 h-3" />
            <Link
                href={result.url}
                target={target}
                rel="noopener noreferrer"
                className="hover:underline "
                title={result.url}
            >
                {displayUrl} {/* <<< Use simplified displayUrl */}
            </Link>
        </div>
        
        {/* Author */}
        {result.author && (
          <div className="flex items-center gap-1">
            <User className="w-3 h-3" />
            <span>{result.author}</span>
          </div>
        )}

        {/* Published Date */}
        {rawDate && ( // <<< ADDED conditional raw date
            <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span>{new Date(rawDate * 1000).toISOString()}</span> {/* <<< ADDED raw date display */}
            </div>
        )}
      </div>

      {/* Categories/Tags */}
      {/* {result.categories && result.categories.length > 0 && ( // <<< REMOVED BADGE RENDERING
        <div className="flex flex-wrap gap-1">
          {result.categories.map((category, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {category}
            </Badge>
          ))}
        </div>
      )} */}
    </div>
  );
}; 