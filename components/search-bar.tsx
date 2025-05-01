"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchBarProps {
  initialQuery?: string;
  placeholder?: string;
  // Callback function when search is submitted
  onSearch: (query: string) => void; 
}

export function SearchBar({ 
  initialQuery = "", 
  placeholder = "Search the web...",
  onSearch 
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault(); // Prevent potential double submission if inside a form
      onSearch(query.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
        <Search className="h-5 w-5 text-muted-foreground" />
      </div>
      <Input
        type="text"
        placeholder={placeholder}
        value={query}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="pl-10 py-6 text-lg bg-background/60 google-gradient-border" // Kept styling
      />
      {/* Hint can be added conditionally or via prop if needed */}
      {/* <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm search-hint">
        Press Enter to Search
      </div> */}
    </form>
  );
} 