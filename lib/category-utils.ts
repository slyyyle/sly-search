import { categoryOrder } from "./constants";

/**
 * Maps a SINGLE raw category string (e.g., "wikipedia", "general", "images") 
 * to its corresponding display group ID (e.g., "knowledge", "web", "images").
 * This logic determines which category group an engine belongs to for filtering.
 */
export const mapRawCategoryToGroupId = (rawCategory: string | undefined): string => {
  const lowerCategory = rawCategory?.toLowerCase().trim() || "unknown"; // Ensure lowercase and trim whitespace

  // Check if the lowercased category exists as an ID in our canonical categoryOrder
  const knownCategory = categoryOrder.find(cat => cat.id === lowerCategory);

  if (knownCategory) {
    return lowerCategory; // Return the matching raw category string (as ID)
  } else {
    // Optional: Handle potential sub-category mappings if needed (like the knowledge/utility examples)
    // If you want 'wikipedia' to map to 'knowledge', that logic would go here.
    // For now, we'll keep it simple: if not a direct match in categoryOrder, it's 'unknown'.
    
    // Example of keeping knowledge mapping (adjust if needed):
    if (["wikipedia", "definitions", "encyclo", "wikidata", "directory", "encyclosearch", "wikimini", "wikibooks", "wikiquote", "wikisource", "wikiversity", "wikivoyage", "alexandria", "curlie", "ddg definitions", "mwmbl", "right dao", "bpb"].some(sub => lowerCategory.includes(sub))) {
         return "knowledge"; // Keep mapping subcategories to 'knowledge'
    }
    if (["currency", "cloudflareai", "crowdview"].some(sub => lowerCategory.includes(sub))) {
        return "utility"; // Keep mapping subcategories to 'utility'
    }

    // If none of the above, it's unknown
    return "unknown"; 
  }
};

/*
// --- OLD MAPPING LOGIC ---
export const mapRawCategoryToGroupId_OLD = (rawCategory: string | undefined): string => {
  const primaryCategory = rawCategory?.toLowerCase() || "unknown"; // Use unknown instead of other
  let targetGroupId = "unknown"; // Default if no specific mapping found

  // --- Define Mappings (Keep consistent with settings page) --- 
  if (primaryCategory === "general") targetGroupId = "general";
  else if (primaryCategory === "web") targetGroupId = "web";
  else if (primaryCategory === "images") targetGroupId = "images";
  else if (primaryCategory === "videos") targetGroupId = "videos";
  else if (primaryCategory === "news") targetGroupId = "news";
  else if (primaryCategory === "maps") targetGroupId = "maps";
  else if (primaryCategory === "science") targetGroupId = "science";
  else if (primaryCategory === "files") targetGroupId = "files";
  else if (primaryCategory === "music") targetGroupId = "music";
  else if (primaryCategory === "social media") targetGroupId = "social_media"; // Corrected mapping
  else if (primaryCategory === "it") targetGroupId = "it";
  else if (primaryCategory === "translate") targetGroupId = "translate";
  // Knowledge mapping
  else if (["wikipedia", "definitions", "encyclo", "wikidata", "directory", "encyclosearch", "wikimini", "wikibooks", "wikiquote", "wikisource", "wikiversity", "wikivoyage", "alexandria", "curlie", "ddg definitions", "mwmbl", "right dao", "bpb"].some(sub => primaryCategory.includes(sub))) targetGroupId = "knowledge";
  // Utility mapping
  else if (["currency", "cloudflareai", "crowdview"].some(sub => primaryCategory.includes(sub))) targetGroupId = "utility";
  // Add more mappings if necessary

  // Check if the mapped group ID actually exists in our defined categoryOrder
  // If not, it remains "unknown" (or whatever default we set)
  if (!categoryOrder.some(cat => cat.id === targetGroupId)) {
    // We could log a warning here if needed: console.warn(`Category '${rawCategory}' mapped to non-displayable group '${targetGroupId}'`);
    targetGroupId = "unknown"; 
  }
  
  return targetGroupId;
}; 
*/ 