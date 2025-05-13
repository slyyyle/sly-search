"use client";

import React from 'react';
import { ObsidianResult } from '@/types/search';
import { FileText } from 'lucide-react'; // Using a generic file icon
import { useSettings } from '@/lib/use-settings'; // Need settings for vault name
import { cn } from '@/lib/utils'; // For conditional classes if needed

interface ObsidianListItemProps {
  result: ObsidianResult;
  openInNewTab?: boolean; // Keep prop, though Obsidian URIs might not respect it
}

export const ObsidianListItem: React.FC<ObsidianListItemProps> = ({
  result,
  openInNewTab = true, // Default, but may not apply to obsidian:// URIs
}) => {
  const { settings } = useSettings();
  const vaultName = settings.personalSources?.obsidian?.vaultName;

  // Construct the Obsidian URI if vault name is available
  const obsidianUri = vaultName ? `obsidian://open?vault=${encodeURIComponent(vaultName)}&file=${encodeURIComponent(result.path)}` : '#'; // Fallback if vault name missing

  const displayTitle = result.title || result.path.split('/').pop() || "Obsidian Note"; // Use title, fallback to filename
  const displayContent = result.snippet || result.content || result.path; // Use snippet, fallback to content, fallback to path

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (!vaultName) {
      e.preventDefault();
      // Optionally show a toast or log an error that vault name is missing
      console.error("Obsidian vault name not configured in settings.");
      // You might want to add a toast notification here using useToast
    }
    // Standard link behavior (opening obsidian:// URI) will proceed if vaultName exists
  };

  return (
    <div className="result-item group flex flex-col md:flex-row items-start gap-4 p-4 border border-border/40 rounded-lg bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors">
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-grow">
        {/* Title and Link */}
        <a
          href={obsidianUri}
          // target={openInNewTab ? '_blank' : '_self'} // target="_blank" might not work well with obsidian:// URIs
          rel="noopener noreferrer" // Good practice, though less relevant for local URIs
          className="block mb-1 group-hover:underline"
          onClick={handleLinkClick}
          aria-disabled={!vaultName} // Indicate if link is non-functional
        >
          <h3 className={cn(
            "text-base font-medium line-clamp-1",
            !vaultName && "text-muted-foreground cursor-not-allowed" // Style if link disabled
          )}>
            {displayTitle}
          </h3>
        </a>

        {/* Snippet / Content / Path */}
        <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
          {displayContent}
        </p>

        {/* Footer Info */}
        <div className="text-xs text-muted-foreground/80 flex items-center gap-2">
          <span>Source: Obsidian</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="truncate" title={result.path}>Path: {result.path}</span>
        </div>
      </div>
    </div>
  );
}; 