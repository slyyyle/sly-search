"use client"

import type React from "react"

interface CompactResultsProps {
  results: any[]
  isLoading?: boolean
}

const CompactResults: React.FC<CompactResultsProps> = ({ results, isLoading }) => {
  // This is a placeholder component that will be implemented later
  return (
    <div className="text-yellow-500">
      Compact layout not yet implemented. This component will display results in a compact format.
    </div>
  )
}

export default CompactResults
