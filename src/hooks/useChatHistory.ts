"use client";

import { useEffect, useState } from "react";
import { get, set } from "idb-keyval";

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  hasCode?: boolean;
}

export function useChatHistory(questionId: string | undefined, initialMessageFactory?: () => ChatMessage) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from IDB on mount
  useEffect(() => {
    if (!questionId) return;

    async function loadHistory() {
      try {
        const key = `chat_history_${questionId}`;
        const data = await get(key);
        
        if (data) {
          const { date, history } = data;
          const today = new Date().toDateString();
          
          if (date === today && Array.isArray(history) && history.length > 0) {
            // Rehydrate date objects
            const rehydrated = history.map((m: any) => ({
              ...m,
              timestamp: new Date(m.timestamp)
            }));
            setMessages(rehydrated);
            setIsLoaded(true);
            return;
          }
        }
      } catch (err) {
        console.error("Failed to load chat history", err);
      }
      
      // If we reach here, it's either missing, empty, or expired
      if (initialMessageFactory) {
        setMessages([initialMessageFactory()]);
      } else {
        setMessages([]);
      }
      setIsLoaded(true);
    }
    
    loadHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionId]);

  // Save to IDB whenever messages change
  useEffect(() => {
    if (!questionId || !isLoaded || messages.length === 0) return;

    const saveHistory = async () => {
      try {
        const key = `chat_history_${questionId}`;
        await set(key, {
          date: new Date().toDateString(),
          history: messages
        });
      } catch (err) {
        console.error("Failed to save chat history", err);
      }
    };

    saveHistory();
  }, [messages, questionId, isLoaded]);

  return { messages, setMessages, isLoaded };
}
