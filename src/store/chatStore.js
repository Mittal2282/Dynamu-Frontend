import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const chatStore = create(
  devtools((set) => ({
    messages: [],
    loading: false,
    initialized: false,
    streaming: false,

    setMessages: (messages) => set(() => ({ messages })),
    addMessage: (message) =>
      set((state) => ({ messages: [...state.messages, message] })),
    setLoading: (loading) => set(() => ({ loading })),
    setInitialized: (initialized) => set(() => ({ initialized })),

    // Streaming: add an empty AI message placeholder, switch from loading→streaming
    startStreamingMessage: () =>
      set((state) => ({
        loading: false,
        streaming: true,
        messages: [
          ...state.messages,
          { role: 'ai', text: '', items: [], timestamp: Date.now(), streaming: true },
        ],
      })),

    // Streaming: append a chunk of text to the last (streaming) AI message
    appendStreamingText: (text) =>
      set((state) => {
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        if (last?.streaming) {
          msgs[msgs.length - 1] = { ...last, text: last.text + text };
        }
        return { messages: msgs };
      }),

    // Streaming: finalize the last AI message with items, clear streaming flag
    finalizeStreamingMessage: (items = []) =>
      set((state) => {
        const msgs = [...state.messages];
        const last = msgs[msgs.length - 1];
        if (last?.streaming) {
          msgs[msgs.length - 1] = { ...last, items, streaming: false };
        }
        return { messages: msgs, streaming: false };
      }),

    reset: () =>
      set(() => ({ messages: [], loading: false, initialized: false, streaming: false })),
  }))
);
