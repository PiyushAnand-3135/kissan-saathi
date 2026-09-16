import React, { createContext, useContext, useState, useCallback } from 'react';

export interface ConversationMessage {
  id: string;
  role: 'farmer' | 'assistant';
  text: string;
  usedMemory?: boolean;
  imageUri?: string;
}

interface ConversationContextType {
  messages: ConversationMessage[];
  addMessage: (message: ConversationMessage) => void;
  clearConversation: () => void;
}

const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// Deliberately a single shared list, not one per screen -- this is what
// lets a farmer ask something by voice, then switch to typing (or back),
// without losing the thread. Session-only (resets on app restart); the
// backend's long-term memory is what persists across days/sessions.
export function ConversationProvider({ children }: { children: React.ReactNode }) {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);

  const addMessage = useCallback((message: ConversationMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const clearConversation = useCallback(() => {
    setMessages([]);
  }, []);

  return (
    <ConversationContext.Provider value={{ messages, addMessage, clearConversation }}>
      {children}
    </ConversationContext.Provider>
  );
}

export function useConversation() {
  const context = useContext(ConversationContext);
  if (!context) {
    throw new Error('useConversation must be used within a ConversationProvider');
  }
  return context;
}
