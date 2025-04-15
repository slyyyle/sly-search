// Base interface for common properties
export interface BaseResult {
  title: string;
  snippet?: string;
  content?: string;
  score?: number | string;
  engines?: string[] | string; // From backend, might be 'engine' or 'source' or 'engines'
  source?: string; // Sometimes source is used instead of engines
  category?: string;
}

// Interface for standard Web results
export interface WebResult extends BaseResult {
  result_type?: 'web'; // Explicitly web or default/undefined
  link: string;
  url: string; // Often 'link' and 'url' are used, keep both for flexibility
  pretty_url?: string;
  publishedDate?: string; // ISO 8601 or other date format
  content_type?: string; // MIME type
  favicon?: string;
}

// Interface for Obsidian results
export interface ObsidianResult extends BaseResult {
  result_type: 'obsidian'; // Explicitly obsidian
  path: string; // Relative path within vault
  modified_time?: string; // ISO 8601
  // Note: Obsidian results likely won't have 'link', 'url', 'pretty_url', 'publishedDate', 'favicon'
}

// Union type for any search result item
export type SearchResultItem = WebResult | ObsidianResult; 