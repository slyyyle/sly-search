"use client";

import React, { useState } from 'react';
import { PhotoResultItem } from '@/types/search';
import { ExternalLink, ImageOff, Folder } from 'lucide-react'; // Import icons
import { cn } from '@/lib/utils'; // For potential utility class usage
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import Image from 'next/image';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface PhotoCardItemProps {
  result: PhotoResultItem;
  openInNewTab?: boolean;
}

const PhotoCardItem: React.FC<PhotoCardItemProps> = ({ result, openInNewTab = true }) => {
  const [imageError, setImageError] = useState(false);

  // Construct the URL to fetch the photo from the backend API
  // Ensure the relative_path is properly encoded
  const photoUrl = `/api/photos/${encodeURIComponent(result.relative_path)}`;

  // Function to format date/time nicely (optional)
  const formatDateTime = (timestamp: number | null | undefined): string => {
    if (!timestamp) return 'Date unknown';
    // Convert seconds to milliseconds if needed (check API response format)
    // const date = new Date(timestamp * 1000); 
    const date = new Date(timestamp); // Assuming timestamp is milliseconds or parsable string
    return date.toLocaleString(); // Adjust formatting as needed
  };

  // --- Extract Directory Path --- 
  const getDirectoryPath = (relativePath: string): string => {
      const lastSlashIndex = relativePath.lastIndexOf('/');
      if (lastSlashIndex === -1) {
          return '/'; // Indicate root directory
      }
      return relativePath.substring(0, lastSlashIndex) || '/'; // Return path or root if substring is empty
  };
  const directoryPath = getDirectoryPath(result.relative_path);
  // --- End Extract Directory Path --- 

  return (
    <Card className="overflow-hidden flex flex-col h-full">
      <CardHeader className="p-3 pb-1">
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <CardTitle className="text-sm font-medium truncate leading-tight">
                {result.filename}
              </CardTitle>
            </TooltipTrigger>
            <TooltipContent>
              <p>{result.filename}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-3 flex-grow flex flex-col justify-center">
        <AspectRatio ratio={16 / 9} className="bg-muted rounded-md overflow-hidden">
          {imageError ? (
            <div className="w-full h-full bg-gray-700 flex items-center justify-center text-gray-500">
              <ImageOff size={48} />
            </div>
          ) : (
            <Image
              src={photoUrl}
              alt={result.filename}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
              loading="lazy"
              onError={() => setImageError(true)}
            />
          )}
        </AspectRatio>
      </CardContent>
      <CardFooter className="p-3 pt-1 text-xs text-muted-foreground">
        <div className="flex items-center justify-center">
          <Folder className="h-3 w-3 mr-1 flex-shrink-0" />
          <TooltipProvider delayDuration={100}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="truncate" title={directoryPath}>{directoryPath}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{directoryPath}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PhotoCardItem; 