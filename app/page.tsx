"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { SearchBar } from "@/components/search-bar"
import { Search, Loader2, RefreshCw } from "lucide-react"
import Logo from "@/components/logo"
import TheLocalLagoon from "@/components/the-local-lagoon"
import { QuickSettingsMenu } from "@/components/quick-settings-menu"
import { useSettings, type Engine } from "@/lib/use-settings"
import { LoadoutSelector } from "@/components/loadout-selector"
import { ResultsLayoutSelector } from "@/components/results-layout-selector"
import QuickLinksGrid from "@/components/quick-links-grid"
import { toast } from "sonner";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { StreamLogDisplay } from "@/components/stream-log-display";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Define type for log messages
export interface LogMessage { 
  type: 'log_message' | 'engine_status' | 'final_result' | 'error' | 'llm_output' | 'decision';
  data: any; // Keep data flexible, specific parsing happens on use
  timestamp: number;
}

export default function Home() {
  const [knowledgeSource, setKnowledgeSource] = useState("web")
  const [query, setQuery] = useState("")
  const router = useRouter()
  const { settings, activeEngineLoadoutId, availableEngines, loading, isInitialLoadComplete } = useSettings()
  
  const getActiveEngineString = (): string | null => {
    if (!isInitialLoadComplete || !settings.engines || !availableEngines || availableEngines.length === 0) {
        console.warn("[getActiveEngineString] Prerequisites not met (settings/engines load incomplete).");
        return null;
    }

    const currentActiveId = activeEngineLoadoutId ?? 'starter';
    let activeConfig: Engine[] = [];

    // --- Determine activeConfig (handles starter vs saved loadout) ---
    if (currentActiveId === 'starter') {
        activeConfig = availableEngines.map(engine => ({
            ...engine,
            // Define starter enabled engines here (e.g., google + duckduckgo)
            enabled: engine.id === 'google' || engine.id === 'duckduckgo', 
            weight: 1.0, // Default weight
        }));
    } else {
        const savedLoadout = settings.engines.loadouts?.find(l => l.id === currentActiveId);
        if (savedLoadout?.config) {
            const loadoutConfig = savedLoadout.config || [];
            // Map available engines using the saved loadout config
            activeConfig = availableEngines.map(availableEngine => {
                const engineFromLoadout = loadoutConfig.find(le => String(le.id) === String(availableEngine.id));
                return {
                    ...availableEngine,
                    enabled: engineFromLoadout?.enabled ?? false,
                    // Keep other properties if needed, but primarily need id & categories from availableEngine
                };
            });
        } else {
            console.warn(`[getActiveEngineString] Could not find config for active loadout ID: ${currentActiveId}.`);
            return null; // Cannot proceed without a valid loadout config
        }
    }

    // --- Filter enabled engines for 'general' category --- 
    const targetCategory = 'general'; // Hardcoded for home page search -> general
    const enabledAndGeneralEngineIds = activeConfig.filter(engine => {
        if (!engine.enabled) return false; // Skip disabled engines
        
        const supportedCategories = engine.categories || [];
        // Engine supports 'general' if it includes 'general' OR 'web'
        return supportedCategories.includes(targetCategory) || supportedCategories.includes('web');
    }).map(engine => engine.id);

    console.log(`[getActiveEngineString] Filtered engines for category '${targetCategory}':`, enabledAndGeneralEngineIds);

    if (currentActiveId === 'sl-ai') {
      return 'sl-ai-placeholder' // Still harmless, indicates SLAI mode
    }

    return enabledAndGeneralEngineIds.length > 0 ? enabledAndGeneralEngineIds.join(",") : null;
  }

  const handleSearchSubmit = async (submittedQuery: string) => {
    const trimmedQuery = submittedQuery.trim();
    if (!trimmedQuery || !isInitialLoadComplete) {
      console.log("[handleSearchSubmit] Aborting: Query empty or initial load not complete.");
      return;
    }

    if (knowledgeSource === 'ai') {
      console.log(`[handleSearchSubmit] AI source selected. Navigating to chat with query: "${trimmedQuery}"`);
      router.push(`/chat?initialMessage=${encodeURIComponent(trimmedQuery)}`);
      return;
    }

    // Build base URLSearchParams for search
    const baseParams = new URLSearchParams({
      q: trimmedQuery,
      source: knowledgeSource,
      category: 'general',
      pageno: '1',
    });

    if (knowledgeSource === "web") {
      if (activeEngineLoadoutId === 'sl-ai') {
        console.log(`[handleSearchSubmit] AI Dynamic active. Redirecting to /slai for query: "${trimmedQuery}"`);
        router.push(`/slai?q=${encodeURIComponent(trimmedQuery)}`);
        return;
      } else {
        // Standard web search (non-SLAI loadout)
        const engineString = getActiveEngineString();
        if (engineString) {
          console.log(`[handleSearchSubmit] Web search - Using engines: ${engineString}`);
          baseParams.set('engines', engineString);
          router.push(`/search?${baseParams.toString()}`);
        } else {
           console.error("[handleSearchSubmit] Web search - Could not determine active engines. Aborting navigation.");
           toast.error("Could not determine active engines for the selected loadout."); 
        }
      }
    } else {
        // Handle other knowledge sources (obsidian, localFiles etc.)
        console.log(`[handleSearchSubmit] Using knowledgeSource: ${knowledgeSource}.`);
        baseParams.delete('engines'); 
        router.push(`/search?${baseParams.toString()}`);
    }
  }

  const headerText = isInitialLoadComplete
    ? settings.general?.instanceName || "SlySearch"
    : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-3xl space-y-8 relative">
        <div className="flex justify-center mb-8">
          <Logo size="large" text={headerText} />
        </div>

        <div> 
          <SearchBar 
            placeholder="Search the web..." 
            onSearch={handleSearchSubmit} 
          />
        </div>

        <div className={`flex items-center justify-between px-1 mt-4`}> 
           <div className="flex-grow max-w-[240px]">
             {isInitialLoadComplete ? (
             <TheLocalLagoon value={knowledgeSource} onChange={setKnowledgeSource} startExpanded={true} />
             ) : (
               <div className="h-10 w-full rounded-md bg-muted/50 animate-pulse"></div>
             )}
           </div>
 
           <div className="flex items-center gap-2">
             {isInitialLoadComplete ? (
               <>
                 <div className="flex items-center">
                   <ResultsLayoutSelector compact={true} />
                 </div>
                 <div className="flex items-center">
                   <LoadoutSelector type="engines" compact={true} />
                 </div>
               </>
             ) : (
               <div className="h-8 w-56 rounded-md bg-muted/50 animate-pulse"></div>
             )}
  
             <QuickSettingsMenu compact={true} />
           </div>
         </div>
 
         {isInitialLoadComplete && (
           <div> 
             <QuickLinksGrid />
            </div>
         )}
      </div>

      <footer className="w-full text-center p-4 absolute bottom-0">
        {/* Existing footer content */}
      </footer>
    </main>
  )
}
