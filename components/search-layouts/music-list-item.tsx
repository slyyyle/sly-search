"use client";

import React from 'react';
import { MusicResultItem } from '@/types/search'; // Use the actual type
import { Music } from 'lucide-react'; // Use a music icon
import { cn } from '@/lib/utils';

interface MusicListItemProps {
  result: MusicResultItem;
  openInNewTab?: boolean; // Keep for consistency, might be used later
}

export const MusicListItem: React.FC<MusicListItemProps> = ({
  result,
  openInNewTab = true, // Not used currently
}) => {
  const displayTitle = result.title || "Unknown Track";
  const displayArtist = result.artist || "Unknown Artist";
  const displayAlbum = result.album || "Unknown Album";
  const displayPath = result.filepath || "No file path";

  // Format duration (seconds to mm:ss) - Optional helper
  const formatDuration = (seconds: number | undefined): string => {
    if (seconds === undefined || seconds === null || isNaN(seconds)) {
      return "--:--";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const durationString = formatDuration(result.duration);

  return (
    <div className="result-item flex items-start gap-4 p-4 border border-border/40 rounded-lg bg-card text-card-foreground shadow-sm">
      {/* Icon */}
      <div className="flex-shrink-0 mt-1">
        <Music className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="flex-grow">
        {/* Title */}
        <h3 className="text-base font-medium line-clamp-1 mb-1" title={displayTitle}>
          {displayTitle}
        </h3>

        {/* Artist / Album / Duration */}
        <div className="text-sm text-muted-foreground mb-2 space-x-2">
          <span>{displayArtist}</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="italic">{displayAlbum}</span>
          {result.duration !== undefined && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span>{durationString}</span>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="text-xs text-muted-foreground/80 flex items-center gap-2">
          <span>Source: Music</span>
          <span className="text-muted-foreground/50">•</span>
          <span className="truncate" title={displayPath}>Path: {displayPath}</span>
        </div>
      </div>

      {/* Placeholder for potential actions (e.g., play button) - Add later */}
      {/* <div className="ml-auto flex-shrink-0"> */}
      {/*   <button>Play</button> */}
      {/* </div> */}
    </div>
  );
}; 