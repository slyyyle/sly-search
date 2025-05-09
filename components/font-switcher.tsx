"use client";

import React, { useEffect, useState } from "react";
import { useSettings } from "@/lib/use-settings";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"; // Assuming similar UI components will be used

// Define a simple font type for now
interface Font {
  id: string;
  name: string;
}

// For now, only Hack font is available
const availableFonts: Font[] = [
  { id: "hack-local", name: "Hack (Local)" },
  // Future fonts can be added here
  // { id: "inter", name: "Inter" },
  // { id: "roboto-mono", name: "Roboto Mono" },
];

interface FontSwitcherProps {
  value?: string; // Current font ID from settings
  onFontChange?: (fontId: string) => void; // Callback to update settings
}

export function FontSwitcher({ value, onFontChange }: FontSwitcherProps) {
  const { settings, updateSetting, saveSettings } = useSettings();
  const [selectedFontId, setSelectedFontId] = useState<string | undefined>(value);

  useEffect(() => {
    // Reflect changes from settings if the component is used elsewhere directly
    // or if the initial value prop updates
    setSelectedFontId(value || settings.appearance?.font);
  }, [value, settings.appearance?.font]);

  const handleFontChange = (fontId: string) => {
    if (fontId === selectedFontId) return;

    setSelectedFontId(fontId);

    if (onFontChange) {
      onFontChange(fontId); // Use callback if provided (for settings page integration)
    } else {
      // Direct update if used standalone (though not the primary use case here)
      updateSetting("appearance", "font", fontId);
      saveSettings(); // Save immediately
      // Note: Applying the font visually is handled by next/font/local and CSS variable.
      // If we were to switch to fonts not managed by next/font/local classes on <html>,
      // we might need to: document.documentElement.style.setProperty('--font-primary', newFontFamily);
      // or change a class on the body/html element.
      // For now, localStorage sync in useSettings and the next/font setup should be enough.
      try {
        localStorage.setItem('selected-font', fontId);
      } catch (e) {
        console.warn('Failed to set font in localStorage from FontSwitcher', e);
      }
    }
  };
  
  const currentFontName = availableFonts.find(f => f.id === selectedFontId)?.name || "Unknown Font";

  // For now, since there's only one font and selection isn't fully active,
  // we can just display the current font.
  // A dropdown will be useful when multiple fonts are available.

  return (
    <div className="flex flex-col space-y-2">
      {/* <p className="text-sm text-muted-foreground">
        Current Font: {currentFontName}
      </p> */}
      <Select
        value={selectedFontId}
        onValueChange={handleFontChange}
        disabled={availableFonts.length <= 1} // Disable if only one/no font
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a font..." />
        </SelectTrigger>
        <SelectContent>
          {availableFonts.map((font) => (
            <SelectItem key={font.id} value={font.id}>
              {font.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 