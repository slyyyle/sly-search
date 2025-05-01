"use client"; // Mark this as a Client Component because ChatInterface uses hooks

import { ChatInterface } from "@/components/ChatInterface"; // Import your chat component
import { Suspense } from "react"; // Import Suspense

// Use a wrapper component to ensure hooks are only called on the client
function ChatPageClient() {
  // useSearchParams needs to be called within a Suspense boundary
  // when used in a page component rendered by the server initially.
  return <ChatInterface />; 
}

export default function ChatPage() {
  return (
    // Wrap the client component in Suspense for useSearchParams
    <Suspense fallback={<div>Loading chat...</div>}> 
      <ChatPageClient />
    </Suspense>
  );
} 