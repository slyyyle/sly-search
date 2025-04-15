"use client"

import type React from "react"
import { ExternalLink, Calendar, Star, Tag, Info, FileText, Brain } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SearchResultItem, WebResult, ObsidianResult } from "@/types/search"
import { cn } from "@/lib/utils"

interface ListItemProps {
  result: SearchResultItem
  openInNewTab?: boolean
}

function isObsidianResult(result: SearchResultItem): result is ObsidianResult {
  return result.result_type === 'obsidian' || ('path' in result && !('link' in result));
}

const formatDate = (dateString: string | undefined): string | null => {
  if (!dateString) return null;
  try {
    return new Date(dateString).toLocaleDateString();
  } catch (e) {
    console.warn("Failed to parse date:", dateString);
    return null;
  }
};

const ListItem: React.FC<ListItemProps> = ({ result, openInNewTab = true }) => {
  const isObsidian = isObsidianResult(result);

  const displayDate = isObsidian
    ? formatDate(result.modified_time)
    : formatDate((result as WebResult).publishedDate);

  const sourceName = result.engines ? (Array.isArray(result.engines) ? result.engines.join(", ") : result.engines)
                   : result.source || (isObsidian ? "Obsidian" : "Unknown");

  const description = result.snippet || result.content || "";

  // Prepare score value beforehand if it exists
  const scoreValue: number | string | null | undefined = result.score;

  return (
    <div className="space-y-1.5">
      {isObsidian ? (
        <div className="flex items-center">
          <Brain className="h-4 w-4 mr-1.5 text-purple-400 flex-shrink-0" />
          <h3 className="text-lg font-semibold text-purple-300">
            {result.title}
          </h3>
        </div>
      ) : (
        <a
          href={(result as WebResult).link || (result as WebResult).url}
          target={openInNewTab ? "_blank" : "_self"}
          rel={openInNewTab ? "noopener noreferrer" : ""}
          className="block group"
        >
          <h3 className="text-lg font-semibold group-hover:underline text-blue-400 flex items-center">
            {result.title}
            {openInNewTab && (
              <ExternalLink className="h-3.5 w-3.5 ml-1.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </h3>
        </a>
      )}

      {isObsidian ? (
        <p className="text-xs text-muted-foreground truncate flex items-center">
           <FileText className="h-3 w-3 mr-1 flex-shrink-0" />
           <span>{result.path}</span>
        </p>
      ) : (
        <p className="text-xs text-muted-foreground truncate">{(result as WebResult).pretty_url || (result as WebResult).link}</p>
      )}

      <p className="text-sm">{description}</p>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
        {sourceName && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center hover:text-gray-300 cursor-default">
                <Info className="h-3 w-3 mr-1" />
                <span>{sourceName}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Source: {sourceName}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {scoreValue != null && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center hover:text-gray-300 cursor-default">
                <Star className="h-3 w-3 mr-1" />
                <span>{typeof scoreValue === "number" ? scoreValue.toFixed(2) : scoreValue}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Relevance score: {scoreValue}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {result.category && (
          <span className="flex items-center">
            <Tag className="h-3 w-3 mr-1" />
            <span>{result.category}</span>
          </span>
        )}

        {displayDate && (
          <span className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{displayDate}</span>
          </span>
        )}

        {!isObsidian && (result as WebResult).content_type && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">
            {(result as WebResult).content_type.split("/")[1] || (result as WebResult).content_type}
          </span>
        )}
      </div>
    </div>
  )
}

export default ListItem
