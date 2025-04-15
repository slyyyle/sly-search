"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Save, RefreshCw, RotateCcw, AlertCircle } from "lucide-react"
import Link from "next/link"
import Logo from "@/components/logo"
import { useSettings } from "@/lib/use-settings"
import { GeneralSettings } from "@/components/settings/general-settings"
import { EnginesSettings } from "@/components/settings/engines-settings"
import { PrivacySettings } from "@/components/settings/privacy-settings"
import { AppearanceSettings } from "@/components/settings/appearance-settings"
import { AdvancedSettings } from "@/components/settings/advanced-settings"
import { PersonalSourcesSettings } from "@/components/settings/personal-sources-settings"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function SettingsPage() {
  const { settings, updateSetting, saveSettings, resetSettings, loading, error, isInitialLoadComplete } = useSettings()
  const [activeTab, setActiveTab] = useState("general")
  const [hasChanges, setHasChanges] = useState(false)
  const [savedSettingsState, setSavedSettingsState] = useState<typeof settings | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "checking">("checking")
  const [connectionMessage, setConnectionMessage] = useState<string>("")
  const [checkingInterval, setCheckingInterval] = useState<NodeJS.Timeout | null>(null)
  const initialLoadCompleteRef = useRef(false);

  // Check connection to backend
  const checkConnection = async () => {
    setConnectionStatus("checking")
    try {
      // Use our own API endpoint which will check the backend
      const response = await fetch("/api/health", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        // Add a timeout to avoid long waits
        signal: AbortSignal.timeout(3000),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.status === "ok") {
          setConnectionStatus("connected")
          setConnectionMessage(data.message || "Connected to backend")
        } else {
          setConnectionStatus("disconnected")
          setConnectionMessage(data.message || "Backend unavailable")
        }
      } else {
        setConnectionStatus("disconnected")
        setConnectionMessage("Health check failed")
      }
    } catch (err) {
      console.error("Error checking connection:", err)
      setConnectionStatus("disconnected")
      setConnectionMessage("Connection error")
    }
  }

  // Initial connection check and periodic checks
  useEffect(() => {
    // Check connection immediately
    checkConnection()

    // Set up periodic checks every 30 seconds
    const interval = setInterval(() => {
      checkConnection()
    }, 30000)

    setCheckingInterval(interval)

    // Clean up interval on unmount
    return () => {
      if (checkingInterval) {
        clearInterval(checkingInterval)
      }
    }
  }, [])

  // Effect to initialize savedSettingsState once initial settings load is complete
  useEffect(() => {
    // Only run once after the initial load is marked complete by useSettings
    if (isInitialLoadComplete && !initialLoadCompleteRef.current) {
      console.log("Initial settings load complete, setting baseline for changes.");
      setSavedSettingsState(JSON.parse(JSON.stringify(settings))); // Deep copy
      initialLoadCompleteRef.current = true; // Mark as run
    }
  }, [isInitialLoadComplete, settings]);

  // Effect to detect changes against the saved state
  useEffect(() => {
    // Only calculate changes if we have a baseline saved state
    if (savedSettingsState) {
      const currentSettingsString = JSON.stringify(settings);
      const savedSettingsString = JSON.stringify(savedSettingsState);
      const changed = currentSettingsString !== savedSettingsString;
       if (hasChanges !== changed) { // Only update state if the value actually changes
         setHasChanges(changed);
         console.log("Change detected:", changed, "Current:", currentSettingsString, "Saved:", savedSettingsString);
       }
    } else {
      // If there's no saved state yet (e.g., initial load ongoing), assume no changes
      if (hasChanges) {
        setHasChanges(false);
      }
    }
    // Depend on the current settings and the baseline saved state
  }, [settings, savedSettingsState, hasChanges]);

  const handleSaveSettings = async () => {
    try {
      await saveSettings()
      // Update the baseline to the current settings state after successful save
      setSavedSettingsState(JSON.parse(JSON.stringify(settings))); // Deep copy
      setHasChanges(false) // Explicitly set to false after save
      console.log("Settings saved successfully, updated baseline.");
    } catch (err) {
      console.error("Error saving settings:", err)
      // Potentially show an error message to the user
    }
  }

  const handleResetSettings = async () => {
    try {
      await resetSettings()
      // After reset, the 'settings' object in context is updated to defaults.
      // We need to update our baseline to match these new defaults.
      // Note: resetSettings in useSettings already sets the state to defaults.
      // We rely on the 'settings' prop updating and triggering the change detection useEffect.
      // However, let's explicitly update savedSettingsState here AFTER the await for clarity and immediate reflection.
       setSavedSettingsState(JSON.parse(JSON.stringify(settings))); // Update baseline to defaults
       setHasChanges(false); // Explicitly set to false after reset completes
       console.log("Settings reset successfully, updated baseline.");

    } catch (err) {
      console.error("Error resetting settings:", err)
      // Potentially show an error message to the user
    }
  }

  // Determine header text only when load is complete
  const headerText = isInitialLoadComplete
    ? settings.general?.instanceName || "SlySearch"
    : undefined; // Pass undefined if not loaded

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
          {/* Render Logo component, passing dynamic text when available */}
          <Logo size="small" text={headerText} />
          <div className="ml-auto flex items-center">
            <div className="flex items-center mr-4">
              {connectionStatus === "checking" ? (
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></div>
                  <span className="text-xs text-muted-foreground">Checking...</span>
                </div>
              ) : connectionStatus === "connected" ? (
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                  <span className="text-xs text-muted-foreground">Connected</span>
                </div>
              ) : (
                <div className="flex items-center">
                  <div className="w-2 h-2 rounded-full bg-red-500 mr-2"></div>
                  <span className="text-xs text-muted-foreground">Disconnected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container px-4 py-8">
        <div className="flex flex-col gap-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="default">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Settings</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will reset all settings to their default values. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResetSettings}>Reset</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Button
              onClick={handleSaveSettings}
              className="google-gradient-border hover:bg-black"
              disabled={!hasChanges || loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>

          {/* Tabs */}
          <div className="flex justify-center mb-6">
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="w-auto">
              <TabsList className="bg-background/60 google-gradient-border inline-flex mx-auto">
                <TabsTrigger value="general">Lineup</TabsTrigger>
                <TabsTrigger value="engines">Quiver</TabsTrigger>
                <TabsTrigger value="privacy">Low Pro</TabsTrigger>
                <TabsTrigger value="appearance">Wax & Decals</TabsTrigger>
                <TabsTrigger value="advanced">Fins & Leash</TabsTrigger>
                <TabsTrigger value="personalSources">The Surf</TabsTrigger>
              </TabsList>

              <TabsContent value="general">
                <GeneralSettings settings={settings.general} updateSetting={updateSetting} />
              </TabsContent>
              <TabsContent value="engines">
                <EnginesSettings settings={settings.engines} updateSetting={updateSetting} />
              </TabsContent>
              <TabsContent value="privacy">
                <PrivacySettings settings={settings.privacy} updateSetting={updateSetting} />
              </TabsContent>
              <TabsContent value="appearance">
                <AppearanceSettings settings={settings.appearance} updateSetting={updateSetting} />
              </TabsContent>
              <TabsContent value="advanced">
                <AdvancedSettings settings={settings.advanced} updateSetting={updateSetting} />
              </TabsContent>
              <TabsContent value="personalSources">
                <PersonalSourcesSettings settings={settings.personalSources} updateSetting={updateSetting} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
