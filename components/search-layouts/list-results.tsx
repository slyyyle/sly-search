"use client"

import type React from "react"
import ListItem from "./list-item"
import { SearchResultItem } from "@/types/search"

interface ListResultsProps {
  results: SearchResultItem[]
  isLoading?: boolean
  openInNewTab?: boolean
}

const ListResults: React.FC<ListResultsProps> = ({ results, isLoading, openInNewTab = true }) => {
  if (!results || results.length === 0) {
    return <p>No results found.</p>
  }

  const generateResultKey = (result: SearchResultItem): string => {
    if ('path' in result && result.path) {
      return `${result.title}-${result.path}`;
    } else if ('link' in result && result.link) {
      return `${result.title}-${result.link}`;
    } else if ('url' in result && result.url) {
        return `${result.title}-${result.url}`;
    }
    return `${result.title}-${JSON.stringify(result)}`;
  };

  return (
    <div className="space-y-6">
      {results.map((result) => (
        <ListItem key={generateResultKey(result)} result={result} openInNewTab={openInNewTab} />
      ))}
    </div>
  )
}

export default ListResults
