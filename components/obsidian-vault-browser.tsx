import React, { useState, useEffect, useCallback } from 'react';
import { Folder, FileText, ArrowUp, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { VaultItem, VaultBrowseResponse } from '@/types/obsidian';

interface ObsidianVaultBrowserProps {
  initialPath?: string;
  onClose?: () => void; // If used in a dialog
  // We don't need backendUrl here as we call the relative API route
}

export function ObsidianVaultBrowser({ initialPath = "", onClose }: ObsidianVaultBrowserProps) {
  const [currentSubpath, setCurrentSubpath] = useState<string>(initialPath);
  const [items, setItems] = useState<VaultItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Start loading initially

  const fetchVaultItems = useCallback(async (subpath: string) => {
    setIsLoading(true);
    setError(null);
    console.log(`[Browser Component] Fetching subpath: ${subpath}`);

    const url = new URL('/api/browse/obsidian', window.location.origin); // Use relative path
    url.searchParams.set('subpath', encodeURIComponent(subpath));

    try {
      const response = await fetch(url.toString());
      const data: VaultBrowseResponse = await response.json();

      if (!response.ok || data.error) {
        // Handle errors reported by the API route (which includes backend errors)
        const errorMessage = data.error || `HTTP error ${response.status}`;
        console.error(`[Browser Component] Error fetching vault items: ${errorMessage}`);
        setError(errorMessage);
        setItems([]); // Clear items on error
      } else {
        console.log(`[Browser Component] Received ${data.items.length} items for path: ${data.path}`);
        setItems(data.items);
        // Ensure the path state matches the response, useful if initialPath was corrected
        setCurrentSubpath(data.path);
      }
    } catch (fetchError) {
      console.error("[Browser Component] Failed to fetch vault items:", fetchError);
      const errorMessage = fetchError instanceof Error ? fetchError.message : "Unknown network error.";
      setError(errorMessage);
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array, fetch is self-contained

  useEffect(() => {
    fetchVaultItems(currentSubpath);
  }, [currentSubpath, fetchVaultItems]);

  const handleItemClick = (item: VaultItem) => {
    if (item.type === 'directory') {
      setCurrentSubpath(item.path);
    } else {
      // Potentially handle file selection later
      console.log("Selected file:", item.path);
    }
  };

  const handleGoUp = () => {
    if (currentSubpath === "") return; // Already at root
    // Simple path manipulation, works for POSIX-style paths
    const parts = currentSubpath.split('/');
    parts.pop(); // Remove last segment
    setCurrentSubpath(parts.join('/'));
  };

  return (
    <div className="flex flex-col h-[60vh]">
      <div className="flex items-center justify-between p-2 border-b mb-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleGoUp}
          disabled={currentSubpath === "" || isLoading}
          aria-label="Go up a directory"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
        <span className="text-sm text-muted-foreground truncate" title={currentSubpath || "Vault Root"}>
          {currentSubpath || "Vault Root"}
        </span>
        {/* Placeholder for other actions like refresh? */}
      </div>

      {isLoading && (
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}

      {error && (
        <div className="p-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </div>
      )}

      {!isLoading && !error && (
        <ScrollArea className="flex-grow">
          <div className="p-2 space-y-1">
            {items.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Folder is empty.</p>
            )}
            {items.map((item) => (
              <Button
                key={item.path}
                variant="ghost"
                className="w-full justify-start h-8 px-2"
                onClick={() => handleItemClick(item)}
                title={item.path}
              >
                {item.type === 'directory' ? (
                  <Folder className="h-4 w-4 mr-2 flex-shrink-0" />
                ) : (
                  <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                )}
                <span className="truncate">{item.name}</span>
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}

      {/* Optional: Add a close button if needed within the component itself */}
      {/* {onClose && (
        <div className="p-2 border-t mt-auto">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      )} */}
    </div>
  );
} 