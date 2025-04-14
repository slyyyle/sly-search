"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, ArrowLeft, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import Logo from "@/components/logo"
import SearchResults from "@/components/search-results"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import TheSurfSelector from "@/components/the-surf-selector"
import { QuickSettingsMenu } from "@/components/quick-settings-menu"
import { InfoDialog } from "@/components/info-dialog"
import { useSettings } from "@/lib/use-settings"

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { settings, isInitialLoadComplete } = useSettings()

  const initialQuery = searchParams.get("q") || ""
  const initialSource = searchParams.get("source") || "normal"

  const [query, setQuery] = useState(initialQuery)
  const [knowledgeSource, setKnowledgeSource] = useState(initialSource)
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("all")
  const [usingMockData, setUsingMockData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!query.trim()) return

    setIsLoading(true)
    setError(null)
    setUsingMockData(false)

    try {
      // Get settings from the settings context
      const resultsPerPage = settings.general?.resultsPerPage || "10"
      const safeSearch = settings.general?.safeSearch || "0"
      const language = settings.general?.defaultLanguage || "all"
      const openNewTab = settings.general?.openNewTab !== false

      // Build the search URL with all relevant parameters
      const searchUrl = new URL("/api/search", window.location.origin)
      searchUrl.searchParams.append("q", query)
      searchUrl.searchParams.append("source", knowledgeSource)
      searchUrl.searchParams.append("resultsPerPage", resultsPerPage)
      searchUrl.searchParams.append("safesearch", safeSearch)

      // Only add language if it's not auto
      if (language && language !== "auto") {
        searchUrl.searchParams.append("language", language)
      }

      // Only add category if it's not all
      if (activeTab && activeTab !== "all") {
        searchUrl.searchParams.append("category", activeTab)
      }

      // Add results_on_new_tab parameter based on openNewTab setting
      searchUrl.searchParams.append("results_on_new_tab", openNewTab ? "1" : "0")

      // Add image_proxy parameter if available in settings
      if (settings.privacy?.proxyImages !== undefined) {
        searchUrl.searchParams.append("image_proxy", settings.privacy.proxyImages ? "true" : "false")
      }

      // Add RAG mode if enabled
      if (settings.general?.ragEnabled) {
        searchUrl.searchParams.append("rag", "enabled")
      }

      // Add engines if we have specific ones enabled
      if (settings.engines?.list) {
        // Get all enabled engines
        const enabledEngines = settings.engines.list.filter((engine) => engine.enabled)

        if (enabledEngines.length > 0) {
          // For basic engine selection (just names)
          const engineNames = enabledEngines.map((engine) => engine.name.toLowerCase()).join(",")
          searchUrl.searchParams.append("engines", engineNames)

          // Handle engine weights if supported by the API
          // SearXNG supports weights via the "engine_weights" parameter
          const engineWeights = enabledEngines.reduce((weights: Record<string, number>, engine) => {
            // Only include engines with non-default weights (not 1.0)
            if (engine.weight !== 1.0) {
              weights[engine.name.toLowerCase()] = engine.weight
            }
            return weights
          }, {} as Record<string, number>)

          // Only add engine_weights if we have non-default weights
          if (Object.keys(engineWeights).length > 0) {
            searchUrl.searchParams.append("engine_weights", JSON.stringify(engineWeights))
          }

          // Log the engines being used for debugging
          console.log(
            `Using ${enabledEngines.length} engines with weights:`,
            enabledEngines.map((e) => `${e.name}(${e.weight})`).join(", "),
          )
        }
      }

      console.log(`Fetching search results from: ${searchUrl.toString()}`)

      const response = await fetch(searchUrl.toString())

      if (!response.ok) {
        throw new Error(`Search failed with status: ${response.status}`)
      }

      const data = await response.json()

      // Check if we're using mock data
      if (data._mock) {
        setUsingMockData(true)
      }

      // Log to verify the correct number of results
      console.log(`Received ${data.results?.length || 0} results of ${resultsPerPage} requested`)

      setResults(data)
    } catch (error) {
      console.error("Search error:", error)
      setError("Failed to perform search. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }

  // Re-run search when resultsPerPage setting changes
  useEffect(() => {
    if (query.trim() && results) {
      handleSearch()
    }
  }, [settings.general?.resultsPerPage])

  // Re-run search when activeTab changes
  useEffect(() => {
    if (query.trim()) {
      handleSearch()
    }
  }, [activeTab])

  useEffect(() => {
    if (initialQuery) {
      handleSearch()
    }
  }, [initialQuery])

  // Determine header text only when load is complete
  const headerText = isInitialLoadComplete
    ? settings.general?.instanceName || "SlySearch"
    : undefined; // Pass undefined if not loaded

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

          <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                type="text"
                placeholder="Search the web..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-9 py-2 bg-background/60 google-gradient-border"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs search-hint">
                Press Enter to Search
              </div>
            </div>
          </form>

          <div className="flex items-center gap-2">
            <div className="w-[180px]">
              <TheSurfSelector
                value={knowledgeSource}
                onChange={setKnowledgeSource}
                compact={true}
                showOnlySelected={true}
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Quick Settings Menu */}
              <QuickSettingsMenu />
              <InfoDialog />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container px-4 py-6">
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

        {/* Category Tabs */}
        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-background/60 google-gradient-border">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="videos">Videos</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="maps">Maps</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search Results */}
        <div className="search-results-container rounded-lg p-4">
          <SearchResults
            isLoading={isLoading}
            results={results}
            query={query}
            knowledgeSource={knowledgeSource}
            openInNewTab={settings.general?.openNewTab !== false}
          />

          {/* Display the current results per page setting for debugging */}
          {results && (
            <div className="text-xs text-muted-foreground mt-4 text-right">
              Showing {results.results?.length || 0} results (Results per page:{" "}
              {settings.general?.resultsPerPage || "10"}){usingMockData && " - Using mock data"}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
