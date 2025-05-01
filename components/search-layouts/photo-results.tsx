"use client";

import React from 'react';
import { SearchResultItem, PhotoResultItem } from '@/types/search';
import PhotoCardItem from './photo-card-item'; // Import the new card item component
import { useSettings } from '@/lib/use-settings'; // <-- Import useSettings

interface PhotoGridResultsProps {
  results: SearchResultItem[]; // Accept the general type, filter inside
  openInNewTab?: boolean;
}

// Helper type guard for PhotoResultItem
function isPhotoResult(result: SearchResultItem): result is PhotoResultItem {
  return result.source === 'photos' && 'filename' in result && 'relative_path' in result;
}

const PhotoGridResults: React.FC<PhotoGridResultsProps> = ({ results, openInNewTab = true }) => {
  // Filter out only Photo results
  const photoResults = results.filter(isPhotoResult);
  const { settings } = useSettings(); // <-- Get settings

  // --- Get resultsColumns setting --- 
  const resultsColumns = settings.personalSources?.photos?.resultsColumns ?? 4;
  // --- End Get resultsColumns --- 

  if (!photoResults || photoResults.length === 0) {
    return <p>No photo results found.</p>; // Handle case where no photos are present
  }

  // Generate a unique key based on the relative path (should be unique)
  const generateResultKey = (result: PhotoResultItem): string => {
    return result.relative_path;
  };

  // --- Function to get grid classes based on columns (reuse or adapt from YouTube) --- 
  const getGridClasses = (columns: number): string => {
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
    
    return `grid ${responsiveClasses} gap-4`; // Use slightly smaller gap for photos maybe
  };
  // --- End Function --- 

  return (
    // Use a responsive grid similar to YouTube's, potentially adjust column counts
    <div className={getGridClasses(resultsColumns)}> {/* Apply dynamic classes */}
      {photoResults.map((result) => (
        <PhotoCardItem
          key={generateResultKey(result)}
          result={result}
          openInNewTab={openInNewTab}
        />
      ))}
    </div>
  );
};

export default PhotoGridResults; 