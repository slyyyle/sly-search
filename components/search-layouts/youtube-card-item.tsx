"use client"

import React from 'react';
import Image from 'next/image'; // Use Next.js Image for optimization
import { YouTubeResultItem } from '@/types/search';
import { PlayCircle } from 'lucide-react'; // Icon overlay for thumbnail
import { cn } from '@/lib/utils';
import { useSettings } from "@/lib/use-settings";

interface YoutubeCardItemProps {
  result: YouTubeResultItem;
  // openInNewTab is handled by the parent link wrapping the card usually
}

const YoutubeCardItem: React.FC<YoutubeCardItemProps> = ({ result }) => {
  const displayTitle = result.title || "YouTube Video";
  const displayChannel = result.channel_name || "Unknown Channel";
  // Use thumbnail_url if available, otherwise maybe a placeholder?
  const thumbnailUrl = result.thumbnail_url;

  // Get Invidious instance from settings
  const { settings } = useSettings();
  const invidiousInstance = settings?.personalSources?.youtube?.invidiousInstance || "yewtu.be";
  
  return (
    <a
      href={result.url} // Link the whole card to the YouTube video URL
      target="_blank" // Always open YouTube links in new tab
      rel="noopener noreferrer"
      className={cn(
        "youtube-card-item group block overflow-hidden rounded-lg border border-border/40 bg-card text-card-foreground shadow-sm",
        "transition-all duration-200 ease-in-out hover:shadow-md hover:border-border/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      {/* Thumbnail Section */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {thumbnailUrl ? (
          <Image
            src={thumbnailUrl}
            alt={`Thumbnail for ${displayTitle}`}
            fill // Use fill to cover the aspect-video container
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width: 1280px) 25vw, 20vw" // Basic responsive sizes
            className="object-cover transition-transform duration-300 ease-in-out group-hover:scale-105"
            onError={(e) => {
              // Optional: Handle broken images - hide element or show placeholder
              e.currentTarget.style.display = 'none'; 
              // Could also replace with a placeholder background in the parent div
            }}
          />
        ) : (
          // Placeholder if no thumbnail
          <div className="absolute inset-0 flex items-center justify-center bg-secondary">
            <PlayCircle className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
        {/* Play icon overlay - subtle */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <PlayCircle className="h-12 w-12 text-white/80" />
        </div>
      </div>

      {/* Info Section */}
      <div className="p-3">
        <h3
          className="text-sm font-medium line-clamp-2 mb-1 leading-tight group-hover:text-primary transition-colors"
          title={displayTitle}
        >
          {displayTitle}
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1" title={displayChannel}>
          {displayChannel}
        </p>
      </div>
    </a>
  );
};

export default YoutubeCardItem; 