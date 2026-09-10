import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ChatRole = "user" | "assistant";
export type ChatMessage = { id: string; role: ChatRole; content: string; createdAt: number };
type State = { messages: ChatMessage[]; addMessage: (m: ChatMessage) => void; appendTo: (id: string, chunk: string) => void; setContent: (id: string, content: string) => void; clear: () => void };

export const useChatStore = create<State>()(persist((set) => ({
  messages: [],
  addMessage: (message) => set((s) => ({ messages: [...s.messages, message] })),
  appendTo: (id, chunk) => set((s) => ({ messages: s.messages.map((m) => m.id === id ? { ...m, content: m.content + chunk } : m) })),
  setContent: (id, content) => set((s) => ({ messages: s.messages.map((m) => m.id === id ? { ...m, content } : m) })),
  clear: () => set({ messages: [] }),
}), { name: "sarah-joe-chat", partialize: (s) => ({ messages: s.messages.filter((m) => m.content.length > 0) }) }));
