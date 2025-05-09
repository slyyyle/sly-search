"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { SettingsTooltip } from "@/components/settings-tooltip"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useState } from "react"

interface WaveRacerSettingsProps {
  settings: any; // We'll define the proper type later
  updateSetting: (section: string, key: string, value: any) => void;
}

export function WaveRacerSettings({ settings, updateSetting }: WaveRacerSettingsProps) {
  const [isTuningDialogOpen, setIsTuningDialogOpen] = useState(false)
  const [personalContext, setPersonalContext] = useState("")
  const [specialMeter, setSpecialMeter] = useState("")

  return (
    <div className="space-y-6">
      {/* The Golden Quiver Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CardTitle>The Golden Quiver</CardTitle>
            <SettingsTooltip content="Decide how you want your boards to be crafted, and let AI pick between all available engines to match your unique style of shredding." />
          </div>
          <CardDescription>
            Craft your perfect board.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Label>Golden Quiver Tuning</Label>
              <SettingsTooltip content="AI is good, but make it yours. Add context for the AI to use to help your searches better suit how you think!" />
            </div>
            <Button onClick={() => setIsTuningDialogOpen(true)}>Tune Quiver</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isTuningDialogOpen} onOpenChange={setIsTuningDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Golden Quiver Tuning</DialogTitle>
            <DialogDescription>
              Customize how the AI understands and assists your search style.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="personal-context">Personal Context</Label>
                <SettingsTooltip content="Add facts about what you work on, your interests, or anything about you as a whole person that might give a better understanding to how you think!" />
              </div>
              <Input
                id="personal-context"
                value={personalContext}
                onChange={(e) => setPersonalContext(e.target.value)}
                placeholder="Tell us about yourself..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="special-meter">Special Meter</Label>
                <SettingsTooltip content="Discuss if you like bigger or smaller more focused engine sets. For example, in cases where you want to find media or fun content, you may want to expand engines - with the risk of allowing a few irrelevant engines. In cases where you want to find focused research content, you may in earlier stages have a wide filter, but wish to slim it down as you learn more." />
              </div>
              <Input
                id="special-meter"
                value={specialMeter}
                onChange={(e) => setSpecialMeter(e.target.value)}
                placeholder="Describe your preferred search scope..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="lifeguard-rules">Lifeguard Search Rules</Label>
                <SettingsTooltip content="As you gain a better understanding of how to work with the AI to shred to new heights, you may wish to alter its behavior. Choose when and how to do this." />
              </div>
              <Input
                id="lifeguard-rules"
                placeholder="Set your search rules..."
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Label htmlFor="mapping-archives">Mapping Archives</Label>
                <SettingsTooltip content="Add a local path you want to store your surfing data. If no path is given, data will not be stored. In all cases, data storage is secure and local to your machine." />
              </div>
              <Input
                id="mapping-archives"
                placeholder="Enter local storage path..."
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Separator />

      {/* The Research Hut Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CardTitle>The Research Hut</CardTitle>
            <SettingsTooltip content="Design new tricks and combos to open up new surf possibilities. Don't worry, a chatbot will walk you through it!" />
          </div>
          <CardDescription>
            Design new tricks.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Settings will be added here later */}
        </CardContent>
      </Card>

      <Separator />

      {/* Maps and Voyages Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CardTitle>Maps and Voyages</CardTitle>
            <SettingsTooltip content="Track and visualize. Choose how, where, and what to store. The only one who knows how to truly personalize your experience - is you. Take as much of that power as you'd like - or leave it to the AI. Rest assured, we don't how to personalize your browser - because we simply don't have the data to do so." />
          </div>
          <CardDescription>
            Track and visualize.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Settings will be added here later */}
        </CardContent>
      </Card>

      <Separator />

      {/* The Dream Shred Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CardTitle>The Dream Shred</CardTitle>
            <SettingsTooltip content="Take the memorable waves with you - and create your ultimate surf spot." />
          </div>
          <CardDescription>
            Save your best waves.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Settings will be added here later */}
        </CardContent>
      </Card>

      <Separator />

      {/* The Vibes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <CardTitle>The Vibes</CardTitle>
            <SettingsTooltip content="Change up the aesthetic. Surf with style." />
          </div>
          <CardDescription>
            Customize your style.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Settings will be added here later */}
        </CardContent>
      </Card>
    </div>
  )
} 