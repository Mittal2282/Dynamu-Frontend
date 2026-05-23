import { apiCaller } from "../api/apiCaller";
import { authStore } from "../store/authStore";
import { locationStore } from "../store/locationStore";
import { restaurantStore } from "../store/restaurantStore";
import { ENDPOINTS } from "../utils/endpoints";
import { getSocket } from "./socketService";

import type { MenuItem } from "../types/menu";

type Resp<T> = { data: T };

export interface ChatHistoryEntry {
  role: "user" | "assistant";
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
  const data = await apiCaller<Resp<ChatHistoryEntry[]>>({
    method: "GET",
    endpoint: ENDPOINTS.CHAT_HISTORY,
  });
  return data.data ?? [];
}

/**
 * Fetch the personalized welcome message for this session.
 */
export async function getWelcomeMessage(): Promise<string> {
  const data = await apiCaller<Resp<{ message?: string }>>({
    method: "GET",
    endpoint: ENDPOINTS.CHAT_WELCOME,
  });
  return data.data?.message ?? "";
}

export async function sendChatMessage(
  message: string,
): Promise<{ reply: string; recommended_items: MenuItem[] }> {
  const data = await apiCaller<Resp<{ reply: string; recommended_items: MenuItem[] }>>({
    method: "POST",
    endpoint: ENDPOINTS.CHAT,
    payload: { message, socket_id: getSocket()?.id ?? null },
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
  { onChunk, onDone, onError }: Partial<StreamCallbacks> = {},
): Promise<void> {
  const { sessionToken } = authStore.getState();
  const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  const locationHeaders: Record<string, string> = {};
  const enforceProximity = restaurantStore.getState().enforceProximity !== false;
  const { latitude, longitude, accuracy_m, captured_at } = locationStore.getState();
  const LOCATION_MAX_AGE_MS = 55_000;
  if (
    enforceProximity &&
    latitude != null && longitude != null && captured_at &&
    Date.now() - captured_at < LOCATION_MAX_AGE_MS
  ) {
    locationHeaders["x-customer-lat"]      = String(latitude);
    locationHeaders["x-customer-lng"]      = String(longitude);
    locationHeaders["x-customer-accuracy"] = String(Math.round(accuracy_m || 0));
    locationHeaders["x-customer-ts"]       = String(captured_at);
  }

  let response: Response;
  try {
    response = await fetch(`${baseURL}${ENDPOINTS.CHAT_STREAM}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
        ...locationHeaders,
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
  let sseBuffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      sseBuffer += decoder.decode(value, { stream: true });

      const events = sseBuffer.split("\n\n");
      sseBuffer = events.pop()!;

      for (const eventBlock of events) {
        for (const line of eventBlock.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as {
              type: string;
              text?: string;
              message?: string;
              items?: MenuItem[];
              mode?: string;
              options?: string[];
            };
            if (event.type === "chunk") onChunk?.(event.text ?? "");
            else if (event.type === "done")
              onDone?.(event.items ?? [], event.mode ?? "normal", event.options ?? []);
            else if (event.type === "error") onChunk?.(event.message ?? "");
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
