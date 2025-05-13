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
import { WaveRacerSettings } from "@/components/settings/wave-racer-settings"
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
  const initialLoadCompleteRef = useRef(false);

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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="mr-2">
                  <RotateCcw className="h-4 w-4 mr-1" />
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
              variant="themedPrimary"
              disabled={!hasChanges || loading}
              size="sm"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </>
              )}
            </Button>
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

          {/* Wrap Tabs in a width-constrained, centered div */}
          <div className="max-w-5xl mx-auto">
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab}>
              {/* Center the TabsList within the constrained div */}
              <div className="flex justify-center mb-6">
                <TabsList className="bg-background/60 themed-gradient-border inline-flex">
                  <TabsTrigger value="general">Surf Lineup</TabsTrigger>
                  <TabsTrigger value="engines">Board Quiver</TabsTrigger>
                  <TabsTrigger value="privacy">Low Pro</TabsTrigger>
                  <TabsTrigger value="appearance">Wax & Decals</TabsTrigger>
                  <TabsTrigger value="advanced">Fins & Leash</TabsTrigger>
                  <TabsTrigger value="personalSources">Local Lagoon</TabsTrigger>
                  <TabsTrigger value="waveRacer">Wave Racer</TabsTrigger>
                </TabsList>
              </div>

              {/* TabsContent will now be constrained by the outer div */}
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
              <TabsContent value="waveRacer">
                <WaveRacerSettings settings={settings.waveRacer} updateSetting={updateSetting} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}
