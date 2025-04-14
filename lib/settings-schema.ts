import { z } from "zod";

// Define schemas for nested structures first

export const engineSchema = z.object({
  id: z.number(),
  name: z.string(),
  enabled: z.boolean(),
  weight: z.number(),
  shortcut: z.string().optional(),
  categories: z.array(z.string()).optional(),
  timeout: z.union([z.string(), z.number()]).nullish(), // Allows null
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
}).optional();

export const localFilesSourceConfigSchema = z.object({
  path: z.string().nullish(),
  fileTypes: z.string().optional(),
  useIndexer: z.boolean().optional(),
}).optional();

export const aiSourceConfigSchema = z.object({
  provider: z.string().optional(),
  apiKey: z.string().nullish(),
  baseUrl: z.string().nullish(),
  model: z.string().optional(),
  temperature: z.union([z.string(), z.number()]).optional(), // Using number for temp is better
  maxTokens: z.union([z.string(), z.number()]).optional(),
}).optional();

export const youTubeSourceConfigSchema = z.object({
  apiKey: z.string().nullish(),
  maxResults: z.union([z.string(), z.number()]).optional(),
  includeChannels: z.boolean().optional(),
  includePlaylists: z.boolean().optional(),
}).optional();

export const soundCloudSourceConfigSchema = z.object({
  clientId: z.string().nullish(),
  maxResults: z.union([z.string(), z.number()]).optional(),
  includeUsers: z.boolean().optional(),
  includePlaylists: z.boolean().optional(),
}).optional();

export const sourceListItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  icon: z.string(),
  color: z.string(),
  gradient: z.string(),
});

// Main AppSettings Schema using the nested schemas
export const appSettingsSchema = z.object({
  general: z.object({
    instanceName: z.string().optional(),
    resultsPerPage: z.union([z.string(), z.number()]).optional(),
    safeSearch: z.union([z.string(), z.number()]).optional(),
    defaultLanguage: z.string().optional(),
    openNewTab: z.boolean().optional(),
    infiniteScroll: z.boolean().optional(),
    ragEnabled: z.boolean().optional(),
    autocomplete: z.boolean().optional(),
    autocompleteMin: z.union([z.string(), z.number()]).optional(),
    faviconResolver: z.string().optional(),
    banTime: z.union([z.string(), z.number()]).optional(),
    maxBanTime: z.union([z.string(), z.number()]).optional(),
    searchOnCategory: z.boolean().optional(),
  }).optional(),
  engines: z.object({
    engine_list: z.array(engineSchema).optional(),
    loadouts: z.array(loadoutSchema(z.array(engineSchema))).optional(),
  }).optional(),
  privacy: z.object({
    proxyImages: z.boolean().optional(),
    removeTrackers: z.boolean().optional(),
    blockCookies: z.boolean().optional(),
    queryInTitle: z.boolean().optional(),
    method: z.string().optional(),
    urlAnonymizer: z.boolean().optional(),
  }).optional(),
  appearance: z.object({
    resultsLayout: z.string().optional(),
    theme: z.string().optional(),
    centerAlignment: z.boolean().optional(),
    defaultLocale: z.string().optional(),
    hotkeys: z.string().optional(),
    urlFormat: z.string().optional(),
  }).optional(),
  advanced: z.object({
      instanceUrl: z.string().url().optional(),
      requestTimeout: z.union([z.string(), z.number()]).optional(),
      maxRequestTimeout: z.union([z.string(), z.number()]).optional(),
      formats: z.array(z.string()).optional(),
      headlessMode: z.boolean().optional(),
      enableResultProxy: z.boolean().optional(),
      resultProxyUrl: z.string().optional(),
      resultProxyKey: z.string().optional(),
      poolConnections: z.union([z.string(), z.number()]).optional(),
      poolMaxsize: z.union([z.string(), z.number()]).optional(),
      enableHttp2: z.boolean().optional(),
      customCss: z.string().optional(),
      debugMode: z.boolean().optional(),
      redisUrl: z.string().nullish(), // Allows null
      limiter: z.boolean().optional(),
      publicInstance: z.boolean().optional(),
  }).optional(),
  personalSources: z.object({
    sources: z.array(sourceListItemSchema).optional(),
    loadouts: z.array(loadoutSchema(z.array(sourceListItemSchema))).optional(),
    obsidian: obsidianSourceConfigSchema,
    localFiles: localFilesSourceConfigSchema,
    ai: aiSourceConfigSchema,
    youtube: youTubeSourceConfigSchema,
    soundcloud: soundCloudSourceConfigSchema,
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
export type SoundCloudSourceConfig = z.infer<typeof soundCloudSourceConfigSchema>;
export type SourceListItem = z.infer<typeof sourceListItemSchema>;
export type Engine = z.infer<typeof engineSchema>; 