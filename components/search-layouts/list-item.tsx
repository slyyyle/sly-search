"use client"

import type React from "react"
import { ExternalLink, Calendar, Star, Tag, Info } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ListItemProps {
  result: any
  openInNewTab?: boolean
}

const ListItem: React.FC<ListItemProps> = ({ result, openInNewTab = true }) => {
  // Format date if available
  const formattedDate = result.publishedDate ? new Date(result.publishedDate).toLocaleDateString() : null

  // Get source engines
  const engines = Array.isArray(result.engines) ? result.engines.join(", ") : result.engine || result.source || null

  return (
    <div className="space-y-1.5">
      <a
        href={result.link}
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
      <p className="text-xs text-muted-foreground truncate">{result.pretty_url || result.link}</p>
      <p className="text-sm">{result.snippet || result.content}</p>

      {/* Additional metadata row */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
        {engines && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center hover:text-gray-300">
                <Info className="h-3 w-3 mr-1" />
                <span>{typeof engines === "string" ? engines : engines[0]}</span>
                {Array.isArray(engines) && engines.length > 1 && <span> +{engines.length - 1}</span>}
              </TooltipTrigger>
              <TooltipContent>
                <p>Source: {Array.isArray(engines) ? engines.join(", ") : engines}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {result.score && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger className="flex items-center hover:text-gray-300">
                <Star className="h-3 w-3 mr-1" />
                <span>{typeof result.score === "number" ? result.score.toFixed(2) : result.score}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>Relevance score: {result.score}</p>
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

        {formattedDate && (
          <span className="flex items-center">
            <Calendar className="h-3 w-3 mr-1" />
            <span>{formattedDate}</span>
          </span>
        )}

        {result.content_type && (
          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-800 border border-gray-700">
            {result.content_type.split("/")[1] || result.content_type}
          </span>
        )}
      </div>
    </div>
  )
}

export default ListItem
