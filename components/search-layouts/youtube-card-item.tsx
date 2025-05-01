"use client"

import type React from 'react';
import { YouTubeResultItem } from '@/types/search';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link'; // Use NextLink for internal routing if needed, but these are external
import { useSettings } from "@/lib/use-settings";

interface YoutubeCardItemProps {
  result: YouTubeResultItem;
  openInNewTab?: boolean;
}

const YoutubeCardItem: React.FC<YoutubeCardItemProps> = ({ result, openInNewTab = true }) => {
  // Get Invidious instance from settings
  const { settings } = useSettings();
  const invidiousInstance = settings?.personalSources?.youtube?.invidiousInstance || "yewtu.be";
  
  const target = openInNewTab ? '_blank' : '_self';
  const rel = openInNewTab ? 'noopener noreferrer' : '';
  const embedUrl = `https://${invidiousInstance}/embed/${result.vid}`;

  return (
    <Card className="flex flex-col h-full overflow-hidden"> {/* Ensure card flexes and handles overflow */}
      {result.thumbnail_url && (
        <div className="aspect-video overflow-hidden"> {/* Maintain aspect ratio */}
          <img
            src={result.thumbnail_url}
            alt={`Thumbnail for ${result.title}`}
            className="object-cover w-full h-full" // Cover the area
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>
      )}
      <CardHeader className="p-4">
        <CardTitle className="text-base font-semibold leading-tight"> {/* Adjusted title size */}
          {/* Make the main title clickable with original URL */}
          <a href={result.url} target={target} rel={rel} className="hover:underline">
             {result.title}
          </a>
        </CardTitle>
        {result.channel_name && (
          <p className="text-xs text-muted-foreground pt-1">{result.channel_name}</p>
        )}
      </CardHeader>
      {/* Removed CardContent as description isn't typically shown on YT cards */}
      <CardFooter className="p-4 pt-0 mt-auto"> {/* Push footer to bottom */}
        {result.vid && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-blue-400">
            <span className="text-gray-400 font-medium">Watch:</span>
            <a href={`https://${invidiousInstance}/watch?v=${result.vid}`} target="_blank" rel="noopener noreferrer" className="hover:underline">Invidious</a>
            <a 
              href={embedUrl}
              rel="noopener noreferrer" 
              className="hover:underline text-blue-400"
            >
              (Fullscreen)
            </a>
            <a href={`https://cinemaphile.com/watch?v=${result.vid}`} target="_blank" rel="noopener noreferrer" className="hover:underline">HookTube</a>
            <a href={`https://www.youtube.com/watch?v=${result.vid}`} target="_blank" rel="noopener noreferrer" className="hover:underline">YouTube</a>
          </div>
        )}
      </CardFooter>
    </Card>
  );
};

export default YoutubeCardItem; 