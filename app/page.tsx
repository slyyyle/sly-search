"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import Logo from "@/components/logo"
import TheSurfSelector from "@/components/the-surf-selector"
import { QuickSettingsMenu } from "@/components/quick-settings-menu"
import { InfoDialog } from "@/components/info-dialog"
import { useSettings } from "@/lib/use-settings"

export default function Home() {
  const [query, setQuery] = useState("")
  const [knowledgeSource, setKnowledgeSource] = useState("normal")
  const router = useRouter()
  const { settings, loading, isInitialLoadComplete } = useSettings()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (query.trim()) {
      const searchUrl = `/search?q=${encodeURIComponent(query)}&source=${knowledgeSource}`
      router.push(searchUrl)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && query.trim()) {
      e.preventDefault()
      const searchUrl = `/search?q=${encodeURIComponent(query)}&source=${knowledgeSource}`
      router.push(searchUrl)
    }
  }

  // Determine header text only when load is complete
  const headerText = isInitialLoadComplete
    ? settings.general?.instanceName || "SlySearch"
    : undefined; // Pass undefined if not loaded

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24">
      <div className="w-full max-w-3xl space-y-8">
        {/* Render Logo component, passing dynamic text when available */}
        <div className="flex justify-center mb-8">
          <Logo size="large" text={headerText} />
        </div>

        <form onSubmit={handleSearch} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <Input
              type="text"
              placeholder="Search the web..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10 py-6 text-lg bg-background/60 google-gradient-border"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 text-sm search-hint">
              Press Enter to Search
            </div>
          </div>

          <div className="flex items-center justify-between px-1 mt-4">
            <div className="flex-grow max-w-[240px]">
              <TheSurfSelector value={knowledgeSource} onChange={setKnowledgeSource} />
            </div>

            <div className="flex items-center gap-2">
              <InfoDialog />

              <QuickSettingsMenu compact={true} />
            </div>
          </div>
        </form>
      </div>
    </main>
  )
}
