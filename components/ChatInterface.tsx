'use client';

import React, { useState, useRef, useEffect, useCallback, FormEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowUp, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react"

export function ChatInterface() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [inputQuery, setInputQuery] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [isLoadingAISelect, setIsLoadingAISelect] = useState(false);
  const [aiSelectError, setAiSelectError] = useState<string | null>(null);

  useEffect(() => {
    const initialQuery = searchParams?.get('q') || '';
    setInputQuery(initialQuery);
    textareaRef.current?.focus();
  }, [searchParams]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputQuery(event.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  async function getAIDynamicEngines(query: string): Promise<string[]> {
    try {
      const response = await fetch('http://localhost:8000/api/v1/engines/select', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Failed to select engines' }));
        console.error('Engine selection API error:', response.status, errorData);
        throw new Error(errorData.message || 'Failed to fetch engine suggestions');
      }

      const data = await response.json();
      if (!data.selected_engines || !Array.isArray(data.selected_engines)) {
        console.error('Invalid response format from engine selection API:', data);
        throw new Error('Received invalid engine suggestions format');
      }
      return data.selected_engines;
    } catch (error) {
      console.error('Error calling getAIDynamicEngines:', error);
      throw error instanceof Error ? error : new Error('An unknown error occurred during engine selection');
    }
  }

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const query = inputQuery.trim();
    if (!query || isLoadingAISelect) return;

    setIsLoadingAISelect(true);
    setAiSelectError(null);

    try {
      console.log(`Calling getAIDynamicEngines for query: ${query}`);
      const selectedEngines = await getAIDynamicEngines(query);
      console.log(`Received engines: ${selectedEngines.join(', ')}`);

      if (selectedEngines.length === 0) {
         throw new Error("No suitable search engines found for this query.");
      }

      const searchUrlParams = new URLSearchParams();
      searchUrlParams.set('q', query);
      searchUrlParams.set('source', 'web');
      searchUrlParams.set('pageno', '1');
      searchUrlParams.set('engines', selectedEngines.join(','));
      router.push(`/search?${searchUrlParams.toString()}`);

    } catch (error) {
      console.error('Error during AI engine selection or navigation:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
      setAiSelectError(`Error: ${errorMessage}`);
    } finally {
      setIsLoadingAISelect(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] w-full px-4">
      <div className="w-full max-w-2xl">
        <form onSubmit={handleFormSubmit} className="relative flex flex-col w-full">
           {isLoadingAISelect && (
             <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 flex items-center space-x-2 p-2 bg-background/80 backdrop-blur-sm rounded-md border border-border/50">
               <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
               <span className="text-sm text-muted-foreground">Finding best search engines...</span>
             </div>
           )}
          
           {aiSelectError && (
             <Alert variant="destructive" className="mb-4 bg-destructive/10 border-destructive/30 text-destructive">
                <Terminal className="h-4 w-4" />
               <AlertTitle>Search Error</AlertTitle>
               <AlertDescription>
                 {aiSelectError}
               </AlertDescription>
             </Alert>
           )}

          <div className="relative flex items-end w-full p-2 border rounded-lg shadow-sm bg-background focus-within:ring-1 focus-within:ring-ring">
            <Textarea
              ref={textareaRef}
              value={inputQuery}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Ask a question or type a search query..."
              className="flex-1 resize-none border-none focus:ring-0 focus:outline-none bg-transparent max-h-48 min-h-[40px] text-base leading-relaxed pr-12 py-2 scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent"
              rows={1}
              disabled={isLoadingAISelect}
            />
            <Button
              type="submit"
              size="icon"
              className="absolute right-3 bottom-2 h-8 w-8"
              disabled={!inputQuery.trim() || isLoadingAISelect}
            >
              <ArrowUp className="h-5 w-5" />
              <span className="sr-only">Submit Search</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 