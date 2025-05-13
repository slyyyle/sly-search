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
  useLocalPlugin: z.boolean().optional().default(false),
  path: z.string().optional(),
  vaultName: z.string().nullable().optional(),
  apiPort: z.number().int().nullable().optional().default(7777),
  pluginApiKey: z.string().nullable().optional(),
  resultsPerPage: z.number().int().min(1).max(100).optional().default(10),
  openNewTab: z.boolean().optional().default(true),
});

export const localFilesSourceConfigSchema = z.object({
  path: z.string().nullable().optional(),
  fileTypes: z.string().optional().default("md,txt,pdf"),
  useIndexer: z.boolean().optional().default(false),
  resultsPerPage: z.number().int().min(1).max(100).optional().default(10),
  openNewTab: z.boolean().optional().default(true),
});

export const aiSourceConfigSchema = z.object({
  provider: z.string().optional().default('openai'),
  model: z.string().optional().default('gpt-4o'),
  temperature: z.number().min(0).max(1).optional().default(0.7),
  maxTokens: z.number().int().min(1).optional().default(1000),
  apiKey: z.string().nullable().optional(),
  baseUrl: z.string().url("Must be a valid URL").nullable().optional(),
  resultsPerPage: z.number().int().min(1).max(10).optional().default(1),
  openNewTab: z.boolean().optional().default(true),
});

// Define the YouTube config schema - removing maxResults
export const youTubeSourceConfigSchema = z.object({
  path: z.string().optional(),
  download_base_path: z.string().optional(),
  includeChannels: z.boolean().optional().default(true),
  includePlaylists: z.boolean().optional().default(true),
  apiKey: z.string().nullable().optional(),
  resultsPerPage: z.number().int().min(1).max(50).optional().default(10),
  resultsColumns: z.number().int().min(1).max(12).optional().default(4),
  openNewTab: z.boolean().optional().default(true),
});

export const musicSourceConfigSchema = z.object({
  path: z.string().nullable().optional(),
  resultsPerPage: z.number().int().min(1).max(50).optional().default(10),
  openNewTab: z.boolean().optional().default(true),
});

export const photosSourceConfigSchema = z.object({
  path: z.string().optional(),
  resultsPerPage: z.number().int().min(1).max(50).optional().default(10),
  resultsColumns: z.number().int().min(1).max(12).optional().default(4),
  openNewTab: z.boolean().optional().default(true),
});

// +++ Config Schema for FreshRSS Source +++ Corrected
export const freshrssSourceConfigSchema = z.object({
  // Allow string, null, or undefined for base_url
  base_url: z.string().url("Must be a valid URL").nullish(), 
  // Allow string, null, or undefined for username
  username: z.string().nullish(), 
  // Allow string, null, or undefined for api_password
  api_password: z.string().nullish(), 
  resultsPerPage: z.number().int().min(1).max(100).optional().default(10),
  openNewTab: z.boolean().optional().default(true),
});
export type FreshRSSSourceConfig = z.infer<typeof freshrssSourceConfigSchema>;

export const sourceListItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  color: z.string().optional(),
  gradient: z.string().optional(),
  type: z.string().nullable().optional(), // Explicit type for custom sources, falls back to id if missing
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
    resultsPerPage: z.union([z.string(), z.number()]).optional(),
    safeSearch: z.union([z.string(), z.number()]).optional(),
    defaultLanguage: z.string().optional(),
    ragEnabled: z.boolean().optional(),
    autocomplete: z.boolean().optional(),
    autocompleteMin: z.union([z.string(), z.number()]).optional(),
    faviconResolver: z.string().optional(),
    banTime: z.union([z.string(), z.number()]).optional(),
    maxBanTime: z.union([z.string(), z.number()]).optional(),
    instanceUrl: z.string().url().optional(),
    requestTimeout: z.union([z.string(), z.number()]).optional(),
    maxRequestTimeout: z.union([z.string(), z.number()]).optional(),
    debugMode: z.boolean().optional(),
    showGrid: z.boolean().optional(),
    showSuggestions: z.boolean().optional(),
    searchDebounce: z.number().optional(),
    searchLanguage: z.string().optional(),
    maxResults: z.number().int().optional(),
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
    font: z.string().optional(),
    centerAlignment: z.boolean().optional(),
    defaultLocale: z.string().optional(),
    hotkeys: z.string().optional(),
    urlFormat: z.string().optional(),
    infiniteScroll: z.boolean().optional(),
    fontFamily: z.string().optional(),
    layout: z.string().optional(),
    showResultIcons: z.boolean().optional(),
    openLinksInNewTab: z.boolean().optional(),
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
    sources: z.array(sourceListItemSchema).optional().default([]),
    loadouts: z.array(loadoutSchema(z.array(sourceListItemSchema))).optional(),
    obsidian: obsidianSourceConfigSchema.optional(),
    localFiles: localFilesSourceConfigSchema.optional(),
    ai: aiSourceConfigSchema.optional(),
    youtube: youTubeSourceConfigSchema.optional(),
    music: musicSourceConfigSchema.optional(),
    photos: photosSourceConfigSchema.optional(),
    freshrss: freshrssSourceConfigSchema.optional(),
  }).optional(),
  waveRacer: z.object({
    // We'll add specific settings here later
  }).optional(),
});

// Infer the AppSettings type from the Zod schema
export type AppSettings = z.infer<typeof appSettingsSchema>;

// Define specific loadout types using the generic schema and inferred config types
export const engineLoadoutSchema = z.object({
  id: z.string(),
  name: z.string(),
  config: z.array(engineSchema),
  isLocked: z.boolean().optional(), // Add optional isLocked flag
});
export type EngineLoadout = z.infer<typeof engineLoadoutSchema>;

export type SourceLoadout = z.infer<ReturnType<typeof loadoutSchema<typeof sourceListItemSchema>>>;

// Export individual config types if needed elsewhere
export type ObsidianSourceConfig = z.infer<typeof obsidianSourceConfigSchema>;
export type LocalFilesSourceConfig = z.infer<typeof localFilesSourceConfigSchema>;
export type AISourceConfig = z.infer<typeof aiSourceConfigSchema>;
export type YouTubeSourceConfig = z.infer<typeof youTubeSourceConfigSchema>;
export type MusicSourceConfig = z.infer<typeof musicSourceConfigSchema>;
export type PhotosSourceConfig = z.infer<typeof photosSourceConfigSchema>;
export type SourceListItem = z.infer<typeof sourceListItemSchema>;
export type Engine = z.infer<typeof engineSchema>;