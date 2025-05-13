"use client";

import React from 'react';
import { type SearchResultItem, type WebResult, type ObsidianResult, type FreshRSSResult, type MusicResultItem } from '@/types/search';

// Import relevant list item components
import { WebListItem } from './web-list-item';
import { ObsidianListItem } from './obsidian-list-item';
import { MusicListItem } from './music-list-item';
import { FreshRSSListItem } from './freshrss-list-item';
// Import AIListItem when created
// import { AIListItem } from './ai-list-item';

interface GenericListResultsProps {
  results: SearchResultItem[];
  openInNewTab?: boolean;
}

// --- Helper type guards --- 
function isWebResult(result: SearchResultItem): result is WebResult {
  return result.source === 'web';
}

function isObsidianResult(result: SearchResultItem): result is ObsidianResult {
  return result.source === 'obsidian';
}

// Removed isYouTubeResult type guard
// Removed isPhotoResult type guard

// Placeholder for MusicResultItem - make slightly more specific to help TS
// Replace 'any' with actual MusicResultItem when defined
interface MusicResultPlaceholder { source: 'music'; [key: string]: any; }
function isMusicResult(result: SearchResultItem): result is MusicResultItem { 
  return result.source === 'music';
}

function isFreshRSSResult(result: SearchResultItem): result is FreshRSSResult {
  return result.source === 'freshrss' || result.result_type === 'freshrss';
}

// function isAIResult(result: SearchResultItem): result is import('@/types/search').AIResult {
//   return result.source === 'ai';
// }
// --- End Type Guards ---

export const GenericListResults: React.FC<GenericListResultsProps> = ({ results, openInNewTab }) => {
  return (
    <div className="list-results-container space-y-4">
      {results.map((result, index) => {
        const key = `${result.source || 'unknown-list'}-${index}-${(result as any).id || (result as any).url || (result as any).path || (result as any).title || index}`;

        if (isWebResult(result)) {
          return <WebListItem key={key} result={result} openInNewTab={openInNewTab} />;
        } else if (isObsidianResult(result)) {
          return <ObsidianListItem key={key} result={result} openInNewTab={openInNewTab} />;
        } else if (isFreshRSSResult(result)) { 
          return <FreshRSSListItem key={key} result={result} openInNewTab={openInNewTab} />;
        } else if (isMusicResult(result)) { 
          // Render MusicListItem.
          return <MusicListItem key={key} result={result} openInNewTab={openInNewTab} />;
        } 
        // else if (isAIResult(result)) { ... }
        else {
          // This final else handles any source type not explicitly checked above
          // (which should only be unexpected types for List view according to our rules)
          console.warn(`GenericListResults encountered unexpected source for List view: ${result.source}`);
          return null; 
        }
      })}
    </div>
  );
}; 