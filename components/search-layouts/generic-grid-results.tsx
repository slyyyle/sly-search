"use client";

import type React from "react";
import { type SearchResultItem, type WebResult, type YouTubeResultItem, type PhotoResultItem } from '@/types/search'; // Keep only relevant types

// Import specific CardItem components
import PhotoCardItem from './photo-card-item'; 
import YoutubeCardItem from './youtube-card-item'; 
import WebCardItem from './web-card-item'; 
// Removed imports/placeholders for Obsidian, FreshRSS, Music cards

interface GenericGridResultsProps {
  results: SearchResultItem[];
  sourceType?: string; // Still useful for context or potentially mixed web results
  openInNewTab: boolean;
  // columns?: number;
}

// --- Type Guards --- 
function isWebResult(result: SearchResultItem): result is WebResult {
  return result.source === 'web';
}

function isYouTubeResult(result: SearchResultItem): result is YouTubeResultItem {
  return result.source === 'youtube'; // Personal YouTube source
}

function isPhotoResult(result: SearchResultItem): result is PhotoResultItem {
  return result.source === 'photos';
}
// Removed type guards for Obsidian, Music, FreshRSS
// --- End Type Guards ---

const GenericGridResults: React.FC<GenericGridResultsProps> = ({ results, sourceType, openInNewTab /*, columns = 4 */ }) => {
  if (!results || results.length === 0) {
    return <p className="text-muted-foreground">No results found.</p>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-1">
      {results.map((result, index) => {
        // Updated key generation slightly for robustness
        const key = `${result.source || 'unknown-grid'}-${index}-${(result as any).id || (result as any).url || (result as any).path || (result as any).title || index}`;

        if (isPhotoResult(result)) {
          return <PhotoCardItem key={key} result={result} openInNewTab={openInNewTab} />;
        } else if (isYouTubeResult(result)) { // Personal YouTube source
          return <YoutubeCardItem key={key} result={result} />;
        } else if (isWebResult(result)) { // Only relevant if user chose Grid for Web
          return <WebCardItem key={key} result={result} openInNewTab={openInNewTab} />;
        } 
        // Removed checks for Obsidian, FreshRSS, Music
        else {
          // Should ideally not happen if called correctly based on source type, 
          // but handles unexpected data.
          console.warn(`GenericGridResults encountered unexpected source: ${result.source}, title: ${(result as any).title}`);
          return null; 
        }
      })}
    </div>
  );
};

export default GenericGridResults; 