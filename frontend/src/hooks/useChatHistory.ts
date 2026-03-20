import { useCallback, useEffect, useState } from "react";

import { ChatMessage, Composition, Session } from "@/types/music";

const STORAGE_KEY = "music-mcp-sessions";

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setSessions(parsed.sessions || []);
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions }));
  }, [sessions]);

  const addUserMessage = useCallback((content: string) => {
    const message: ChatMessage = {
      id: generateId(),
      role: "user",
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, message]);
  }, []);

  const addAssistantMessage = useCallback(
    (content: string, composition?: Composition) => {
      const message: ChatMessage = {
        id: generateId(),
        role: "assistant",
        content,
        timestamp: Date.now(),
        composition,
      };
      setMessages((prev) => [...prev, message]);
    },
    []
  );

  const clearHistory = useCallback(() => {
    setMessages([]);
  }, []);

  const saveSession = useCallback(
    (title: string, composition: Composition | null, currentMessages?: ChatMessage[]) => {
      const session: Session = {
        id: generateId(),
        title,
        timestamp: Date.now(),
        composition,
        messages: currentMessages ? [...currentMessages] : [...messages],
      };
      setSessions((prev) => [session, ...prev]);
      return session.id;
    },
    [messages]
  );

  const loadSession = useCallback(
    (id: string): { composition: Composition | null; messages: ChatMessage[] } | null => {
      const session = sessions.find((s) => s.id === id);
      if (!session) return null;

      setMessages(session.messages);
      return {
        composition: session.composition,
        messages: session.messages,
      };
    },
    [sessions]
  );

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  return {
    messages,
    sessions,
    addUserMessage,
    addAssistantMessage,
    clearHistory,
    saveSession,
    loadSession,
    deleteSession,
  };
}
