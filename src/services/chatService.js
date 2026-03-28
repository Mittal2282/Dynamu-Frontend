import { apiCaller } from '../api/apiCaller';
import { ENDPOINTS } from '../utils/endpoints';

/**
 * AI chat API services.
 */

/**
 * Fetch the full conversation history for the current session.
 * @returns {Promise<Array<{ role, content }>>}
 */
export async function getChatHistory() {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.CHAT_HISTORY });
  return data.data ?? [];
}

/**
 * Fetch the personalized welcome message for this session.
 * @returns {Promise<string>}
 */
export async function getWelcomeMessage() {
  const data = await apiCaller({ method: 'GET', endpoint: ENDPOINTS.CHAT_WELCOME });
  return data.data?.message ?? '';
}

/**
 * Send a chat message and receive AI reply + recommendations.
 * @param {string} message
 * @returns {Promise<{ reply: string, recommended_items: Array }>}
 */
export async function sendChatMessage(message) {
  const data = await apiCaller({
    method:   'POST',
    endpoint: ENDPOINTS.CHAT,
    payload:  { message },
  });
  return data.data;
}
