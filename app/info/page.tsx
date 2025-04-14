"use client"

import { useState } from "react"
import { ArrowLeft, ChevronDown, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import Logo from "@/components/logo"
import { TerminalView } from "@/components/terminal-view"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function InfoPage() {
  // State for collapsible sections
  const [openSections, setOpenSections] = useState({
    implemented: false,
    partial: false,
    priorities: false,
  })

  // Terminal entries
  const terminalEntries = [
    {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      category: "API",
      content:
        'API Fetch Behavior:\nCurrently, each API call retrieves only one page of results at a time with the number of results limited by the "results per page" setting. SearXNG handles pagination server-side, only returning the specific page of results requested.',
    },
    {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      category: "API",
      content:
        "Batch processing would require making multiple sequential or parallel API calls to gather large result sets, potentially with a caching layer to reduce redundant requests. This approach would enable advanced features like LLM-powered search enhancements while maintaining reasonable response times for initial results display.",
    },
    {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      category: "Structure",
      content:
        "Response Structure:\nThe complete SearXNG response includes query information, results array, answers, corrections, infoboxes, suggestions, and engine performance data.",
    },
    {
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 19),
      category: "Response",
      content:
        "Result Object:\nEach result contains title, link, snippet, source, engines, score, category, and various metadata depending on the result type (images, videos, news, etc.).",
    },
  ]

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex items-center h-16 px-4">
          <Link href="/" className="mr-4">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Logo size="small" />
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">SlySearch Project Information</h1>

          {/* Project Overview - Regular section, not collapsible */}
          <section className="mb-8 p-4 bg-gray-900/20 border border-gray-800 rounded-lg">
            <h2 className="text-2xl font-semibold mb-3">Project Overview</h2>
            <p className="text-muted-foreground">
              SlySearch is a modern search interface built on top of SearXNG, providing enhanced search capabilities,
              customizable engines, and knowledge source integration. The project aims to create a privacy-focused,
              feature-rich search experience with AI-powered enhancements.
            </p>
          </section>

          {/* Terminal View */}
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">API & Technical Information</h2>
            <TerminalView entries={terminalEntries} className="mb-4" />
          </section>

          <div className="space-y-6">
            {/* What's Implemented - Collapsible */}
            <Collapsible
              open={openSections.implemented}
              onOpenChange={() => {
                setOpenSections((prev) => ({
                  ...prev,
                  implemented: !prev.implemented,
                }))
              }}
              className="border border-gray-800 rounded-lg overflow-hidden"
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-gray-900/50 cursor-pointer hover:bg-gray-900/70 transition-colors">
                  <h2 className="text-2xl font-semibold">What's Implemented</h2>
                  {openSections.implemented ? (
                    <ChevronDown className="h-5 w-5" />
                  ) : (
                    <ChevronRight className="h-5 w-5" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-gray-900/20 border-t border-gray-800">
                <ul className="space-y-4">
                  <li className="space-y-2">
                    <h4 className="font-semibold">Core Search Functionality</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>Basic search interface (home and results pages)</li>
                      <li>Backend proxy to SearXNG</li>
                      <li>Results rendering with proper formatting</li>
                      <li>Settings management system with localStorage persistence</li>
                    </ul>
                  </li>
                  <li className="space-y-2">
                    <h4 className="font-semibold">UI Components</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>Google-inspired design system with custom styling</li>
                      <li>Settings pages with multiple categories</li>
                      <li>"The Surf" selector for knowledge sources</li>
                      <li>Search results display in list format</li>
                    </ul>
                  </li>
                  <li className="space-y-2">
                    <h4 className="font-semibold">Settings Management</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>Comprehensive settings UI</li>
                      <li>Engine configuration with weights</li>
                      <li>Loadout system for saving configurations</li>
                      <li>Privacy settings</li>
                    </ul>
                  </li>
                  <li className="space-y-2">
                    <h4 className="font-semibold">Backend Integration</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>FastAPI backend that proxies to SearXNG</li>
                      <li>Parameter handling and transformation</li>
                      <li>Error handling and fallback to mock data</li>
                    </ul>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* What's Partially Implemented - Collapsible */}
            <Collapsible
              open={openSections.partial}
              onOpenChange={() => {
                setOpenSections((prev) => ({
                  ...prev,
                  partial: !prev.partial,
                }))
              }}
              className="border border-gray-800 rounded-lg overflow-hidden"
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-gray-900/50 cursor-pointer hover:bg-gray-900/70 transition-colors">
                  <h2 className="text-2xl font-semibold">What's Partially Implemented</h2>
                  {openSections.partial ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-gray-900/20 border-t border-gray-800">
                <ul className="space-y-4">
                  <li className="space-y-2">
                    <h4 className="font-semibold">Search Result Layouts</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>List view is complete</li>
                      <li>Grid and Compact views are placeholders</li>
                    </ul>
                  </li>
                  <li className="space-y-2">
                    <h4 className="font-semibold">Knowledge Sources ("The Surf")</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>UI for selection is complete</li>
                      <li>Backend integration is partial (mainly web search works)</li>
                    </ul>
                  </li>
                  <li className="space-y-2">
                    <h4 className="font-semibold">RAG Mode</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>UI toggle exists</li>
                      <li>Backend placeholder exists but not implemented</li>
                    </ul>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            {/* Development Priorities - Collapsible */}
            <Collapsible
              open={openSections.priorities}
              onOpenChange={() => {
                setOpenSections((prev) => ({
                  ...prev,
                  priorities: !prev.priorities,
                }))
              }}
              className="border border-gray-800 rounded-lg overflow-hidden"
            >
              <CollapsibleTrigger className="w-full">
                <div className="flex items-center justify-between p-4 bg-gray-900/50 cursor-pointer hover:bg-gray-900/70 transition-colors">
                  <h2 className="text-2xl font-semibold">Development Priorities</h2>
                  {openSections.priorities ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-4 bg-gray-900/20 border-t border-gray-800">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold">High Priority</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>Complete search results experience (pagination, filtering)</li>
                      <li>Knowledge source integration</li>
                      <li>Error handling & stability improvements</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Medium Priority</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>RAG implementation</li>
                      <li>Advanced search features (autocomplete, filters)</li>
                      <li>User preferences</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold">Lower Priority</h4>
                    <ul className="list-disc pl-5 text-muted-foreground">
                      <li>UI refinements</li>
                      <li>Advanced features (image search, video search)</li>
                      <li>Performance optimizations</li>
                    </ul>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </main>
    </div>
  )
}
