'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useSettings, type Engine } from "@/lib/use-settings";

// Placeholder for a loading component - replace with your actual UI
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
        {/* You can replace this with a proper spinner SVG or component */}
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto mb-4"></div>
        <h1 className="text-2xl font-semibold mb-2">Loading your search settings...</h1>
        <p className="text-lg text-gray-600">Welcome back to the lagoon!</p>
    </div>
  </div>
);

export default function SearchRedirectPage() {
  console.log("SearchRedirect: Component rendering...");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { settings, availableEngines, activeEngineLoadoutId, isInitialLoadComplete } = useSettings();

  useEffect(() => {
    console.log("SearchRedirect: Redirect useEffect running...");
    console.log(`SearchRedirect: Current state - isInitialLoadComplete: ${isInitialLoadComplete}, settings loaded: ${!!settings}`);
    
    if (!isInitialLoadComplete || !settings || !availableEngines || availableEngines.length === 0) {
        console.log("SearchRedirect: Waiting for settings and engines to load...");
        return;
    }

    const query = searchParams.get('q');
    const pageNo = searchParams.get('pageno') || '1'; 
    const source = searchParams.get('source') || 'web';
    console.log(`SearchRedirect: Params - query: ${query}, pageNo: ${pageNo}, source: ${source}`);

    if (!query) {
      console.error("SearchRedirect: *** ERROR - No query parameter found.");
      router.replace('/'); 
      return;
    }

    const targetCategory = searchParams.get('category') || 'general';
    console.log(`SearchRedirect: Using target category: ${targetCategory}`);

    let engineString: string | null = null;
    const currentActiveId = activeEngineLoadoutId ?? 'starter';
    let activeConfig: Engine[] = [];

    // Get the active loadout configuration
    if (currentActiveId === 'starter') {
        activeConfig = availableEngines.map(engine => ({ 
            ...engine, 
            enabled: engine.id === 'google' || engine.id === 'duckduckgo' 
        }));
    } else {
        const savedLoadout = settings.engines?.loadouts?.find(l => l.id === currentActiveId);
        if (savedLoadout?.config) {
            const loadoutConfig = savedLoadout.config || [];
            activeConfig = availableEngines.map(availableEngine => {
                const engineFromLoadout = loadoutConfig.find(le => String(le.id) === String(availableEngine.id));
                return { 
                    ...availableEngine, 
                    enabled: engineFromLoadout?.enabled ?? false,
                    weight: engineFromLoadout?.weight ?? 1.0,
                    timeout: engineFromLoadout?.timeout ?? availableEngine.timeout ?? 3.0,
                    shortcut: engineFromLoadout?.shortcut ?? availableEngine.shortcut ?? "",
                    categories: engineFromLoadout?.categories && engineFromLoadout.categories.length > 0 
                        ? engineFromLoadout.categories 
                        : availableEngine.categories ?? ["general"]
                };
            });
        } else {
            console.warn(`SearchRedirect: Could not find config for active loadout ID: ${currentActiveId}. Falling back to starter config.`);
            activeConfig = availableEngines.map(engine => ({ 
                ...engine, 
                enabled: engine.id === 'google' || engine.id === 'duckduckgo' 
            }));
        }
    }

    // Get all enabled engines from the active config that support the current category
    const enabledEngineIds = activeConfig
        .filter(engine => {
            if (!engine.enabled) return false;
            const supportedCategories = engine.categories || [];
            return supportedCategories.includes(targetCategory);
        })
        .map(engine => engine.id);

    if (enabledEngineIds.length > 0) {
        engineString = enabledEngineIds.join(",");
        console.log(`SearchRedirect: Determined engines for category '${targetCategory}':`, engineString);
    } else {
        console.warn(`SearchRedirect: No enabled engines found for category '${targetCategory}' in the active loadout.`);
    }

    let finalUrlString = '';
    try {
        const finalUrl = new URL('/search', window.location.origin);
        finalUrl.searchParams.set('q', query);
        finalUrl.searchParams.set('pageno', pageNo);
        finalUrl.searchParams.set('source', source);
        finalUrl.searchParams.set('category', targetCategory);

        if (engineString) {
            finalUrl.searchParams.set('engines', engineString);
        } else {
            console.warn("SearchRedirect: Proceeding to /search without specific engines parameter.");
        }

        finalUrlString = finalUrl.toString();
        console.log(`SearchRedirect: Constructed final URL: ${finalUrlString}`);

    } catch (urlError) {
        console.error("SearchRedirect: *** ERROR constructing final URL:", urlError);
        router.replace('/'); 
        return;
    }
    
    try {
        console.log(`SearchRedirect: Attempting router.replace with: ${finalUrlString}`); 
        router.replace(finalUrlString);
    } catch (routerError) {
        console.error("SearchRedirect: *** ERROR calling router.replace:", routerError);
    }

  }, [searchParams, router, settings, isInitialLoadComplete, availableEngines, activeEngineLoadoutId]);

  return <LoadingSpinner />;
} 