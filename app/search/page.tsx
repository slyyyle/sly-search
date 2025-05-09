"use client"

import React from "react"

import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft, AlertCircle, List, LayoutGrid, ChevronLeft, ChevronRight } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import Logo from "@/components/logo"
import SearchResults from "@/components/search-results"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import TheLocalLagoon from "@/components/the-local-lagoon"
import { QuickSettingsMenu } from "@/components/quick-settings-menu"
import { InfoDialog } from "@/components/info-dialog"
import { useToast } from "@/components/ui/use-toast"
import { useSettings, type AppSettings } from "@/lib/use-settings"
import type { SearchResultItem, WebResult, ObsidianResult } from "@/types/search"
import { type EngineSettingsItem, appSettingsSchema } from "@/lib/settings-schema"
import { type Engine } from "@/lib/settings-schema"
import { categoryOrder } from "@/lib/constants"
import LoadingResults from "@/components/loading-results"

// --- Define type for valid source config keys --- START ---
// Get keys from the *non-optional* shape of the personalSources object schema
type PersonalSourcesShapeKeys = keyof typeof appSettingsSchema.shape.personalSources._def.innerType.shape;
// Exclude 'sources' and 'loadouts'
type SourceConfigKey = Exclude<PersonalSourcesShapeKeys, 'sources' | 'loadouts'>;
const validSourceKeys: SourceConfigKey[] = ['obsidian', 'localFiles', 'ai', 'youtube', 'music', 'photos'];
// --- Define type for valid source config keys --- END ---

// --- Define type for search tabs --- ADDED DEFINITION ---
interface TabDefinition {
  name: string;
  value: string;
}

// Define a more structured state for results
interface SearchResultsState {
  searchResults: SearchResultItem[];
  source: string; // 'obsidian', 'web', 'youtube', etc.
  query?: string;
  category?: string; // <<< ADDED CATEGORY
  pagination?: any; // Keep existing pagination structure for web
  total_results?: number; // <<< Add total_results for YouTube
  currentPage?: number; // <<< Add currentPage for YouTube
  nonCriticalErrors?: string[]; // For Obsidian specific file errors
  _mock?: boolean; // Keep mock data flag
  // Add other top-level fields from SearXNG if needed (answers, corrections etc.)
  answers?: any[];
  corrections?: any[];
  infoboxes?: any[];
  suggestions?: any[];
  number_of_results?: number;
}

// +++ Define type for SLAI config from sessionStorage +++
interface SlaiConfig {
  query: string;
  engineSets: { category: string; engines: string[] }[];
  initialCategory: string;
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { settings, isInitialLoadComplete, availableEngines, activeEngineLoadoutId } = useSettings()
  const { toast } = useToast()

  // --- State Management ---
  const initialSearchPerformed = useRef(false);

  // Values derived directly from URL for consistency - DO THIS OUTSIDE useEffect/useCallback
  const initialQuery = searchParams.get("q") || "";
  const initialSource = searchParams.get("source") || "web"; // <<< CHANGED default from normal
  const initialPage = parseInt(searchParams.get("pageno") || "1", 10);
  const initialCategory = searchParams.get("category") || ""; // <<< Extract category
  const initialEngines = searchParams.get("engines"); // <<< Extract engines (can be null)

  // +++ Add detailed logging for initial URL parameters +++
  console.log(`[SearchPage Init] Raw searchParams: ${searchParams.toString()}`);
  console.log(`[SearchPage Init] Derived Initial Values: query='${initialQuery}', source='${initialSource}', page=${initialPage}, category='${initialCategory}', engines='${initialEngines ?? 'null'}'`);

  // State for the controlled input field
  const [inputValue, setInputValue] = useState(initialQuery);
  // State synced with URL 'source' param
  const [knowledgeSource, setKnowledgeSource] = useState(initialSource);
  // Loading and results state
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [results, setResults] = useState<SearchResultsState | null>(null);
  // State synced with URL 'category' param
  const [activeTab, setActiveTab] = useState<string>(initialCategory); // <<< Initialize with initialCategory 
  const [usingMockData, setUsingMockData] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // State synced with URL 'pageno' param (used for server-side pagination)
  const [currentPage, setCurrentPage] = useState(initialPage);
  
  // Track the maximum number of results seen across pagination
  const [maxTotalResults, setMaxTotalResults] = useState<number>(0);
  
  // Track if we've reached the end of results
  const [reachedEndOfResults, setReachedEndOfResults] = useState(false);
  // Track the last page of the current search
  const [currentSearchLastPage, setCurrentSearchLastPage] = useState<number | null>(null);
  // Track the highest page number we've seen (for pagination)
  const [highestPageSeen, setHighestPageSeen] = useState<number>(1);

  // +++ State for SLAI Config +++
  const [slaiConfig, setSlaiConfig] = useState<SlaiConfig | null>(null);

  console.log("SearchPage rendering, availableEngines:", availableEngines);
  console.log("Current searchParams:", searchParams.toString());
  console.log(`Initial values derived: Query='${initialQuery}', Source='${initialSource}', Category='${initialCategory}', Engines='${initialEngines}'`);

  // Determine the initial view based on settings, defaulting to 'list'
  const getInitialWebView = useCallback((): 'list' | 'card' => {
    // Use the specific setting for web view default
    if (!isInitialLoadComplete || knowledgeSource !== 'web' || !settings?.personalSources?.web?.defaultWebView) { // <<< CHANGED from normal
      return 'list'; // Default if settings not loaded, not web search, or prop missing
    }
    // Directly return the validated setting value ('list' or 'card')
    return settings.personalSources.web.defaultWebView;
  }, [isInitialLoadComplete, settings?.personalSources?.web?.defaultWebView, knowledgeSource]);

  // State for view mode, initialized using settings
  const [webResultsView, setWebResultsView] = useState<'list' | 'card'>(getInitialWebView());

  // Ensure state is updated once settings are loaded or knowledgeSource changes
  useEffect(() => {
    setWebResultsView(getInitialWebView());
  }, [isInitialLoadComplete, knowledgeSource, getInitialWebView]);

  // --- Handler for Source Change (Updates URL) ---
  const handleSourceChange = useCallback((newSource: string) => {
      const params = new URLSearchParams(); // Start fresh for source change
      params.set('source', newSource);
      if (initialQuery) { params.set('q', initialQuery); }
      // Omit category, engines, pageno to reset them
      router.push(`/search?${params.toString()}`);
  }, [router, initialQuery]); // Depend on stable initialQuery

  // +++ HELPER FUNCTION TO GET FILTERED ENGINES FOR A CATEGORY +++
  const getFilteredEngineStringForCategory = useCallback((targetCategory: string): string | null => {
    if (!isInitialLoadComplete || !settings?.engines || !availableEngines || availableEngines.length === 0) {
      console.warn("[getFilteredEngineStringForCategory] Prerequisites not met.");
      return null;
    }
    // +++ If SLAI config is active, use its engines for the target category +++
    if (slaiConfig) {
      const matchingSet = slaiConfig.engineSets.find(set => set.category === targetCategory);
      if (matchingSet && matchingSet.engines.length > 0) {
        console.log(`[getFilteredEngineStringForCategory - SLAI] Using engines for category '${targetCategory}':`, matchingSet.engines);
        return matchingSet.engines.join(',');
      } else {
        console.warn(`[getFilteredEngineStringForCategory - SLAI] No engines found in SLAI config for category '${targetCategory}'. Falling back or returning null.`);
        // Fallback for SLAI: if the specific category has no engines in the set,
        // we might return null (to search all in that category from SLAI engines) or a broader set.
        // For now, let's return null, which might mean no engines if not handled by caller.
        // Or, return ALL slai engines if category not found?
        // Let's be strict: if category set exists but is empty, or set not found, return null.
        return null; 
      }
    }
    // --- Existing non-SLAI logic ---
    const currentActiveId = activeEngineLoadoutId ?? 'starter';
    let loadoutConfig: Engine[] = [];

    // Determine loadoutConfig (starter vs saved)
            if (currentActiveId === 'starter') {
      loadoutConfig = availableEngines.map(engine => ({ ...engine, enabled: engine.id === 'google' || engine.id === 'duckduckgo' }));
            } else {
               const savedLoadout = settings.engines.loadouts?.find(l => l.id === currentActiveId);
               if (savedLoadout?.config) {
        const savedConfigItems = savedLoadout.config || [];
        loadoutConfig = availableEngines.map(availEngine => {
          const loadoutItem = savedConfigItems.find(item => item.id === availEngine.id);
          return { ...availEngine, enabled: loadoutItem?.enabled ?? false };
                  });
               } else {
        console.warn(`[getFilteredEngineStringForCategory] Could not find config for loadout: ${currentActiveId}.`);
        return null; // Cannot filter without config
      }
    }

    // Filter enabled engines by the target category (using raw category match)
    const enginesForCategory = loadoutConfig.filter(engine => {
      if (!engine.enabled) return false;
      const supportedCategories = (engine.categories || []).map(c => c.toLowerCase()); // Normalize engine categories
      
      // Directly check if the lowercased targetCategory exists in the engine's supported categories
      const match = supportedCategories.includes(targetCategory.toLowerCase());

      // Optional logging for debugging:
      // console.log(`[Filtering Debug - Category] Engine: ${engine.id}, Target: ${targetCategory}, Supported: ${JSON.stringify(supportedCategories)}, Match: ${match}`);
      return match;
    }).map(engine => engine.id);

    console.log(`[getFilteredEngineStringForCategory] Engines for category '${targetCategory}':`, enginesForCategory);

    return enginesForCategory.length > 0 ? enginesForCategory.join(",") : null;

  }, [isInitialLoadComplete, settings, availableEngines, activeEngineLoadoutId]);
  // +++ END HELPER FUNCTION +++

  // Use useCallback for handleSearch - REVISED FOR SERVER-SIDE PAGINATION
  const handleSearch = useCallback(async (pageToFetch: number = 1, isSubmitEvent: boolean = false) => {
    console.log(`[handleSearch ENTERED] Page: ${pageToFetch}, isSubmit: ${isSubmitEvent}, ActiveTab: ${activeTab}`);
    console.log(`[handleSearch Check] isFetching=${isFetching}, isInitialLoadComplete=${isInitialLoadComplete}, initialQuery='${initialQuery.trim()}'`); // Log conditions

    if (isFetching) {
        console.log("[handleSearch] Aborting, another fetch is already in progress."); 
        return; 
    }
    if (!isInitialLoadComplete) { console.log("handleSearch: Aborting, initial settings load not complete."); return; }
    
    // --- MODIFIED: Ensure initialQuery is used, especially for SLAI where input field might not be primary ---
    const currentQuery = slaiConfig?.query || initialQuery; // Use SLAI query if available
    if (!currentQuery.trim()) { console.log("handleSearch: Aborting, query is empty."); return; }

    setIsFetching(true);
    setIsLoading(true); setError(null); setUsingMockData(false);
    
    // Only reset states on a new search (submit), not when navigating to page 1 of existing search
    if (isSubmitEvent) {
       setResults(null);
       setReachedEndOfResults(false); // Reset end of results flag on new search
       setCurrentSearchLastPage(null); // Reset last page on new search
       setHighestPageSeen(1); // Reset highest page seen on new search
    } else {
       // Update highest page seen, regardless of which page we're navigating to
       setHighestPageSeen(prev => Math.max(prev, pageToFetch));
    }

    try {
      // --- Determine source-specific settings --- 
      let resultsPerPage: number = 10;
      let openNewTab: boolean = true; // Default value

      if (knowledgeSource === 'web') { 
         resultsPerPage = settings?.personalSources?.web?.resultsPerPage ?? 10;
         openNewTab = settings?.personalSources?.web?.openNewTab ?? true; // Read from web config
      }
      else if (validSourceKeys.includes(knowledgeSource as SourceConfigKey)) { 
         const typedApiSource = knowledgeSource as SourceConfigKey;
         const sourceConfig = settings?.personalSources?.[typedApiSource]; 
         resultsPerPage = sourceConfig?.resultsPerPage ?? 10;
         openNewTab = (sourceConfig as any)?.openNewTab ?? true; // Read from specific source config (use 'as any' for now to bypass potential typing issues across different source configs)
      } 
      resultsPerPage = resultsPerPage > 0 ? resultsPerPage : 10;
      console.log(`Using resultsPerPage: ${resultsPerPage}, openNewTab: ${openNewTab} for source: ${knowledgeSource}`);
      // --- End source-specific settings determination --- 
      
      // --- Determine engines string ---
      let enginesString: string | null = null;
      if (slaiConfig) {
        const categorySet = slaiConfig.engineSets.find(set => set.category === activeTab);
        if (categorySet && categorySet.engines.length > 0) {
          enginesString = categorySet.engines.join(',');
          console.log(`[handleSearch - SLAI] Using engines for tab '${activeTab}': ${enginesString}`);
        } else {
          console.warn(`[handleSearch - SLAI] No engines in SLAI config for active tab '${activeTab}'. No engines will be passed.`);
          // Optionally, could fall back to all SLAI engines if no specific set for tab:
          // enginesString = slaiConfig.engineSets.flatMap(s => s.engines).join(',');
        }
      } else if (knowledgeSource === 'web') { // Only try to get loadout engines for web source if not SLAI
        enginesString = getFilteredEngineStringForCategory(activeTab || 'general'); // Use activeTab or default
        console.log(`[handleSearch - Non-SLAI] Using engines from loadout for tab '${activeTab || 'general'}': ${enginesString}`);
      }
      // --- End determining engines string ---

      const safeSearch = settings?.general?.safeSearch || "0";
      const language = settings?.general?.defaultLanguage || "all";
      // const openNewTabGeneral = settings.general?.openNewTab !== false; // <<< REMOVED general reading
      const searchUrl = new URL("/api/search", window.location.origin);

      // +++ Logging before appending parameters +++
      console.log(`[handleSearch: Params Start] Initial URL: ${searchUrl.toString()}`);
      console.log(`[handleSearch: Params Append] Appending q: '${currentQuery}'`); // Use currentQuery
      searchUrl.searchParams.append("q", currentQuery); // Use currentQuery
      console.log(`[handleSearch: Params Append] Appending source: '${knowledgeSource}'`);
      searchUrl.searchParams.append("source", knowledgeSource);
      console.log(`[handleSearch: Params Append] Appending pageno: ${pageToFetch}`);
      searchUrl.searchParams.append("pageno", pageToFetch.toString());
      console.log(`[handleSearch: Params Append] Appending results: ${resultsPerPage}`);
      searchUrl.searchParams.append("results", resultsPerPage.toString());
      console.log(`[handleSearch: Params Append] Appending safesearch: ${safeSearch}`);
      searchUrl.searchParams.append("safesearch", safeSearch.toString());

      if (language && language !== "auto") { 
        console.log(`[handleSearch: Params Append] Appending language: ${language}`);
        searchUrl.searchParams.append("language", language); 
      }
      // --- MODIFIED: Category and Engines appending ---
      if (activeTab && activeTab !== "none") {
        console.log(`[handleSearch: Params Append] Appending category: ${activeTab}`);
        searchUrl.searchParams.append("category", activeTab);
      }

      if (enginesString) {
        console.log(`[handleSearch: Params Append] Appending engines: ${enginesString}`);
        searchUrl.searchParams.append("engines", enginesString);
      } else {
        // If enginesString is null (e.g., SLAI category had no engines, or non-SLAI category in loadout had no engines)
        // and it's a web search, we might not want to send an empty 'engines=' param.
        // SearXNG might default to all engines if 'engines' is not provided.
        // For SLAI, if a category has no engines, it effectively means "search with no engines for this tab",
        // which should result in no results for that specific API call.
        // If it's a non-SLAI web search and getFilteredEngineStringForCategory returns null,
        // it means no engines in the loadout support that category.
        console.log(`[handleSearch: Params Append] No specific engines to append for this request.`);
      }
      // --- End MODIFIED: Category and Engines appending ---
      
      if (settings?.privacy?.proxyImages !== undefined) { 
        const proxyValue = settings.privacy.proxyImages ? "true" : "false";
        console.log(`[handleSearch: Params Append] Appending image_proxy: ${proxyValue}`);
        searchUrl.searchParams.append("image_proxy", proxyValue);
      }
      if (knowledgeSource === 'web' && settings?.general?.ragEnabled) { 
        console.log(`[handleSearch: Params Append] Appending rag: enabled`);
        searchUrl.searchParams.append("rag", "enabled"); 
      }

      const finalSearchUrl = searchUrl.toString();
      console.log(`>>> FINAL Fetching URL: ${finalSearchUrl}`);

      const response = await fetch(finalSearchUrl);
      const data = await response.json();

      console.log(`handleSearch: Received data from backend. Standard results count: ${data?.results?.length ?? 'N/A'}, Infoboxes: ${data?.infoboxes?.length ?? 0}, Total Results (API): ${data?.number_of_results ?? 'N/A'}`);

      if (!response.ok) {
        throw new Error(data?.detail || `HTTP error! status: ${response.status}`);
      }

      // Check if we've reached the end of results (empty results or fewer than requested)
      const resultsLength = data.results?.length || 0;
      if (resultsLength === 0) {
        console.log("handleSearch: Received empty results, marking as end of results");
        setReachedEndOfResults(true);
        
        // If this is page 1 and no results, actually show no results
        if (pageToFetch === 1) {
          setResults({
            searchResults: [],
            source: data.source || knowledgeSource,
            query: currentQuery,
            category: activeTab,
          });
          setIsLoading(false);
          return;
        }
        
        // We've reached the last page of results
        setCurrentSearchLastPage(pageToFetch - 1); // Last valid page was the previous one
        
        // Show a toast notification
        toast({
          title: "End of results",
          description: `You've reached the last page of results for "${currentQuery}"`,
          duration: 3000,
        });
        
        // If this is beyond page 1 and no results, don't update results state
        // Just mark we've reached the end and stop loading
        setIsLoading(false);
        return;
      }

      // --- Store results directly --- 
      setResults({
          searchResults: data.results || [], // Store standard results
          source: data.source || knowledgeSource,
          query: currentQuery,
          category: activeTab,
          total_results: data.total_results ?? data.number_of_results, // Use API's total count
          currentPage: pageToFetch, // Store the page number we requested
          nonCriticalErrors: data.errors || [], 
          answers: data.answers,
          corrections: data.corrections,
          infoboxes: data.infoboxes, // Store infoboxes
          suggestions: data.suggestions,
          pagination: data.pagination, // Store any pagination metadata from API
          number_of_results: data.number_of_results // Store the primary result count
      });

      // Update the maximum total results seen
      setMaxTotalResults(prev => Math.max(prev, data.number_of_results || 0));

    } catch (err: any) {
      console.error("Search Error in handleSearch:", err);
      setError(err.message || "Failed to fetch search results.");
      // Clear results on error?
      setResults(null); 
    } finally {
      setIsLoading(false); // Keep isLoading for UI feedback
      setIsFetching(false);
    }
  }, [initialQuery, initialEngines, isInitialLoadComplete, settings, availableEngines, activeEngineLoadoutId, knowledgeSource, isFetching, slaiConfig, activeTab, getFilteredEngineStringForCategory, router]);

  // --- Effect to Synchronize State FROM URL ---
  // <<< Updated dependencies: Use initial values, remove searchParams >>>
  useEffect(() => {
    console.log(`Sync Effect: Initial Vals - q='${initialQuery}', category='${initialCategory}', source='${initialSource}', pageno=${initialPage}`);

    // Sync activeTab state from initialCategory
    if (initialCategory !== activeTab) {
      console.log(`Sync Effect: Updating activeTab state ('${activeTab}' -> '${initialCategory}')`);
      setActiveTab(initialCategory);
    }

    // Sync inputValue state from initialQuery
    if (initialQuery !== inputValue) {
      console.log(`Sync Effect: Updating inputValue state ('${inputValue}' -> '${initialQuery}')`);
      setInputValue(initialQuery);
    }

    // Sync knowledgeSource state from initialSource
    if (initialSource !== knowledgeSource) {
       console.log(`Sync Effect: Updating knowledgeSource state ('${knowledgeSource}' -> '${initialSource}')`);
       setKnowledgeSource(initialSource);
    }

    // Sync currentPage state from initialPage
    if (initialPage !== currentPage) {
       console.log(`Sync Effect: Updating currentPage state (${currentPage} -> ${initialPage})`);
       setCurrentPage(initialPage);
    }

  }, [initialQuery, initialCategory, initialSource, initialPage, knowledgeSource, currentPage]); // <<< REMOVED activeTab, inputValue

  // --- REVISED Main Search Trigger Effect --- 
  useEffect(() => {
    console.log("[Search Effect RUNNING] Replaces old Search Effect and SLAI Trigger Effect");
    
    // Log dependency values *as seen by this effect run*
    console.log(`[Search Effect Deps] isInitialLoadComplete=${isInitialLoadComplete}, initialQuery='${initialQuery}', initialSource='${initialSource}', initialCategory='${initialCategory}', initialEngines='${initialEngines ?? 'null'}', initialPage=${initialPage}`);
    console.log(`[Search Effect Deps] slaiConfig loaded: ${!!slaiConfig}, results loaded: ${!!results}`);

    if (!isInitialLoadComplete) {
      console.log("[Search Effect] Waiting for initial settings load.");
      return; // Wait for settings
    }

    const isSlaimode = searchParams.get('slai_session') === 'true';
    
    // If it's an SLAI session, but the config hasn't loaded yet, wait.
    if (isSlaimode && slaiConfig === null) {
      console.log("[Search Effect] SLAI mode active, but slaiConfig not yet loaded from sessionStorage. Waiting...");
      return;
    }

    // If query is empty, clear results and stop.
    if (!initialQuery.trim()) {
       console.log("[Search Effect] Query is empty. Clearing results.");
       setResults(null);
       setIsLoading(false); 
       setError(null);
       return;
    }

    // Check if current results match the parameters derived from the URL/SLAI config
    // Note: For SLAI, initialQuery might differ from slaiConfig.query if user navigates back/fwd weirdly, but usually they align.
    // We compare against initialQuery/initialCategory from URL params as the source of truth for the desired state.
    const resultsMatchCurrentParams = results &&
                                     results.query === initialQuery &&
                                     results.source === initialSource &&
                                     results.category === initialCategory;
    
    console.log(`[Search Effect Check] resultsMatchCurrentParams = ${resultsMatchCurrentParams} (Query Match: ${results?.query === initialQuery}, Source Match: ${results?.source === initialSource}, Category Match: ${results?.category === initialCategory})`);

    // If results DON'T match the current params, trigger a new search for page 1
    if (!resultsMatchCurrentParams) {
        // Added check to prevent fetching if already fetching
        if (isFetching) {
            console.log("[Search Effect] Skipping fetch because isFetching is true.");
            return;
        }
        console.log(`[Search Effect] Triggering handleSearch(${initialPage}, true) because results don't match current URL params.`);
        handleSearch(initialPage, true); // Use true for isSubmitEvent to reset results fully
    } else {
        console.log("[Search Effect] Results already match current URL params. Skipping fetch.");
    }

  // Dependencies: Include all external values read by the effect.
  // isFetching is added to prevent re-triggering based on its change if fetch was skipped.
  }, [isInitialLoadComplete, initialQuery, initialSource, initialCategory, initialEngines, initialPage, slaiConfig, results, handleSearch, searchParams, isFetching]); // Added slaiConfig, results, searchParams, isFetching

  // --- Pagination Handlers --- REVISED FOR SERVER-SIDE --- 
  const handlePreviousPage = () => {
    if (currentPage > 1) {
      const newPage = currentPage - 1;
      setCurrentPage(newPage); // Update state first
      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set("pageno", newPage.toString());
      router.push(`/search?${params.toString()}`, { scroll: false }); // Prevent full reload, don't scroll yet
      // Trigger search for the new page
      handleSearch(newPage);
      // Scroll to top after triggering search
      window.scrollTo(0, 0);
    }
  }

  const handleNextPage = () => {
    // Calculate total pages based on API response (or fallback)
    let totalPagesCalc = 0;
    if (results?.number_of_results && resultsPerPageNum > 0) {
      totalPagesCalc = Math.ceil(results.number_of_results / resultsPerPageNum);
    } else if (results?.searchResults && results.searchResults.length > 0) {
        // Fallback if number_of_results isn't present but we have results on the current page
        totalPagesCalc = currentPage + 1; // Assume at least one more page might exist
    } 
    console.log(`handleNextPage: CurrentPage=${currentPage}, Calculated TotalPages=${totalPagesCalc}`);

    if (currentPage < totalPagesCalc) {
      const newPage = currentPage + 1;
      setCurrentPage(newPage); // Update state first
      // Update URL
      const params = new URLSearchParams(searchParams.toString());
      params.set("pageno", newPage.toString());
      router.push(`/search?${params.toString()}`, { scroll: false }); // Prevent full reload, don't scroll yet
      // Trigger search for the new page
      handleSearch(newPage);
      // Scroll to top after triggering search
      window.scrollTo(0, 0);
    }
  }
  // --- END REVISED Pagination Handlers ---

  // --- Calculate Pagination Variables --- REVISED for Server-Side --- 
  let resultsPerPageNum = 10; // Default
  let totalPages = 1; // Default to 1 page
  let showPagination = false; // Default to hiding pagination

  // First check if we have any results at all - hide pagination if no results
  if (!results || !results.searchResults || results.searchResults.length === 0) {
    // Keep pagination hidden when no results
  } else {
    // Get RPP based on current source (same as before)
    const currentSource = results?.source || knowledgeSource;
    if (settings && currentSource) {
        if (currentSource === 'web') {
            resultsPerPageNum = parseInt(settings.personalSources?.web?.resultsPerPage?.toString() ?? '10', 10);
        } else if (validSourceKeys.includes(currentSource as SourceConfigKey)) {
            const sourceConfig = settings.personalSources?.[currentSource as SourceConfigKey];
            resultsPerPageNum = sourceConfig?.resultsPerPage ?? 10; 
        }
    }
    resultsPerPageNum = resultsPerPageNum > 0 ? resultsPerPageNum : 10; // Ensure positive

    // Calculate pagination display without relying on estimates
    if (reachedEndOfResults && currentSearchLastPage) {
      // If we know the exact last page, use that
      totalPages = currentSearchLastPage;
      showPagination = totalPages > 1;
    } else {
      // If we haven't reached the end yet, show only the pages we've seen
      totalPages = highestPageSeen;
      showPagination = true; // Show pagination to allow navigation if we have results
    }
  }
  
  console.log(`Pagination Calculation: Current page: ${currentPage}, Total pages: ${totalPages}, Show pagination: ${showPagination}, Has results: ${results?.searchResults?.length ?? 0 > 0}`)

  // Calculate available tabs based on enabled engines AND canonical list
  const availableTabs = useMemo((): TabDefinition[] => {
    console.log("[Tab Calculation Debug] Calculating available tabs (Strict Mode)... ");
    if (!isInitialLoadComplete || !availableEngines || availableEngines.length === 0) {
        console.log("[Tab Calculation Debug] Prerequisites not met (initial load/available engines). Defaulting to General tab.");
        return [{ name: "General", value: "general" }]; // Always show General as minimum
    }

    const currentActiveId = activeEngineLoadoutId ?? 'starter';
    let activeConfig: Engine[] = [];

    // Determine activeConfig based on starter or saved loadout (same logic as before)
    if (currentActiveId === 'starter') {
      activeConfig = availableEngines.map(engine => ({ ...engine, enabled: engine.id === 'google' || engine.id === 'duckduckgo' }));
      console.log("[Tab Calculation Debug] Using starter config for tabs.");
    } else {
      const savedLoadout = settings.engines?.loadouts?.find(l => l.id === currentActiveId);
      if (savedLoadout?.config) {
        const savedConfigItems = savedLoadout.config || [];
        activeConfig = availableEngines.map(availEngine => {
          const loadoutItem = savedConfigItems.find(item => item.id === availEngine.id);
          return { ...availEngine, enabled: loadoutItem?.enabled ?? false };
        });
        console.log(`[Tab Calculation Debug] Using saved loadout config: ${savedLoadout.name}`);
      } else {
        console.warn(`[Tab Calculation Debug] Could not find config for loadout: ${currentActiveId}. Defaulting to General tab.`);
        return [{ name: "General", value: "general" }];
      }
    }

    const enabledEngines = activeConfig.filter(e => e.enabled);
    console.log(`[Tab Calculation Debug] Enabled engines count: ${enabledEngines.length}`);

    // Collect all unique *raw* categories supported by *any* enabled engine
    const supportedRawCategories = new Set<string>();
    enabledEngines.forEach(engine => {
      (engine.categories || []).forEach(cat => supportedRawCategories.add(cat.toLowerCase()));
    });
    console.log("[Tab Calculation Debug] Raw categories supported by enabled engines:", Array.from(supportedRawCategories));

    // --- Filter based on Canonical Categories --- 
    const canonicalCategories = categoryOrder; // Use the imported constant
    let generatedTabs: TabDefinition[] = [];
    let hasGeneralTab = false;

    canonicalCategories.forEach(canonicalCat => {
        const canonicalId = canonicalCat.id.toLowerCase();
        
        if (canonicalId === 'general') {
            // Check if 'general' is supported by engines
            if (supportedRawCategories.has('general')) {
                // Add the 'General' tab representation with correct value
                generatedTabs.push({ name: "General", value: "general" });
                hasGeneralTab = true;
                console.log(`[Tab Calculation Debug] Adding 'General' tab (value: general) because 'general' is supported.`);
            }
        } else {
            // Check if the specific canonical category ID is supported by engines
            if (supportedRawCategories.has(canonicalId)) {
                generatedTabs.push({ name: canonicalCat.name, value: canonicalId });
                 console.log(`[Tab Calculation Debug] Adding '${canonicalCat.name}' tab (value: ${canonicalId}) because it's supported.`);
            } else {
                 console.log(`[Tab Calculation Debug] Skipping '${canonicalCat.name}' tab (value: ${canonicalId}) because it's NOT supported by enabled engines.`);
            }
        }
    });

    // Sort the generated tabs according to the canonical order
    generatedTabs.sort((a, b) => {
        // Map values directly to canonical IDs for sorting lookup
        const idA = a.value;
        const idB = b.value;
        
        const indexA = canonicalCategories.findIndex(cat => cat.id.toLowerCase() === idA);
        const indexB = canonicalCategories.findIndex(cat => cat.id.toLowerCase() === idB);
        
        if (indexA === -1) return 1; // Should not happen if generated correctly
        if (indexB === -1) return -1;
        return indexA - indexB;
    });

    // Fallback: If NO tabs were generated, add General
    if (generatedTabs.length === 0) {
        generatedTabs.push({ name: "General", value: "general" });
        console.log("[Tab Calculation Debug] No supported canonical categories found in enabled engines. Adding 'General' tab as fallback.");
    } 
    // Ensure General tab is first if it exists and wasn't the only one added by fallback
    else if (hasGeneralTab) {
        const generalIndex = generatedTabs.findIndex(t => t.value === 'general');
        if (generalIndex > 0) {
            // Move the General tab to the beginning
            generatedTabs.unshift(generatedTabs.splice(generalIndex, 1)[0]);
            console.log("[Tab Calculation Debug] Ensuring 'General' tab is first in the sorted list.");
        }
    }

    console.log("[Tab Calculation Debug] Final calculated tabs (strict):", generatedTabs);
    return generatedTabs;

  }, [isInitialLoadComplete, availableEngines, settings.engines?.loadouts, activeEngineLoadoutId]);

  // --- REVISED Default/Reset Tab Effect --- 
  useEffect(() => {
      const currentUrlCategory = initialCategory; // Get category from URL
      const availableTabValues = availableTabs.map(tab => tab.value);
      const isUrlCategoryValid = currentUrlCategory && availableTabValues.includes(currentUrlCategory);

      console.log(`[Tab Default/Reset Check] URL Category: '${currentUrlCategory}', Available: ${JSON.stringify(availableTabValues)}, Is Valid: ${isUrlCategoryValid}, Current State: '${activeTab}'`);

      // Condition 1: Web search active AND (URL category is NOT valid OR no URL category) AND tabs ARE available
      if (knowledgeSource === 'web' && !isUrlCategoryValid && availableTabs.length > 0) { // <<< CHANGED from normal
          // Determine the best default tab (prefer 'general', fallback to first)
          let defaultTabValue = availableTabs.some(tab => tab.value === 'general') ? 'general' : availableTabs[0].value;
          
          // Only update state if it's not already the intended default
          if (activeTab !== defaultTabValue) {
              console.log(`[Tab Default/Reset] Setting default active tab to: '${defaultTabValue}' (URL category invalid or missing)`);
              setActiveTab(defaultTabValue);
          }
      } 
      // Condition 2: Web search active but NO tabs are available
      else if (knowledgeSource === 'web' && availableTabs.length === 0) { // <<< CHANGED from normal
           if (activeTab !== 'none') {
               console.log("[Tab Default/Reset] No available tabs for web search. Setting activeTab to 'none'.");
               setActiveTab('none');
           }
      }
      // Condition 3: Source is NOT web search (e.g., Obsidian, YouTube)
      else if (knowledgeSource !== 'web') { // <<< CHANGED from normal
          if (activeTab !== '') { // Use empty string to represent no tab for non-web sources
               console.log(`[Tab Default/Reset] Source is not 'web' ('${knowledgeSource}'). Clearing activeTab.`); // <<< CHANGED from normal
               setActiveTab(''); 
          }
      }
      // Condition 4: URL Category IS valid, ensure state matches URL
      // This case is handled by the Sync Effect, so no action needed here.
      // else if (isUrlCategoryValid && activeTab !== currentUrlCategory) {
      //    console.log(`[Tab Default/Reset] URL category '${currentUrlCategory}' is valid. Sync effect ensures state match.`);
      // }

  }, [availableTabs, knowledgeSource, initialCategory]); // <<< Dependencies: availableTabs, knowledgeSource, initialCategory

  // --- End Tab Calculation ---

  // --- Update URL and Trigger Search on Tab Click --- 
  const handleTabChange = (newTab: string) => {
    console.log(`[handleTabChange RUNNING] Switching to tab: ${newTab}`); // Log entry
    // setActiveTab(newTab); // State update happens via useEffect sync

    // Reset pagination state when changing tabs
    setCurrentPage(1);
    setHighestPageSeen(1);
    setReachedEndOfResults(false);
    setCurrentSearchLastPage(null);

    // --- Calculate filtered engines for the *new* tab --- 
    // Convert 'web' tab value to 'general' category when getting filtered engines
    const categoryForFiltering = newTab === 'web' ? 'general' : newTab;
    const filteredEngines = getFilteredEngineStringForCategory(categoryForFiltering);
    console.log(`[handleTabChange] Calculated engines for '${categoryForFiltering}': ${filteredEngines}`); // <<< Updated log message

    // --- Update URL with new category AND filtered engines --- 
    const params = new URLSearchParams(searchParams.toString());
    params.set("category", newTab);
    params.delete("pageno"); // Reset to page 1

    if (filteredEngines) {
      params.set("engines", filteredEngines); // Add the filtered engines
    } else {
      params.delete("engines"); // Remove engines param if none apply
    }

    const targetUrl = `/search?${params.toString()}`;
    console.log(`[handleTabChange] Calling router.push with URL: ${targetUrl}`); // Log before push

    // Push the new URL - the search effect will pick up changes
    router.push(targetUrl);
    console.log("[handleTabChange] router.push CALLED."); // Log after push
  };

  // Form submit handler - UPDATED to modify URL first
  const handleFormSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    console.log(`handleFormSubmit: Submitting with inputValue: '${inputValue}' and activeTab: '${activeTab}'`);

    // Don't submit if query is empty
    if (!inputValue.trim()) {
      console.log("handleFormSubmit: Input value is empty, aborting.");
      return;
    }

    // Calculate filtered engines for the *current* active tab
    // Get filtering category directly from activeTab
    const categoryForFiltering = activeTab || "general";
    const filteredEngines = getFilteredEngineStringForCategory(categoryForFiltering);
    console.log(`handleFormSubmit: Calculated engines for category '${categoryForFiltering}': ${filteredEngines}`);

    // Build new URL parameters
    const params = new URLSearchParams(); 
    params.set("q", inputValue); 
    params.set("source", knowledgeSource); 
    // Use activeTab for the URL parameter or default to general
    const categoryForUrl = activeTab || "general";
    params.set("category", categoryForUrl); 
    if (filteredEngines) {
      params.set("engines", filteredEngines);
    } else {
       // If no specific engines apply, REMOVE the engines param 
       // so SearXNG uses its default for the category.
       params.delete("engines"); 
    }
    // pageno is omitted, implicitly page 1

    const targetUrl = `/search?${params.toString()}`;
    console.log(`handleFormSubmit: Navigating to URL: ${targetUrl}`);

    router.push(targetUrl);
  }

  // Determine header text only when load is complete
  const headerText = isInitialLoadComplete
    ? settings.general?.instanceName || "SlySearch"
    : undefined // Pass undefined if not loaded

  // --- Determine openInNewTab for SearchResults component --- 
  const openInNewTabForDisplay = useMemo(() => {
     const currentDisplaySource = results?.source || knowledgeSource; // <<< CHANGED from apiSource
     let openSetting = true; // Default
     if (currentDisplaySource === 'web') {
        openSetting = settings?.personalSources?.web?.openNewTab ?? true;
     } else if (validSourceKeys.includes(currentDisplaySource as SourceConfigKey)) {
        const sourceConfig = settings?.personalSources?.[currentDisplaySource as SourceConfigKey];
        openSetting = (sourceConfig as any)?.openNewTab ?? true;
     }
     console.log(`[Display Prop] Determined openInNewTab=${openSetting} for source='${currentDisplaySource}'`);
     return openSetting;
  }, [results?.source, knowledgeSource, settings]); // <<< CHANGED from apiSource

  // +++ useEffect to Detect SLAI Search and Load from sessionStorage +++
  useEffect(() => {
    if (searchParams.get('slai_session') === 'true') {
      const storedConfig = sessionStorage.getItem('slaiSearchConfig');
      if (storedConfig) {
        try {
          const parsedConfig = JSON.parse(storedConfig) as SlaiConfig;
          console.log("[SearchPage] Loaded SLAI config from sessionStorage:", parsedConfig);
          setSlaiConfig(parsedConfig);
          setActiveTab(parsedConfig.initialCategory); // Set initial tab from SLAI config

          // sessionStorage.removeItem('slaiSearchConfig'); // Remove after reading
                                                      // Temporarily disable removal for easier debugging if page reloads.
                                                      // Re-enable this for production.

          // Clean the URL - remove slai_session param
          const nextParams = new URLSearchParams(searchParams.toString());
          nextParams.delete('slai_session');
          // router.replace(`/search?${nextParams.toString()}`, { scroll: false }); // router.replace might be too aggressive and cause re-renders
                                                                              // Consider just letting the param be, or use window.history.replaceState
                                                                              // For now, let's not replace to avoid potential loops during dev
          console.log("[SearchPage] SLAI session processed. Config set, initial tab set.");
        } catch (e) {
          console.error("[SearchPage] Error parsing SLAI config from sessionStorage:", e);
          toast({ title: "Error", description: "Could not load AI search configuration.", variant: "destructive" });
          setSlaiConfig(null); // Clear on error
        }
      } else {
        console.warn("[SearchPage] slai_session=true but no config found in sessionStorage.");
        // Potentially handle this - maybe show a message or revert to normal search
        setSlaiConfig(null);
      }
    } else {
      // Ensure slaiConfig is cleared if not an SLAI session (e.g., navigating back from SLAI to a normal search)
      if (slaiConfig !== null) { // Only set if it's currently not null to avoid unnecessary re-renders
          console.log("[SearchPage] Not an SLAI session or slai_session param removed, clearing SLAI config.");
          setSlaiConfig(null);
      }
    }
  }, [searchParams, router, toast]); // Added toast

  // Effect to sync inputValue with initialQuery from URL (e.g., on back/forward navigation)
  useEffect(() => {
    if (initialQuery !== inputValue) {
      setInputValue(initialQuery);
    }
  }, [initialQuery]); // Only sync input when initialQuery changes

  // Effect to sync activeTab with URL or set default (MOVED AFTER displayTabs definition)
  useEffect(() => {
    // Prioritize slaiConfig.initialCategory if slaiConfig is present and activeTab is not yet set or doesn't match
    if (slaiConfig && slaiConfig.initialCategory && (!activeTab || activeTab !== slaiConfig.initialCategory)) {
      console.log(`[activeTab Sync] SLAI mode. Setting activeTab from slaiConfig.initialCategory: '${slaiConfig.initialCategory}'`);
      setActiveTab(slaiConfig.initialCategory);
    } else if (!slaiConfig && initialCategory) { // If not SLAI, and URL has category
      console.log(`[activeTab Sync] Non-SLAI mode. Setting activeTab from URL initialCategory: '${initialCategory}'`);
      setActiveTab(initialCategory);
    } else if (!slaiConfig && !initialCategory && availableTabs.length > 0) { // If not SLAI, no URL category, but tabs exist
      console.log(`[activeTab Sync] Non-SLAI mode. No URL category. Setting activeTab to first displayTab: '${availableTabs[0].value}'`);
      setActiveTab(availableTabs[0].value);
    } else if (!activeTab && availableTabs.length > 0) { // Fallback if activeTab somehow still not set
        console.log(`[activeTab Sync] Fallback. Setting activeTab to first displayTab: '${availableTabs[0].value}'`);
        setActiveTab(availableTabs[0].value);
    }
     // Add slaiConfig to dependencies.
  }, [initialCategory, availableTabs, router, slaiConfig, activeTab]); // activeTab also added to see if it needs to be synced

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            {/* Render Logo component, passing dynamic text when available */}
            <Logo size="small" text={headerText} />
          </div>

          <form onSubmit={handleFormSubmit} className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search the web..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="pl-9 py-2 bg-background/60 themed-gradient-border"
              />
            </div>
          </form>

          <div className="flex items-center gap-2">
            <div className="w-[180px]">
              <TheLocalLagoon
                value={knowledgeSource}
                onChange={handleSourceChange}
                compact={true}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Settings Menu */}
              <QuickSettingsMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-4 pt-0 pb-6">
        {/* Error Alert */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Mock Data Alert */}
        {usingMockData && (
          <Alert className="mb-4 bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription>
              Using mock data because the search backend is currently unavailable. Some features may be limited.
            </AlertDescription>
          </Alert>
        )}

        {/* Tabs and View Switcher Container */}
        {knowledgeSource === 'web' && ( // <<< CHANGED from normal // Only show for web source
          <div className="flex justify-between items-center mb-4">
            {/* Category Tabs */}
            {((): null => { // IIFE for logging within JSX
              console.log(`[Tabs Render Debug] Current activeTab state: '${activeTab}'`);
              const tabsValue = activeTab === 'none' ? undefined : activeTab;
              console.log(`[Tabs Render Debug] Value passed to <Tabs>: '${tabsValue}'`);
              console.log(`[Tabs Render Debug] Available tabs for mapping:`, availableTabs.map(t => t.value));
              return null;
            })()}
            <Tabs value={activeTab === 'none' ? undefined : activeTab} onValueChange={handleTabChange} className="w-full overflow-x-auto">
              <TabsList className="inline-flex h-9 items-center justify-center rounded-none border-b bg-transparent p-0 w-full">
                {/* Dynamic Raw Category Tabs */}
                {availableTabs.map((tab: TabDefinition) => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none focus-visible:ring-0 data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none whitespace-nowrap capitalize" // Added capitalize
                  >
                    {tab.name} {/* Display the tab name */}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {/* <<< Conditionally Render View Switcher for NON-Web SOURCES >>> */}
            {knowledgeSource !== 'web' && ( // <<< CHANGED from normal
              <ToggleGroup 
                type="single" 
                value={webResultsView} // This state might need refinement if different non-web sources need different defaults/views
                onValueChange={(value: "list" | "card") => {
                  if (value) setWebResultsView(value); 
                }}
                className="bg-background/60 themed-gradient-border p-0.5 rounded-md ml-4" // Added ml-4 for spacing
                size="sm"
              >
                <ToggleGroupItem value="list" aria-label="List view" className="rounded-sm data-[state=on]:themed-gradient-transparent data-[state=on]:text-white">
                  <List className="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="card" aria-label="Card view" className="rounded-sm data-[state=on]:themed-gradient-transparent data-[state=on]:text-white">
                  <LayoutGrid className="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <LoadingResults />
        ) : (
          <>
            {/* Top Pagination Controls - Moved outside container */}
            {showPagination && !isLoading && (
              <div className="flex justify-center items-center gap-4 mb-6">
                {/* Centered Pagination with Chevrons */}
                <div className="flex items-center gap-2">
                  {/* Left Chevron */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handlePreviousPage}
                    disabled={currentPage <= 1 || isLoading}
                    className={currentPage <= 1 ? "opacity-50" : ""}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  {/* Page Numbers - Top pagination */}
                  {(() => {
                    // Maximum buttons to show in pagination
                    const MAX_BUTTONS = 10;
                    
                    // Calculate the range of pages to display
                    let startPage = 1;
                    let endPage = Math.min(highestPageSeen, MAX_BUTTONS);
                    
                    // If we have more than MAX_BUTTONS pages
                    if (highestPageSeen > MAX_BUTTONS) {
                      // Determine position based on current page
                      if (currentPage <= 6) {
                        // When near the beginning, show first 10 pages
                        startPage = 1;
                        endPage = 10;
                      } else if (currentPage >= highestPageSeen - 5) {
                        // When near the end, show last 10 pages
                        startPage = Math.max(1, highestPageSeen - MAX_BUTTONS + 1);
                        endPage = highestPageSeen;
                      } else {
                        // In the middle, center the current page
                        startPage = currentPage - 5;
                        endPage = currentPage + 4;
                        
                        // Ensure we don't go beyond boundaries
                        if (endPage > highestPageSeen) {
                          endPage = highestPageSeen;
                          startPage = Math.max(1, endPage - MAX_BUTTONS + 1);
                        }
                      }
                    }
                    
                    console.log(`Pagination Window - Current: ${currentPage}, Range: ${startPage}-${endPage}, Highest: ${highestPageSeen}`);
                    
                    // Generate array of page numbers to display
                    return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                      const pageNum = startPage + i;
                      
                      return (
                        <Button 
                          key={`top-${pageNum}`}
                          variant={pageNum === currentPage ? "default" : "outline"} 
                          size="sm"
                          onClick={() => {
                            if (pageNum !== currentPage) {
                              setCurrentPage(pageNum);
                              const params = new URLSearchParams(searchParams.toString());
                              params.set("pageno", pageNum.toString());
                              router.push(`/search?${params.toString()}`, { scroll: false });
                              handleSearch(pageNum);
                              window.scrollTo(0, 0);
                            }
                          }}
                        >
                          {pageNum}
                        </Button>
                      );
                    });
                  })()}

                  {/* Right Chevron - Only way to navigate to unseen pages */}
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleNextPage}
                    disabled={reachedEndOfResults || isLoading}
                    className={reachedEndOfResults ? "opacity-50" : ""}
                    title={reachedEndOfResults && currentSearchLastPage ? `Last page is ${currentSearchLastPage}` : "Next page"}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Search Results */}
        <div className="search-results-container rounded-lg p-4">
          <SearchResults
            isLoading={isLoading}
            resultsData={results} 
            query={initialQuery} 
            knowledgeSource={knowledgeSource} 
            webResultsView={webResultsView} 
            activeTab={activeTab}
            defaultYouTubeView={settings?.personalSources?.youtube?.defaultYouTubeView ?? 'card'}
            defaultPhotosView={settings?.personalSources?.photos?.defaultPhotosView ?? 'card'}
          />
        </div>
        
        {/* Bottom Pagination Controls - Moved outside container */}
        {showPagination && !isLoading && (
          <div className="flex justify-center items-center gap-4 mt-6">
            {/* Centered Pagination with Chevrons */}
            <div className="flex items-center gap-2">
              {/* Left Chevron */}
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1 || isLoading}
                className={currentPage <= 1 ? "opacity-50" : ""}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              {/* Page Numbers - Bottom pagination */}
              {(() => {
                // Maximum buttons to show in pagination
                const MAX_BUTTONS = 10;
                
                // Calculate the range of pages to display
                let startPage = 1;
                let endPage = Math.min(highestPageSeen, MAX_BUTTONS);
                
                // If we have more than MAX_BUTTONS pages
                if (highestPageSeen > MAX_BUTTONS) {
                  // Determine position based on current page
                  if (currentPage <= 6) {
                    // When near the beginning, show first 10 pages
                    startPage = 1;
                    endPage = 10;
                  } else if (currentPage >= highestPageSeen - 5) {
                    // When near the end, show last 10 pages
                    startPage = Math.max(1, highestPageSeen - MAX_BUTTONS + 1);
                    endPage = highestPageSeen;
                  } else {
                    // In the middle, center the current page
                    startPage = currentPage - 5;
                    endPage = currentPage + 4;
                    
                    // Ensure we don't go beyond boundaries
                    if (endPage > highestPageSeen) {
                      endPage = highestPageSeen;
                      startPage = Math.max(1, endPage - MAX_BUTTONS + 1);
                    }
                  }
                }
                
                // Generate array of page numbers to display
                return Array.from({ length: endPage - startPage + 1 }, (_, i) => {
                  const pageNum = startPage + i;
                  
                  return (
                    <Button 
                      key={`bottom-${pageNum}`}
                      variant={pageNum === currentPage ? "default" : "outline"} 
                      size="sm"
                      onClick={() => {
                        if (pageNum !== currentPage) {
                          setCurrentPage(pageNum);
                          const params = new URLSearchParams(searchParams.toString());
                          params.set("pageno", pageNum.toString());
                          router.push(`/search?${params.toString()}`, { scroll: false });
                          handleSearch(pageNum);
                          window.scrollTo(0, 0);
                        }
                      }}
                    >
                      {pageNum}
                    </Button>
                  );
                });
              })()}

              {/* Right Chevron - Only way to navigate to unseen pages */}
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={reachedEndOfResults || isLoading}
                className={reachedEndOfResults ? "opacity-50" : ""}
                title={reachedEndOfResults && currentSearchLastPage ? `Last page is ${currentSearchLastPage}` : "Next page"}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
