import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export const chatStore = create(
  devtools((set) => ({
    messages: [],
    loading: false,
    initialized: false,

    setMessages: (messages) => set(() => ({ messages })),
    addMessage: (message) =>
      set((state) => ({ messages: [...state.messages, message] })),
    setLoading: (loading) => set(() => ({ loading })),
    setInitialized: (initialized) => set(() => ({ initialized })),

    reset: () =>
      set(() => ({ messages: [], loading: false, initialized: false })),
  }))
);
