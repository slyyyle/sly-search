"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { SearchBar } from "@/components/search-bar"
import { Search } from "lucide-react"
import Logo from "@/components/logo"
import TheLocalLagoon from "@/components/the-local-lagoon"
import { QuickSettingsMenu } from "@/components/quick-settings-menu"
import { useSettings, type Engine } from "@/lib/use-settings"
import { LoadoutSelector } from "@/components/loadout-selector"
import { ResultsLayoutSelector } from "@/components/results-layout-selector"
import QuickLinksGrid from "@/components/quick-links-grid"

export default function Home() {
  const [knowledgeSource, setKnowledgeSource] = useState("normal")
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

    return enabledAndGeneralEngineIds.length > 0 ? enabledAndGeneralEngineIds.join(",") : null;
  }

  const handleSearchSubmit = (submittedQuery: string) => {
    if (!submittedQuery.trim() || !isInitialLoadComplete) {
        console.log("[handleSearchSubmit] Aborting: Query empty or initial load not complete.");
        return; 
    }

    if (knowledgeSource === 'ai') {
        console.log(`[handleSearchSubmit] AI source selected. Navigating to chat with query: "${submittedQuery}"`);
        router.push(`/chat?initialMessage=${encodeURIComponent(submittedQuery)}`); 
        return;
    }

    let searchUrl = `/search?q=${encodeURIComponent(submittedQuery)}&source=${knowledgeSource}&category=general`
    let canProceed = true;

    if (knowledgeSource === "normal") {
      const engineString = getActiveEngineString();
      if (engineString) {
        searchUrl += `&engines=${encodeURIComponent(engineString)}`
        console.log(`[handleSearchSubmit] Web search - Using engines: ${engineString}`);
      } else {
         console.error("[handleSearchSubmit] Web search - Could not determine active engines. Aborting navigation.");
         canProceed = false; 
      }
    }
    
    if (canProceed) {
        console.log(`[handleSearchSubmit] Navigating to: ${searchUrl}`)
        router.push(searchUrl)
    } else {
        console.log("[handleSearchSubmit] Navigation blocked due to missing engines.");
    }
  }

  const headerText = isInitialLoadComplete
    ? settings.general?.instanceName || "SlySearch"
    : undefined;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-3xl space-y-8">
        <div className="flex justify-center mb-8">
          <Logo size="large" text={headerText} />
        </div>

        <SearchBar 
          placeholder="Search the web..." 
          onSearch={handleSearchSubmit}
        />

        <div className="flex items-center justify-between px-1 mt-4">
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
                  <span className="mr-1">📋</span>
                  <ResultsLayoutSelector compact={true} />
                </div>
                <div className="flex items-center">
                  <span className="mr-1">🚀</span>
                  <LoadoutSelector type="engines" compact={true} />
                </div>
              </>
            ) : (
              <div className="h-8 w-56 rounded-md bg-muted/50 animate-pulse"></div>
            )}

            <QuickSettingsMenu compact={true} />
          </div>
        </div>

        {/* Quick Links Grid */}
        {isInitialLoadComplete && (
          <QuickLinksGrid />
        )}
      </div>
    </main>
  )
}
