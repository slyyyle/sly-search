"use client";

import type React from 'react';
import { SearchResultItem, YouTubeResultItem } from '@/types/search';
import YoutubeCardItem from './youtube-card-item'; // Import the card item component
import { useSettings } from '@/lib/use-settings'; // <-- Import useSettings

interface YoutubeGridResultsProps {
  results: SearchResultItem[]; // Accept the general type, filter inside
  openInNewTab?: boolean;
}

// Helper type guard (already exists in list-item, maybe move to utils?)
function isYouTubeResult(result: SearchResultItem): result is YouTubeResultItem {
  return result.source === 'youtube';
}

const YoutubeGridResults: React.FC<YoutubeGridResultsProps> = ({ results, openInNewTab = true }) => {
  // Filter out only YouTube results
  const youtubeResults = results.filter(isYouTubeResult);
  const { settings } = useSettings(); // <-- Get settings

  // --- Get resultsColumns setting --- 
  const resultsColumns = settings.personalSources?.youtube?.resultsColumns ?? 4;
  // --- End Get resultsColumns --- 

  if (!youtubeResults || youtubeResults.length === 0) {
    return <p>No YouTube results found.</p>; // Should ideally not happen if this component is called correctly
  }

  const generateResultKey = (result: YouTubeResultItem): string => {
    // Use vid if available, otherwise fallback to url or title
    return result.vid || result.url || `${result.title}-${JSON.stringify(result)}`;
  };

  // --- Function to get grid classes based on columns --- 
  const getGridClasses = (columns: number): string => {
    // Simple responsive strategy: fewer columns on smaller screens
    // Adjust these breakpoints and column counts as needed
    const baseCols = `grid-cols-${Math.max(1, Math.floor(columns / 3))}`;
    const smCols = `sm:grid-cols-${Math.max(1, Math.floor(columns / 2))}`;
    const mdCols = `md:grid-cols-${Math.max(1, Math.floor(columns * 0.75))}`;
    const lgCols = `lg:grid-cols-${columns}`;
    // Limit max columns Tailwind supports by default (usually 12)
    if (columns > 12) columns = 12;
    if (columns < 1) columns = 1;

    // Mapping to ensure valid Tailwind classes (up to grid-cols-10 as per schema)
    const classMap: { [key: number]: string } = {
      1: 'grid-cols-1',
      2: 'sm:grid-cols-2 grid-cols-1',
      3: 'md:grid-cols-3 sm:grid-cols-2 grid-cols-1',
      4: 'lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1',
      5: 'lg:grid-cols-5 md:grid-cols-4 sm:grid-cols-3 grid-cols-2',
      6: 'lg:grid-cols-6 md:grid-cols-4 sm:grid-cols-3 grid-cols-2',
      7: 'lg:grid-cols-7 md:grid-cols-5 sm:grid-cols-4 grid-cols-3',
      8: 'lg:grid-cols-8 md:grid-cols-6 sm:grid-cols-4 grid-cols-3',
      9: 'lg:grid-cols-9 md:grid-cols-6 sm:grid-cols-5 grid-cols-4',
      10: 'lg:grid-cols-10 md:grid-cols-7 sm:grid-cols-5 grid-cols-4',
    };
    // Fallback to a reasonable default if columns is outside 1-10
    const responsiveClasses = classMap[columns] || 'lg:grid-cols-4 md:grid-cols-3 sm:grid-cols-2 grid-cols-1';
    
    return `grid ${responsiveClasses} gap-4 lg:gap-6`;
  };
  // --- End Function --- 

  return (
    <div className={getGridClasses(resultsColumns)}> {/* Apply dynamic classes */}
      {youtubeResults.map((result, index) => {
        const uniqueKey = `${result.vid || result.url || `result-item`}-${index}`;
        return (
        <YoutubeCardItem
            key={uniqueKey}
          result={result}
          openInNewTab={openInNewTab}
        />
        );
      })}
    </div>
  );
};

export default YoutubeGridResults; 