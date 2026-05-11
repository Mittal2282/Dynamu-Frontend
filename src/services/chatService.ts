import { apiCaller } from '../api/apiCaller';
import { authStore } from '../store/authStore';
import { ENDPOINTS } from '../utils/endpoints';
import { getSocket } from './socketService';

import type { MenuItem } from '../types/menu';

/**
 * AI chat API services.
 */

export interface ChatHistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface StreamCallbacks {
  onChunk: (text: string) => void;
  onDone: (items: MenuItem[], mode?: string, options?: string[]) => void;
  onError: (err: unknown) => void;
}

/**
 * Fetch the full conversation history for the current session.
 */
export async function getChatHistory(): Promise<ChatHistoryEntry[]> {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.CHAT_HISTORY });
  return data.data ?? [];
}

/**
 * Fetch the personalized welcome message for this session.
 */
export async function getWelcomeMessage(): Promise<string> {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.CHAT_WELCOME });
  return data.data?.message ?? '';
}

/**
 * Send a chat message and receive AI reply + recommendations.
 */
export async function sendChatMessage(
  message: string
): Promise<{ reply: string; recommended_items: MenuItem[] }> {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.CHAT,
    payload:  { message, socket_id: getSocket()?.id ?? null },
  });
  return data.data;
}

/**
 * Stream a chat message via SSE.
 * Calls onChunk(text) for each incremental text chunk.
 * Calls onDone(items, mode, options) when the stream is complete.
 * Calls onError(err) on failure.
 */
export async function streamChatMessage(
  message: string,
  { onChunk, onDone, onError }: Partial<StreamCallbacks> = {}
): Promise<void> {
  const { sessionToken } = authStore.getState();
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

  let response: Response;
  try {
    response = await fetch(`${baseURL}${ENDPOINTS.CHAT_STREAM}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
      },
      body: JSON.stringify({ message, socket_id: getSocket()?.id ?? null }),
    });
  } catch (err) {
    onError?.(err);
    return;
  }

  if (!response.ok) {
    onError?.(new Error(`Stream request failed: ${response.status}`));
    return;
  }

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let sseBuffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });

      // Split on double newline (SSE event boundary)
      const events = sseBuffer.split('\n\n');
      sseBuffer = events.pop()!; // keep the incomplete trailing fragment

      for (const eventBlock of events) {
        for (const line of eventBlock.split('\n')) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: string;
              text?: string;
              message?: string;
              items?: MenuItem[];
              mode?: string;
              options?: string[];
            };
            if (event.type === 'chunk') onChunk?.(event.text ?? '');
            else if (event.type === 'done') onDone?.(event.items ?? [], event.mode ?? 'normal', event.options ?? []);
            else if (event.type === 'error') onChunk?.(event.message ?? '');
          } catch {
            // malformed JSON in SSE line — ignore
          }
        }
      }
    }
  } catch (err) {
    onError?.(err);
  }
}
