"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Check, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface Theme {
  id: string;
  name: string;
}

const themes: Theme[] = [
  { id: 'google-original', name: 'Google Original' },
  { id: 'ocean-breeze', name: 'Ocean Breeze' },
  { id: 'sunset-tide', name: 'Sunset Tide' },
  { id: 'surf-shine', name: 'Surf Shine' },
  { id: 'wedding-day-shred', name: 'Wedding Day Shred' },
  { id: 'rasta-waves', name: 'Rasta Waves' },
  { id: 'surfhabi', name: 'Surfhabi' },
  { id: 'island-hopper', name: 'Island Hopper' },
  { id: 'mango-tango', name: 'Mango Tango' },
  { id: 'lagoon-luster', name: 'Lagoon Luster' },
  { id: 'hibiscus-heat', name: 'Hibiscus Heat' },
  { id: 'neon-pipeline', name: 'Neon Pipeline' },
  { id: 'chrome-wave', name: 'Chrome Wave' },
  { id: 'cyber-reef', name: 'Cyber Reef' },
  { id: 'quantum-swell', name: 'Quantum Swell' },
];

const LOCAL_STORAGE_KEY = 'selected-theme';

interface ThemeSwitcherProps {
  value?: string; // Current theme from settings
  onThemeChange: (themeId: string) => void; // Callback to update settings
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ value, onThemeChange }) => {
  const [selectedThemeId, setSelectedThemeId] = useState<string>('google-original');

  const applyThemeToDocument = useCallback((themeId: string) => {
    document.documentElement.dataset.theme = themeId;
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, themeId);
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
    }
  }, []);

  // Effect to initialize and sync with `value` prop (from settings)
  useEffect(() => {
    console.log("[THEME DEBUGGER SWITCHER] useEffect triggered. Received value:", value);
    console.log("[THEME DEBUGGER SWITCHER] Current themes array:", themes);

    let initialThemeId = 'google-original'; // Default
    if (value && themes.some(t => t.id === value)) {
      initialThemeId = value;
      console.log("[THEME DEBUGGER SWITCHER] Using theme from prop (value):", initialThemeId);
    } else {
      console.log("[THEME DEBUGGER SWITCHER] Prop value ('" + value + "') is invalid or not found in themes array. Falling back to localStorage or default.");
      // Fallback to localStorage if value from props is invalid or not present
      try {
        const storedThemeId = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedThemeId && themes.some(t => t.id === storedThemeId)) {
          initialThemeId = storedThemeId;
        }
      } catch (error) {
        console.warn('Failed to retrieve theme from localStorage:', error);
      }
    }
    setSelectedThemeId(initialThemeId);
    applyThemeToDocument(initialThemeId);
  }, [value, applyThemeToDocument]);

  const handleThemeSelect = (themeId: string) => {
    setSelectedThemeId(themeId);
    applyThemeToDocument(themeId);
    onThemeChange(themeId); // Call the callback to update settings
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          <Palette className="mr-2 h-[1.2rem] w-[1.2rem]" />
          {themes.find(t => t.id === selectedThemeId)?.name || 'Select Theme'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]">
        <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => handleThemeSelect(theme.id)}
            className={cn("flex items-center justify-between", selectedThemeId === theme.id && "font-semibold")}
          >
            {theme.name}
            {selectedThemeId === theme.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}; 