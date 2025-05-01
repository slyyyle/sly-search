"use client"

import type React from "react"
import ListItem from "./list-item"
import { SearchResultItem, WebResult, ObsidianResult } from '@/types/search'

interface ListResultsProps {
  results: SearchResultItem[]
  openInNewTab?: boolean
}

const generateResultKey = (result: SearchResultItem, index: number): string => {
  let baseKey: string;
  if ('id' in result && result.id) baseKey = String(result.id);
  else if ('path' in result && result.path) baseKey = result.path;
  else if ('url' in result && result.url) baseKey = result.url;
  else if ('title' in result && result.title) baseKey = result.title;
  else if ('filename' in result && result.filename) baseKey = result.filename;
  else baseKey = 'unknown-key';
  
  return `result-${index}-${baseKey}`;
};

const ListResults: React.FC<ListResultsProps> = ({ results, openInNewTab = true }) => {
  if (!results || results.length === 0) {
    return <p>No results found.</p>
  }

  return (
    <div className="divide-y divide-gray-700">
      {results.map((result, index) => (
        <div 
           key={generateResultKey(result, index)} 
           className={`${index === 0 ? 'pt-0' : 'pt-4'} ${index === results.length - 1 ? 'pb-0' : 'pb-4'}`}
        >
          <ListItem 
            result={result} 
            openInNewTab={openInNewTab}
          />
        </div>
      ))}
    </div>
  )
}

export default ListResults
