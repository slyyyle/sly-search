"use client"

import React from "react"
import type { WebResult } from "@/types/search"
import WebCardItem from "./web-card-item"
import { cn } from "@/lib/utils"

interface WebGridResultsProps {
  results: WebResult[];
  openInNewTab?: boolean;
  resultsColumns?: number;
}

const WebGridResults: React.FC<WebGridResultsProps> = ({
  results,
  openInNewTab = true,
  resultsColumns = 4,
}) => {
  if (!results || results.length === 0) {
    return <div>No web results found.</div>; // Or some other placeholder
  }

  const gridColsClass = `grid-cols-${Math.max(1, Math.min(10, resultsColumns))}`;

  return (
    <div className={cn("grid gap-4", gridColsClass)}>
      {results.map((result, index) => (
        <WebCardItem key={result.url || index} result={result} openInNewTab={openInNewTab} />
      ))}
    </div>
  );
}

export default WebGridResults; 