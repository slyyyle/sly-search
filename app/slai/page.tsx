"use client"

import type React from "react" // Keep React for type if needed, though often implicit
import { useState, useRef, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation" // Added useSearchParams
// SearchBar might not be needed if query is only from URL, or a simplified one
// import { SearchBar } from "@/components/search-bar" 
import { Loader2, RefreshCw } from "lucide-react" // Keep if used in StreamLogDisplay or loading states
import Logo from "@/components/logo" // If you want the logo on this page
import { useSettings, type Engine } from "@/lib/use-settings" // If needed for engine details, or category filtering
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { StreamLogDisplay } from "@/components/stream-log-display";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge"; // If used directly for engine badges, or StreamLogDisplay handles it
import { toast } from "sonner"; // If you plan to use toasts for errors

// Define type for log messages (moved from app/page.tsx)
export interface LogMessage { 
  type: 'log_message' | 'engine_status' | 'final_result' | 'error' | 'llm_output' | 'decision';
  data: any; 
  timestamp: number;
}

export default function SlaiPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQueryFromUrl = searchParams.get("q") || "";

  // SLAI specific states, moved from app/page.tsx
  const [query, setQuery] = useState(initialQueryFromUrl); // Query for this page
  const [includedEngines, setIncludedEngines] = useState<string[]>([])
  const { settings, availableEngines, loading: settingsLoading, isInitialLoadComplete } = useSettings(); // Assuming settings might be needed for engine details
  
  const [logMessages, setLogMessages] = useState<LogMessage[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const streamAbortControllerRef = useRef<AbortController | null>(null);
  const [sseSelectionPhase, setSseSelectionPhase] = useState<'idle' | 'streaming' | 'awaitingConfirmation' | 'navigating'>('idle');
  const [finalEnginesForConfirmation, setFinalEnginesForConfirmation] = useState<string[] | null>(null);
  const [currentEngineProgress, setCurrentEngineProgress] = useState<string | null>(null);
  const [isEvaluatingPhase, setIsEvaluatingPhase] = useState(false);
  const [rejectedEngines, setRejectedEngines] = useState<string[]>([]);
  const [candidateEngines, setCandidateEngines] = useState<string[]>([]);
  const [showCandidatePane, setShowCandidatePane] = useState(false);
  const [isInitialStreamAttempted, setIsInitialStreamAttempted] = useState(false);
  const [refinedCategoriesFromSSE, setRefinedCategoriesFromSSE] = useState<string[] | null>(null);

  // Effect to auto-start SSE streaming when page loads with a query
  useEffect(() => {
    // Ensure settings (especially availableEngines) are loaded before starting SSE
    if (initialQueryFromUrl && isInitialLoadComplete && sseSelectionPhase === 'idle' && !isInitialStreamAttempted && availableEngines.length > 0) {
      console.log(`[SLAI Page] Auto-starting SSE for query: "${initialQueryFromUrl}"`);
      setIsInitialStreamAttempted(true);
      
      // Reset states
      setFinalEnginesForConfirmation(null);
      setCandidateEngines([]);
      setLogMessages([]);
      setIncludedEngines([]);
      setRejectedEngines([]);
      setIsEvaluatingPhase(false);
      setShowCandidatePane(false);
      setCurrentEngineProgress(null);
      setStreamError(null);
      setSseSelectionPhase('streaming');
      setRefinedCategoriesFromSSE(null);

      const controller = new AbortController();
      streamAbortControllerRef.current = controller;

      fetchEventSource('/api/v1/engines/select', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream'
        },
        body: JSON.stringify({ query: initialQueryFromUrl }), // Use query from URL
        signal: controller.signal,
        openWhenHidden: true,
        async onopen(response) {
          if (response.ok) {
            console.log("[SSE /slai] Connection opened.");
            setLogMessages(prev => [...prev, { type: 'log_message', data: { message: 'AI Connection established...' }, timestamp: Date.now() }]);
          } else {
            console.error(`[SSE /slai] Connection failed: ${response.status} ${response.statusText}`);
            let errorMsg = `Connection failed: ${response.status}`;
            try {
              const errData = await response.json();
              errorMsg = errData.detail || errData.message || errorMsg;
            } catch (e) { /* Ignore */ }
            setStreamError(errorMsg);
            setSseSelectionPhase('idle');
            // Potentially throw to trigger onerror, but setting error state might be enough
          }
        },
        onmessage(event) {
           try {
               const parsedData = JSON.parse(event.data);
               console.log(`[SSE /slai Received] Event Type: '${event.event}', Data:`, parsedData);
               
               if (event.event === 'log_message' && parsedData.step === 5 && parsedData.status === 'start') {
                 setIsEvaluatingPhase(true);
                 setShowCandidatePane(true);
                 if (parsedData.candidate_engines && Array.isArray(parsedData.candidate_engines)) {
                   setCandidateEngines(parsedData.candidate_engines);
                 } else {
                    console.warn("[SSE /slai] Backend did not provide candidate_engines. Consider fallback.");
                 }
               }
               
               if (event.event === 'log_message' && parsedData.step === 3 && parsedData.status === 'complete') {
                 if (parsedData.refined_categories && Array.isArray(parsedData.refined_categories)) {
                   console.log("[SSE /slai] Captured refined categories:", parsedData.refined_categories);
                   setRefinedCategoriesFromSSE(parsedData.refined_categories);
                 }
               }
               
               if (event.event === 'log_message' && parsedData.step === 5 && parsedData.status === 'progress') {
                 const rawMsg = parsedData.message || '';
                 const afterColon = rawMsg.split(': ')[1] || rawMsg;
                 const engineName = afterColon.split(' (')[0];
                 setCurrentEngineProgress(engineName);
                 return; 
               } else if (event.event === 'log_message' && parsedData.step === 5 && parsedData.status === 'end') {
                  setCurrentEngineProgress(null);
               } else if (event.event === 'log_message' && parsedData.step !== 5) {
                  setCurrentEngineProgress(null);
               }

               if (event.event === 'engine_status') {
                 if (parsedData.status === 'selected') {
                   setIncludedEngines(prev => [...new Set([...prev, parsedData.engine_id])]);
                   setRejectedEngines(prev => prev.filter(id => id !== parsedData.engine_id));
                 } else if (parsedData.status === 'rejected') {
                   setRejectedEngines(prev => [...new Set([...prev, parsedData.engine_id])]);
                   setIncludedEngines(prev => prev.filter(id => id !== parsedData.engine_id));
                 }
               }
               
               if (event.event === 'llm_output' || event.event === 'decision') {
                   setLogMessages(prev => [...prev, { type: event.event as LogMessage['type'], data: parsedData, timestamp: parsedData.timestamp || Date.now() }]);
                   return; 
               }

               if (event.event === 'final_result') {
                 const finalEngines = parsedData.selected_engines || [];
                 if (finalEngines.length > 0) {
                   console.log(`[SSE /slai] Final engines for confirmation: ${finalEngines.join(',')}.`);
                   setFinalEnginesForConfirmation(finalEngines);
                   setSseSelectionPhase('awaitingConfirmation');
                 } else {
                   console.warn("[SSE /slai] Final result received but no engines.");
                   setStreamError("AI selection completed but no engines were chosen.");
                   setSseSelectionPhase('idle'); 
                 }
               } else if (event.event !== 'engine_status' && event.event !== 'llm_output' && event.event !== 'decision' && !(event.event === 'log_message' && parsedData.step === 5 && parsedData.status === 'progress') ) {
                  setLogMessages(prev => [...prev, { type: event.event as LogMessage['type'], data: parsedData, timestamp: parsedData.timestamp || Date.now() }]);
               }
           } catch (e) {
               console.error("[SSE /slai] Error parsing message:", e, "Raw data:", event.data);
           }
        },
        onclose() {
          console.log("[SSE /slai] Connection closed.");
          if (sseSelectionPhase === 'streaming') { // If closed prematurely by server or network
            setSseSelectionPhase('idle');
            setStreamError("Connection closed unexpectedly during engine selection.");
          }
          setCurrentEngineProgress(null);
        },
        onerror(err) {
          console.error("[SSE /slai] Error:", err);
          if (err.name === 'AbortError') {
            // This can happen if user navigates away or cancels
            setStreamError("Search engine selection was cancelled.");
          } else {
            setStreamError(err.message || "An unknown error occurred during AI engine selection.");
          }
          setSseSelectionPhase('idle');
          setCurrentEngineProgress(null);
        }
      });
    }
  }, [initialQueryFromUrl, isInitialLoadComplete, router, isInitialStreamAttempted, availableEngines.length]);

  // Cleanup effect for SSE stream
  useEffect(() => {
    return () => {
      if (streamAbortControllerRef.current) {
        console.log("[SLAI Page Cleanup] Aborting active SSE stream on component unmount.");
        streamAbortControllerRef.current.abort();
        streamAbortControllerRef.current = null;
      }
    };
  }, []);

  const handleConfirmSearch = () => {
    if (finalEnginesForConfirmation && 
        finalEnginesForConfirmation.length > 0 && 
        refinedCategoriesFromSSE && 
        availableEngines && 
        availableEngines.length > 0
      ) {

      // Construct Engine Sets per Category
      const constructedEngineSets: { category: string; engines: string[] }[] = [];
      refinedCategoriesFromSSE.forEach(rCategory => {
        const enginesForThisCategory = finalEnginesForConfirmation.filter(engId => {
          const engineDetail = availableEngines.find(e => e.id === engId);
          return engineDetail?.categories?.includes(rCategory);
        });
        if (enginesForThisCategory.length > 0) {
          constructedEngineSets.push({ category: rCategory, engines: enginesForThisCategory });
        }
      });

      let finalEngineSets = constructedEngineSets;
      // Handle Fallback (No Matches or empty refined categories)
      if (finalEngineSets.length === 0) {
        console.warn("[SLAI Page] No engines matched refined categories, or no refined categories. Falling back to general.");
        finalEngineSets = [{ category: 'general', engines: finalEnginesForConfirmation || [] }];
      }

      const initialCategory = (refinedCategoriesFromSSE && refinedCategoriesFromSSE.length > 0 && finalEngineSets.find(s => s.category === refinedCategoriesFromSSE[0]))
                              ? refinedCategoriesFromSSE[0]
                              : finalEngineSets[0]?.category || 'general'; // Fallback to first set's category or general

      // +++ Find engines for the initial category +++
      const initialEngineSet = finalEngineSets.find(set => set.category === initialCategory);
      const initialEnginesString = (initialEngineSet && initialEngineSet.engines.length > 0) 
                                   ? initialEngineSet.engines.join(',') 
                                   : null;

      const slaiData = { 
        query: query, // current query from state, should match initialQueryFromUrl
        engineSets: finalEngineSets, 
        initialCategory 
      };

      try {
        sessionStorage.setItem('slaiSearchConfig', JSON.stringify(slaiData));
        console.log("[SLAI Page] Saved to sessionStorage:", slaiData);
        setSseSelectionPhase('navigating');
        // +++ Construct URL with initial engines +++
        const searchUrlParams = new URLSearchParams();
        searchUrlParams.set('q', query);
        searchUrlParams.set('category', initialCategory);
        searchUrlParams.set('slai_session', 'true');
        if (initialEnginesString) {
          searchUrlParams.set('engines', initialEnginesString);
        }
        // Note: source=web and pageno=1 are added by the search page logic itself, 
        // but we could add them here too if needed for absolute clarity.
        const finalUrl = `/search?${searchUrlParams.toString()}`;
        console.log(`[SLAI Page] Navigating to: ${finalUrl}`);
        router.push(finalUrl);

      } catch (error) {
        console.error("[SLAI Page] Error saving to sessionStorage:", error);
        setStreamError("Could not save search configuration. Please try again.");
        setSseSelectionPhase('idle'); // Revert to idle to allow retry or show error
        return; // Stop execution
      }
      
      streamAbortControllerRef.current?.abort();
      streamAbortControllerRef.current = null;
      setFinalEnginesForConfirmation(null);
      setRefinedCategoriesFromSSE(null);
      // setIsInitialStreamAttempted(false); // Allow re-attempts if user navigates back and then here again?
                                          // For now, keep it true to prevent auto-restart on this instance.

    } else {
      console.warn("[SLAI Page] Confirm search called but prerequisites not met:", 
        { finalEnginesForConfirmation, refinedCategoriesFromSSE, availableEngines }
      );
      setStreamError("Cannot start search: missing engine data or refined categories.");
      setSseSelectionPhase('idle');
    }
  };

  const handleCancelSSE = () => {
    console.log("[SLAI Page] User cancelled engine selection. Navigating to home page.");
    streamAbortControllerRef.current?.abort();
    streamAbortControllerRef.current = null;
    setSseSelectionPhase('idle');
    setFinalEnginesForConfirmation(null);
    setRefinedCategoriesFromSSE(null);
    router.push('/'); // Navigate to the root page
  };

  if (!isInitialLoadComplete || settingsLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading settings...</p>
      </div>
    );
  }
  
  if (!initialQueryFromUrl && sseSelectionPhase === 'idle' && !isInitialStreamAttempted) {
     return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
        <div className="text-center">
          <Logo size="large" text={settings.general?.instanceName || "SlySearch SLAI"} />
          <p className="mt-4 text-muted-foreground">No search query provided.</p>
          <Button onClick={() => router.push('/')} className="mt-4">Go to Homepage</Button>
        </div>
      </main>
     )
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-4 md:p-8 pt-16 md:pt-24"> {/* Added more padding top */}
      <div className="w-full max-w-4xl mx-auto">
        <div className="text-center mb-6">
           <h1 className="text-2xl font-semibold">AI Engine Selection</h1>
           <p className="text-muted-foreground">Query: "{query}"</p>
        </div>

        {/* UI for SSE Streaming Log and Engine Status */}
        {/* This section is always visible if sseSelectionPhase is not 'idle' or if there's an initial query */}
        {(sseSelectionPhase !== 'idle' || initialQueryFromUrl) && (
          <div className="w-full p-4 border rounded-lg shadow-md bg-background/80 backdrop-blur-sm mb-6">
            <StreamLogDisplay 
              messages={logMessages} 
              error={streamError}
              includedEngines={includedEngines}
              rejectedEngines={rejectedEngines}
              candidateEngines={candidateEngines}
              showEngineBar={showCandidatePane}
              engineProgress={currentEngineProgress}
              maxHeight="calc(100vh - 300px)" // Adjust max height as needed
            />
            {/* --- MODIFIED: Condition for displaying Search/Cancel buttons --- */}
            {/* Show buttons if the initial stream has been attempted and we are not actively streaming or navigating */}
            {(isInitialStreamAttempted && (sseSelectionPhase === 'awaitingConfirmation' || sseSelectionPhase === 'idle')) && (
              <div className="mt-4 flex justify-end space-x-2 p-4 border-t border-border/40">
                <Button variant="outline" onClick={handleCancelSSE}>Cancel & Return Home</Button>
                <Button 
                  onClick={handleConfirmSearch} 
                  disabled={!finalEnginesForConfirmation || finalEnginesForConfirmation.length === 0}
                >
                  Search with Selected ({finalEnginesForConfirmation ? finalEnginesForConfirmation.length : 0})
                </Button>
              </div>
            )}
            {/* Message if idle due to error or no query after attempting stream - This might be redundant or need adjustment based on new button visibility */}
            {/* Ensure this doesn't conflict with the buttons above if streamError is also present */}
            {sseSelectionPhase === 'idle' && streamError && isInitialStreamAttempted && 
             !(isInitialStreamAttempted && (sseSelectionPhase === 'awaitingConfirmation' || sseSelectionPhase === 'idle')) /* Avoid double rendering if buttons are already shown */ && (
                 <div className="mt-4 text-center text-destructive">
                    <p>{streamError}</p>
                    <Button onClick={() => router.push('/')} className="mt-2">Go to Homepage</Button>
                 </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
} 