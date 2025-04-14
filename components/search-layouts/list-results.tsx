"use client"

import type React from "react"
import ListItem from "./list-item"

interface ListResultsProps {
  results: any[]
  isLoading?: boolean
  openInNewTab?: boolean
}

const ListResults: React.FC<ListResultsProps> = ({ results, isLoading, openInNewTab = true }) => {
  if (!results || results.length === 0) {
    return <p>No results found.</p>
  }

  return (
    <div className="space-y-6">
      {results.map((result: any) => (
        <ListItem key={result.link} result={result} openInNewTab={openInNewTab} />
      ))}
    </div>
  )
}

export default ListResults
