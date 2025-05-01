import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

export function ChatInterface() {
  const searchParams = useSearchParams();
  const initialMessageFromQuery = searchParams.get('initialMessage');

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    setError(null);
    setIsLoading(true);

    setMessages(prev => [...prev, { sender: 'user', text: messageText }]);

    try {
      const response = await fetch('/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: messageText }),
      });

      if (!response.ok) {
        let errorDetail = `Error: ${response.status}`;
        try {
            const errorData = await response.json();
            errorDetail = errorData.detail || errorDetail;
        } catch (jsonError) {
            console.warn("Could not parse error response as JSON");
        }
        throw new Error(errorDetail);
      }

      const data = await response.json();
      setMessages(prev => [...prev, { sender: 'bot', text: data.response }]);
      setCurrentInput('');

    } catch (err: any) {
      console.error("Chat API Error:", err);
      setError(err.message || 'Failed to fetch response from the chatbot.');
      setMessages(prev => [...prev, { sender: 'bot', text: `Error: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialMessageFromQuery && messages.length === 0) {
      sendMessage(initialMessageFromQuery);
    }
  }, [initialMessageFromQuery, sendMessage, messages.length]);

  useEffect(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
    }
  }, [messages]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentInput(event.target.value);
  };

  const handleSendClick = () => {
    sendMessage(currentInput);
  };

  const handleInputKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !isLoading) {
      sendMessage(currentInput);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-150px)] max-w-4xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">AI Chat</h2>
      <ScrollArea className="flex-grow mb-4 border rounded-md p-3" ref={scrollAreaRef}>
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 p-2 rounded-lg ${ 
            msg.sender === 'user' ? 'bg-blue-900/70 ml-auto max-w-[80%]' : 'bg-gray-700/70 mr-auto max-w-[80%]' 
          }`}> 
            <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-center items-center p-2">
             <span className="animate-pulse text-muted-foreground">... ...</span>
          </div>
        )}
         {error && (
             <div className="text-red-500 text-center p-2">{error}</div>
         )}
      </ScrollArea>
      <div className="flex space-x-2">
        <Input
          type="text"
          placeholder="Ask the AI..."
          value={currentInput}
          onChange={handleInputChange}
          onKeyPress={handleInputKeyPress}
          disabled={isLoading}
          className="flex-grow"
        />
        <Button onClick={handleSendClick} disabled={isLoading || !currentInput.trim()}>
          {isLoading ? 'Sending...' : 'Send'}
        </Button>
      </div>
    </div>
  );
} 