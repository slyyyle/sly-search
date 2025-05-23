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
  tags?: string[]; // Optional tags associated with the result
  img_src?: string; // Optional: image URL for image engines
}

// Interface for Obsidian results
export interface ObsidianResult extends BaseResult {
  result_type: 'obsidian';
  url: string; // Relative path within the vault
  path: string; // Usually same as url for Obsidian, keep both for consistency?
  modified_time?: string; // Optional modified time from backend
}

// <<< Define YouTube Result Item Type >>>
export interface YouTubeResultItem extends BaseResult {
  result_type?: 'youtube'; // Explicitly youtube
  url: string; // Original YT URL
  vid?: string; // <<< ADDED: YouTube Video ID
  thumbnail_url?: string | null; // URL generated by backend
  channel_name?: string | null;
  file_path?: string | null; // Filename from JSON
  // Ensure source is specifically 'youtube' if relying on it
  source: 'youtube';
}

// Interface for Photo results
export interface PhotoResultItem {
  id?: string; // Add optional ID if available
  filename: string;
  relative_path: string;
  thumbnail_url?: string | null; 
  modified_time?: number | null; 
  result_type: 'photo'; 
  source: 'photos';
}

// +++ Interface for FreshRSS results +++
export interface FreshRSSResult extends BaseResult {
  result_type: 'freshrss';
  source: 'freshrss';
  url: string; 
  published_time?: number; 
  author?: string; 
  feed_title?: string; 
  categories?: string[];
}

// +++ Interface for Music results +++
export interface MusicResultItem {
  id?: string; // Use if backend provides a unique ID
  source: 'music';
  result_type: 'music';
  title: string; // Song name
  artist?: string;
  album?: string; // Add album if available/needed
  duration?: number; // Duration in seconds (example)
  filepath: string; // Path to the file
  // Add other relevant fields like genre, track number, thumbnail_url etc. if available
}

// Union type for any search result item
export type SearchResultItem = 
  | WebResult 
  | ObsidianResult 
  | YouTubeResultItem 
  | PhotoResultItem 
  | FreshRSSResult
  | MusicResultItem; // Added MusicResultItem
  // | AIResultItem; // Add other types here

// Interface for the backend response specifically for photos source
export interface PhotosSearchResponse {
  results: PhotoResultItem[];
  query: string;
  total_results: number;
  source: 'photos';
}

// +++ Interface for the backend response specifically for FreshRSS source +++
export interface FreshRSSSearchResponse {
  results: FreshRSSResult[];
  query: string;
  total_results: number; // Total matching articles found
  source: 'freshrss';
  // Add other fields if needed, like errors
  errors?: string[];
}

// --- Infobox Types (Based on SearXNG structure) ---
export interface InfoboxUrl {
  title?: string; // Title might be optional
  url: string;
}

export interface InfoboxAttribute {
  label?: string; // Label might be optional
  value: string;
  image?: { src: string; alt: string }[]; // Optional: images array per SearXNG docs
}

export interface Infobox {
  id?: string; // Optional identifier (e.g., wikidata ID)
  engine?: string;
  engines?: string[];
  infobox?: string; // Often used as the primary title/name field by SearXNG
  name?: string; // Use if available, fallback to infobox field
  entity?: string; // e.g., "Person", "Organization"
  content?: string;
  img_src?: string;
  urls?: InfoboxUrl[];
  attributes?: InfoboxAttribute[];
  // Add other fields like relatedTopics if needed
}
// --- End Infobox Types ---

// Interface for the structured state managed in the search page
export interface SearchResultsState {
  searchResults: SearchResultItem[];
  source: 'obsidian' | 'web' | 'youtube' | 'photos' | 'freshrss' | string; // ADDED freshrss
  query?: string;
  pagination?: any; // Keep existing pagination structure for web
  nonCriticalErrors?: string[]; // For Obsidian specific file errors
  _mock?: boolean; // Keep mock data flag
  // Add other top-level fields from SearXNG if needed
  answers?: any[];
  corrections?: any[];
  infoboxes?: Infobox[]; // <<< Use the defined Infobox type
  suggestions?: any[];
  number_of_results?: number;
  total_results?: number; // Keep this for potential use
  currentPage?: number; // Keep this for UI state
}

// Interface for the overall search response from the backend
export interface SearchResponse {
  results: SearchResultItem[];
  infobox?: any | null; // Or specific Infobox type
  suggestions?: string[];
  error?: string | null;
  query_time?: number;
} 