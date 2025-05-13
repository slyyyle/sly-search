'use client';

import React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, CheckCircle, XCircle, Bolt, Info, ChevronsRight, RefreshCw, SkipForward, Play } from "lucide-react"; // Added more icons
import type { LogMessage } from '@/app/page';
import { cn } from "@/lib/utils"; // Import cn for conditional classes
import { Badge } from "@/components/ui/badge";

interface StreamLogDisplayProps {
  messages: LogMessage[];
  error: string | null;
  maxHeight?: string; 
  includedEngines?: string[];
  rejectedEngines?: string[];
  showEngineBar?: boolean;
  candidateEngines?: string[];
  engineProgress?: string | null;
}

const formatTimestamp = (ts: number): string => {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

export function StreamLogDisplay({ messages, error, maxHeight = '300px', includedEngines = [], rejectedEngines = [], showEngineBar = false, engineProgress = null, candidateEngines = [] }: StreamLogDisplayProps) {

  // Scroll container ref
  const containerRef = React.useRef<HTMLDivElement>(null);

  // State and refs to manage typewriter effect for each message
  const [displayedTexts, setDisplayedTexts] = React.useState<string[]>([]);
  const prevLenRef = React.useRef(0);

  React.useEffect(() => {
    // Reset when messages cleared
    if (messages.length === 0) {
      prevLenRef.current = 0;
      setDisplayedTexts([]);
      return;
    }
    // Handle new message
    if (messages.length > prevLenRef.current) {
      const idx = prevLenRef.current;
      const msg = messages[idx];
      // Determine full text for this message
      let fullText = '';
      switch (msg.type) {
        case 'log_message':
          fullText = msg.data?.message || '';
          break;
        case 'engine_status':
          fullText = `Engine ${msg.data?.engine_name || msg.data?.engine_id}: ${msg.data?.status}`;
          break;
        case 'final_result':
          fullText = `Selection complete. Engines: ${msg.data?.selected_engines?.join(', ') || 'None'}`;
          break;
        case 'error':
          fullText = msg.data?.message || '';
          break;
        case 'llm_output':
          if (typeof msg.data?.parsed_output === 'string') {
            fullText = msg.data.parsed_output;
          } else if (typeof msg.data?.parsed === 'string') {
            fullText = msg.data.parsed;
          } else {
            fullText = JSON.stringify(msg.data); // Fallback
          }
          break;
        case 'decision':
          if (typeof msg.data?.parsed_output === 'string') {
            fullText = msg.data.parsed_output;
          } else if (typeof msg.data?.parsed === 'string') {
            fullText = msg.data.parsed;
          } else {
            fullText = JSON.stringify(msg.data);
          }
          break;
        default:
          fullText = JSON.stringify(msg.data);
      }
      // Initialize placeholder
      setDisplayedTexts(prev => { const arr = [...prev]; arr[idx] = ''; return arr; });
      // Stream characters with faster speed and initial stagger for first few messages
      const charInterval = 10; // ms per character
      const maxStagger = 5;    // number of messages to stagger
      const staggerDelay = idx < maxStagger ? idx * 150 : 0; // ms delay per message index
      for (let i = 0; i < fullText.length; i++) {
        setTimeout(() => {
          setDisplayedTexts(prev => {
            const arr = [...prev];
            arr[idx] = (arr[idx] || '') + fullText.charAt(i);
            return arr;
          });
        }, staggerDelay + i * charInterval);
      }
      prevLenRef.current = messages.length;
    }
  }, [messages]);

  // Auto-scroll to bottom when new messages render
  React.useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [displayedTexts, messages]);

  // Function to render a single log entry
  const renderLogEntry = (msg: LogMessage, index: number) => {
    let icon: React.ReactNode = <Terminal className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />;
    let content: React.ReactNode = null;
    let contentColor = "text-foreground/90"; // Default color
    let prefix = "";

    switch (msg.type) {
      case 'error':
        icon = <XCircle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />;
        content = msg.data?.message || JSON.stringify(msg.data);
        contentColor = "text-red-500";
        prefix = "[ERROR] ";
        break;
        
      case 'final_result':
        icon = <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />;
        content = msg.data?.selected_engines ? msg.data.selected_engines.join(', ') : 'None';
        contentColor = "text-green-500 font-medium";
        break;
        
      case 'engine_status':
        const status = msg.data?.status || 'processing';
        if (status === 'selected') {
          icon = <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0 mt-0.5" />;
          contentColor = "text-foreground/80";
        } else if (status === 'rejected') {
          icon = <XCircle className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />;
           contentColor = "text-muted-foreground/80 line-through";
        } else { // error or processing
           icon = <Bolt className="h-3 w-3 text-blue-500 flex-shrink-0 mt-0.5" />;
           contentColor = "text-blue-500";
        }
        content = `Engine ${msg.data?.engine_name || msg.data?.engine_id || '?'}: ${status}`;
        break;
        
      case 'log_message':
        const logData = msg.data || {};
        content = displayedTexts[index] !== undefined ? displayedTexts[index] : (logData.message || '');
        prefix = logData.step ? `[STEP ${logData.step}] ` : "";
        
        // Adjust icon and color based on logData.status or logData.type
        switch (logData.status) {
            case 'start': 
                icon = <Play className="h-3 w-3 text-blue-400 flex-shrink-0 mt-0.5" />;
                prefix += "(Starting) ";
                break;
            case 'progress': 
                icon = <RefreshCw className="h-3 w-3 text-cyan-400 animate-spin flex-shrink-0 mt-0.5" />;
                prefix += "(Progress) ";
                break;
            case 'complete': 
                icon = <CheckCircle className="h-3 w-3 text-green-400 flex-shrink-0 mt-0.5" />;
                prefix += "(Done) ";
                break;
            case 'skipped': 
                icon = <SkipForward className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />;
                prefix += "(Skipped) ";
                contentColor = "text-muted-foreground";
                break;
            case 'error': 
                 icon = <XCircle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />;
                 prefix += "(Error) ";
                 contentColor = "text-red-500";
                 break;
            case 'end': 
                 icon = <ChevronsRight className="h-3 w-3 text-purple-400 flex-shrink-0 mt-0.5" />;
                 prefix += "(Finished) ";
                 break;
            default: // No status or other status
                 if (logData.type === 'warning') {
                    icon = <Info className="h-3 w-3 text-yellow-400 flex-shrink-0 mt-0.5" />;
                    contentColor = "text-yellow-500";
                    prefix += "[WARN] ";
                 } else if (logData.type === 'error') { // Check type again if status is missing
                    icon = <XCircle className="h-3 w-3 text-red-500 flex-shrink-0 mt-0.5" />;
                    contentColor = "text-red-500";
                     prefix += "[ERROR] ";
                 } else {
                     icon = <Terminal className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />;
                 }
        }
        break;
        
      case 'llm_output':
        icon = <ChevronsRight className="h-3 w-3 text-purple-400 flex-shrink-0 mt-0.5" />;
        if (typeof msg.data?.parsed_output === 'string') {
          content = msg.data.parsed_output;
        } else if (typeof msg.data?.parsed === 'string') {
          content = msg.data.parsed;
        } else {
          content = JSON.stringify(msg.data); // Fallback
        }
        contentColor = "text-purple-300";
        prefix = "[LLM] ";
        break;

      case 'decision':
        icon = <Info className="h-3 w-3 text-yellow-400 flex-shrink-0 mt-0.5" />;
         if (typeof msg.data?.parsed_output === 'string') {
          content = msg.data.parsed_output;
        } else if (typeof msg.data?.parsed === 'string') {
          content = msg.data.parsed;
        } else {
          content = JSON.stringify(msg.data);
        }
        contentColor = "text-yellow-300";
        prefix = "[AI] ";
        break;
        
      default:
        icon = <Terminal className="h-3 w-3 text-muted-foreground flex-shrink-0 mt-0.5" />;
        content = JSON.stringify(msg.data);
        break;
    }

    return (
      <div key={index} className="flex items-start gap-1.5">
        <span className="text-sky-400/60 pt-0.5 select-none">[{formatTimestamp(msg.timestamp)}]</span>
        <span className="pt-0.5">{icon}</span>
        <div className={cn("flex-1 break-words whitespace-pre-wrap", contentColor)}>
          {prefix && <span className="font-medium mr-1">{prefix}</span>}
          {content}
        </div>
      </div>
    );
  };

  // Filter out engine_status during evaluation and remove empty log_message entries
  const baseMessages = showEngineBar
    ? messages.filter(msg => msg.type !== 'engine_status')
    : messages;
  const messagesToDisplay = baseMessages.filter(msg => {
    // Skip log_message entries with no content to avoid empty step lines
    if (msg.type === 'log_message') {
      const rawMsg = msg.data?.message;
      return typeof rawMsg === 'string' && rawMsg.trim().length > 0;
    }
    return true;
  });

  return (
    <div className="border rounded-lg bg-black/80 backdrop-blur-md shadow-lg overflow-hidden font-mono text-xs text-shadow-sm shadow-sky-500/20 flex flex-col h-full">
      <div className="bg-gradient-to-b from-sky-900/30 to-transparent p-2 border-b border-sky-700/30 text-sky-300 flex items-center gap-2">
        {/* Title and spinner */}
        <span className="font-medium">AI Engine Selection Log</span>
        {engineProgress && (
          <>
            <RefreshCw className="h-4 w-4 animate-spin text-cyan-400" />
            <span className="text-sm text-sky-300">Evaluating {engineProgress}...</span>
          </>
        )}
      </div>
      {/* Candidate Engines pane */}
      {showEngineBar && (
        <div className="border-b border-border/40 px-4 py-2">
          <div className="font-semibold text-sky-300 mb-2">Candidate Engines:</div>
          <div className="flex flex-wrap gap-2">
            {candidateEngines.map(id => {
              const variant = includedEngines.includes(id)
                ? 'cyan'
                : rejectedEngines.includes(id)
                  ? 'destructive'
                  : 'outline';
              return (
                <Badge key={id} variant={variant as any} className="text-xs">
                  {id}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
      <ScrollArea className="flex-1 p-3" style={{ maxHeight: maxHeight }}>
        <div ref={containerRef} className="space-y-1.5 overflow-auto">
          {messagesToDisplay.map(renderLogEntry)}
          {messages.length === 0 && !error && (
            <p className="text-sky-600 text-center py-2 animate-pulse">Awaiting AI stream...</p>
          )}
        </div>

        {/* Display final stream error if present */} 
        {error && (
           <Alert variant="destructive" className="mt-3 text-xs bg-red-900/40 border-red-500/50 text-red-300">
             <XCircle className="h-4 w-4" /> 
             <AlertTitle>Stream Error</AlertTitle>
             <AlertDescription className="text-red-400">
               {error}
             </AlertDescription>
           </Alert>
         )}
      </ScrollArea>
    </div>
  );
} 