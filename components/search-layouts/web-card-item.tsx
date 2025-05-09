"use client"

import React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { WebResult } from "@/types/search"
import { cn } from "@/lib/utils"
import Image from 'next/image';
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface WebCardItemProps {
  result: WebResult;
  openInNewTab?: boolean;
}

const WebCardItem: React.FC<WebCardItemProps> = ({ result, openInNewTab = true }) => {
  const target = openInNewTab ? "_blank" : "_self"

  // Basic favicon fetching (replace with a more robust solution if needed)
  const getFaviconUrl = (url: string): string | null => {
    // ADD CHECK: Return null if URL is empty or clearly invalid
    if (!url || typeof url !== 'string' || !url.startsWith('http')) {
      return null; 
    }
    try {
      const { hostname } = new URL(url);
      // Using Google's S2 service - may have privacy implications
      return `https://www.google.com/s2/favicons?sz=32&domain_url=${hostname}`; 
      // Alternative (less reliable): return `https://${hostname}/favicon.ico`;
    } catch (error) {
      console.error(`Error parsing URL for favicon: ${url}`, error);
      return null; // Return null if URL parsing fails for any reason
    }
  }

  const faviconUrl = getFaviconUrl(result.url);

  return (
    <Card className="flex flex-col h-full overflow-hidden hover:shadow-lg transition-shadow duration-200 bg-background/60">
      {/* Image at the top if present */}
      {result.img_src && (
        <AspectRatio ratio={16 / 9} className="bg-muted rounded-t-md overflow-hidden">
          <Image
            src={result.img_src}
            alt={result.title || 'Result image'}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 20vw"
            loading="lazy"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </AspectRatio>
      )}
      <CardHeader className="p-4">
        <div className="flex items-start gap-3">
          {faviconUrl && (
            <img 
              src={faviconUrl} 
              alt="" 
              className="h-5 w-5 mt-1 object-contain" 
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} // Hide if favicon fails
            />
          )}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base font-medium">
              <Link href={result.url} target={target} rel="noopener noreferrer" className="text-blue-400 hover:underline line-clamp-2">
                {result.title}
              </Link>
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground truncate pt-1">
              {result.url}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {result.content}
        </p>
      </CardContent>
    </Card>
  );
}

export default WebCardItem; 