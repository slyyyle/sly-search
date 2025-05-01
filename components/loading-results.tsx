"use client"

import React from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingResults() {
  return (
    <div className="space-y-6">
      {/* Loading state for potential infobox */}
      <div className="mb-6 border rounded-lg p-4 overflow-hidden">
        <div className="flex items-start">
          <div className="flex-1">
            <Skeleton className="h-6 w-64 mb-2" />
            <Skeleton className="h-4 w-full max-w-md mb-1" />
            <Skeleton className="h-4 w-full max-w-sm mb-4" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-11/12" />
              <Skeleton className="h-4 w-10/12" />
            </div>
          </div>
          <div className="ml-4 hidden sm:block">
            <Skeleton className="h-24 w-24 rounded-md" />
          </div>
        </div>
      </div>

      {/* Loading state for search results */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2 border-b border-border/40 pb-4">
          <div className="flex items-center space-x-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-3 w-16 rounded-full" />
          </div>
          <Skeleton className="h-6 w-[400px]" />
          <Skeleton className="h-4 w-[300px]" />
          <Skeleton className="h-4 w-[500px]" />
          <div className="flex items-center space-x-4 mt-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
      ))}
    </div>
  )
} 