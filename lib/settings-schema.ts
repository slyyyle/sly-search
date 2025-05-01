import { z } from "zod";

// Define schemas for nested structures first

export const engineSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  weight: z.number(),
  shortcut: z.string().optional(),
  categories: z.array(z.string()).optional(),
  timeout: z.union([z.string(), z.number()]).nullish(), // Allows null
  description: z.string().optional(),
});

// Generic loadout schema factory function
export const loadoutSchema = <T extends z.ZodTypeAny>(configSchema: T) =>
  z.object({
    id: z.string(),
    name: z.string(),
    config: configSchema,
  });

export const obsidianSourceConfigSchema = z.object({
  path: z.string().nullish(),
  vaultName: z.string().nullish(),
  useLocalPlugin: z.boolean().optional(),
  apiPort: z.union([z.string(), z.number()]).nullish(), // Allows null
  pluginApiKey: z.string().nullish(),
  resultsPerPage: z.number().int().min(1).max(100).optional(),
  defaultObsidianView: z.enum(['list', 'card']).optional(), // Add setting for default view
  resultsColumns: z.number().int().min(1).max(10).optional(), // Add setting for columns
  excludedFolders: z.array(z.string()).optional(),
  openNewTab: z.boolean().optional().default(true),
}).optional();

export const localFilesSourceConfigSchema = z.object({
  path: z.string().nullish(),
  fileTypes: z.string().optional(),
  useIndexer: z.boolean().optional(),
  resultsPerPage: z.number().int().min(1).max(100).optional(),
  openNewTab: z.boolean().optional().default(true),
}).optional();

export const aiSourceConfigSchema = z.object({
  provider: z.string().optional(),
  apiKey: z.string().nullish(),
  baseUrl: z.string().nullish(),
  model: z.string().optional(),
  temperature: z.union([z.string().regex(/^\d*\.?\d+$/).transform(Number), z.number().min(0).max(2)]).optional(),
  maxTokens: z.union([z.string().regex(/^\d+$/).transform(Number), z.number().int()]).optional(),
  resultsPerPage: z.number().int().min(1).max(100).optional(),
  openNewTab: z.boolean().optional().default(true),
}).optional();

// Define the YouTube config schema - removing maxResults
export const youTubeSourceConfigSchema = z.object({
  // Path to the Tartube JSON Export File
  path: z.string().nullish(),
  // Path to the Tartube downloads directory
  download_base_path: z.string().nullish(),
  includeChannels: z.boolean().optional(),
  includePlaylists: z.boolean().optional(),
  resultsPerPage: z.number().int().min(1).max(100).optional(),
  resultsColumns: z.number().int().min(1).max(10).optional(),
  defaultYouTubeView: z.enum(['list', 'card']).optional(),
  openNewTab: z.boolean().optional().default(true),
  // Base URL for Invidious instance
  invidiousInstance: z.string().optional().default("yewtu.be"),
}).optional();

export const musicSourceConfigSchema = z.object({
  path: z.string().nullish(), // Path to music library export/database
  resultsPerPage: z.number().int().min(1).max(100).optional(),
  openNewTab: z.boolean().optional().default(true),
}).optional();

export const photosSourceConfigSchema = z.object({
  path: z.string().nullish(), // Path to photo library/directory
  resultsPerPage: z.number().int().min(1).max(100).optional(),
  resultsColumns: z.number().int().min(1).max(10).optional(),
  defaultPhotosView: z.enum(['list', 'card']).optional(), // Add setting for default view
  openNewTab: z.boolean().optional().default(true),
}).optional();

// +++ Add Web Source Config Schema +++
export const webSourceConfigSchema = z.object({
  // Enabled state might not be needed for web, but keep for consistency?
  // enabled: z.boolean().optional(), 
  resultsPerPage: z.number().int().min(1).max(100).optional(),
  defaultWebView: z.enum(['list', 'card']).optional(), // Add setting for default view
  resultsColumns: z.number().int().min(1).max(10).optional(), // Add setting for columns
  searchOnCategory: z.boolean().optional(),
  openNewTab: z.boolean().optional().default(true),
  // SafeSearch and Language are currently under general, keep them there?
}).optional();

export const sourceListItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  color: z.string(),
  gradient: z.string(),
});

// Schema for a single engine in the list
export const engineSettingsItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  weight: z.number().min(0).max(1).default(1.0),
  shortcut: z.string().optional(),
  categories: z.array(z.string()).optional(), // Categories it belongs to
  timeout: z.union([z.string(), z.number()]).nullable().optional(), // Timeout specific to this engine
});

// Export the inferred type for a single engine
export type EngineSettingsItem = z.infer<typeof engineSettingsItemSchema>;

// Main AppSettings Schema using the nested schemas
export const appSettingsSchema = z.object({
  general: z.object({
    instanceName: z.string().optional(),
    // INFERRED AND DEVELOPING: Using union types allows flexibility in how values are stored and processed
    // String form is used for API/storage compatibility while number form enables UI calculations
    resultsPerPage: z.union([z.string(), z.number()]).optional(),
    safeSearch: z.union([z.string(), z.number()]).optional(),
    defaultLanguage: z.string().optional(),
    ragEnabled: z.boolean().optional(),
    autocomplete: z.boolean().optional(),
    autocompleteMin: z.union([z.string(), z.number()]).optional(),
    faviconResolver: z.string().optional(),
    banTime: z.union([z.string(), z.number()]).optional(),
    maxBanTime: z.union([z.string(), z.number()]).optional(),
    // Moved from advanced - comment retained to document the restructuring history
    // This aids future developers in understanding the evolution of the settings model
    instanceUrl: z.string().url().optional(),
    requestTimeout: z.union([z.string(), z.number()]).optional(),
    maxRequestTimeout: z.union([z.string(), z.number()]).optional(),
    debugMode: z.boolean().optional(),
  }).optional(),
  engines: z.object({
    loadouts: z.array(loadoutSchema(z.array(engineSettingsItemSchema))).optional().default([]),
    activeLoadoutId: z.string().nullable().optional().default(null), // Default to null initially
  }).optional(),
  privacy: z.object({
    proxyImages: z.boolean().optional(),
    removeTrackers: z.boolean().optional(),
    blockCookies: z.boolean().optional(),
    queryInTitle: z.boolean().optional(),
    method: z.string().optional(),
    urlAnonymizer: z.boolean().optional(),
    // Moved from advanced
    enableResultProxy: z.boolean().optional(),
    resultProxyUrl: z.string().optional(),
    resultProxyKey: z.string().optional(),
  }).optional(),
  appearance: z.object({
    resultsLayout: z.string().optional(),
    theme: z.string().optional(),
    centerAlignment: z.boolean().optional(),
    defaultLocale: z.string().optional(),
    hotkeys: z.string().optional(),
    urlFormat: z.string().optional(),
    infiniteScroll: z.boolean().optional(),
    // Quick Links for dashboard
    enableQuickLinks: z.boolean().optional(),
    quickLinks: z.array(z.object({
      id: z.string(),
      label: z.string(),
      url: z.string(),
      thumbnail: z.string().optional(),
      category: z.string().optional(),
      starred: z.boolean().optional(),
    })).optional(),
  }).optional(),
  advanced: z.object({
    formats: z.array(z.string()).optional(),
    headlessMode: z.boolean().optional(),
    poolConnections: z.union([z.string(), z.number()]).optional(),
    poolMaxsize: z.union([z.string(), z.number()]).optional(),
    enableHttp2: z.boolean().optional(),
    redisUrl: z.string().nullish(), // Allows null
    limiter: z.boolean().optional(),
    publicInstance: z.boolean().optional(),
    // Legacy fields for backward compatibility - will be used in migration
    // These are maintained while transitioning to the new structure
    instanceUrl: z.string().url().optional(),
    requestTimeout: z.union([z.string(), z.number()]).optional(),
    maxRequestTimeout: z.union([z.string(), z.number()]).optional(),
    enableResultProxy: z.boolean().optional(),
    resultProxyUrl: z.string().optional(),
    resultProxyKey: z.string().optional(),
    debugMode: z.boolean().optional(),
  }).optional(),
  personalSources: z.object({
    sources: z.array(sourceListItemSchema).optional().default([
      { id: "normal", label: "Web", icon: "Zap", color: "#176BEF", gradient: "from-[#176BEF]/70 to-[#FF3E30]/70" },
      { id: "obsidian", label: "Obsidian", icon: "Brain", color: "#7E6AD7", gradient: "from-[#7E6AD7]/70 to-[#9C87E0]/70" },
      { id: "localFiles", label: "Files", icon: "FileText", color: "#F7B529", gradient: "from-[#FF3E30]/70 to-[#F7B529]/70" },
      { id: "ai", label: "AI", icon: "Bot", color: "#10B981", gradient: "from-[#10B981]/70 to-[#059669]/70" },
      { id: "youtube", label: "YouTube", icon: "Youtube", color: "#FF0000", gradient: "from-[#FF0000]/70 to-[#CC0000]/70" },
      { id: "music", label: "Music", icon: "Music", color: "#FF7700", gradient: "from-[#FF7700]/70 to-[#FF3300]/70" },
      { id: "photos", label: "Photos", icon: "Image", color: "#3498DB", gradient: "from-[#3498DB]/70 to-[#2980B9]/70" },
    ]),
    loadouts: z.array(loadoutSchema(z.array(sourceListItemSchema))).optional(),
    obsidian: obsidianSourceConfigSchema,
    localFiles: localFilesSourceConfigSchema,
    ai: aiSourceConfigSchema,
    youtube: youTubeSourceConfigSchema,
    music: musicSourceConfigSchema,
    photos: photosSourceConfigSchema,
    web: webSourceConfigSchema, // Add web config
  }).optional(),
});

// Infer the AppSettings type from the Zod schema
export type AppSettings = z.infer<typeof appSettingsSchema>;

// Define specific loadout types using the generic schema and inferred config types
export type EngineLoadout = z.infer<ReturnType<typeof loadoutSchema<typeof engineSchema>>>;
export type SourceLoadout = z.infer<ReturnType<typeof loadoutSchema<typeof sourceListItemSchema>>>;

// Export individual config types if needed elsewhere
export type ObsidianSourceConfig = z.infer<typeof obsidianSourceConfigSchema>;
export type LocalFilesSourceConfig = z.infer<typeof localFilesSourceConfigSchema>;
export type AISourceConfig = z.infer<typeof aiSourceConfigSchema>;
export type YouTubeSourceConfig = z.infer<typeof youTubeSourceConfigSchema>;
export type MusicSourceConfig = z.infer<typeof musicSourceConfigSchema>;
export type PhotosSourceConfig = z.infer<typeof photosSourceConfigSchema>;
export type WebSourceConfig = z.infer<typeof webSourceConfigSchema>;
export type SourceListItem = z.infer<typeof sourceListItemSchema>;
export type Engine = z.infer<typeof engineSchema>; 