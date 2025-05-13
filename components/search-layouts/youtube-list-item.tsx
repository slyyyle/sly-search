"use client";

import React from "react";
import { type YouTubeResultItem } from "@/types/search";

interface YouTubeListItemProps {
  result: YouTubeResultItem;
  openInNewTab?: boolean;
}

export const YouTubeListItem: React.FC<YouTubeListItemProps> = ({
  result,
  openInNewTab = true,
}) => {
  // TODO: Implement actual rendering logic for YouTube list items
  // This might share similarities with YoutubeCardItem but in a list format
  return (
    <div className="mb-6 p-4 border border-border/40 rounded-lg shadow-sm bg-card text-card-foreground">
      <h3 className="text-lg font-medium mb-1">
        <a 
          href={result.url} 
          target={openInNewTab ? "_blank" : "_self"} 
          rel="noopener noreferrer" 
          className="hover:underline text-primary hover:text-primary/80 transition-colors"
        >
          {result.title || "YouTube Video"}
        </a>
      </h3>
      {result.thumbnail_url && (
        <img src={result.thumbnail_url} alt={result.title} className="w-32 h-auto float-left mr-4 mb-2 rounded" />
      )}
      <p className="text-sm text-muted-foreground mb-2">
        {result.snippet || result.channel_name || "YouTube result"}
      </p>
      <div className="text-xs text-muted-foreground clear-both">
        Source: YouTube - Channel: {result.channel_name || "N/A"}
      </div>
    </div>
  );
}; 