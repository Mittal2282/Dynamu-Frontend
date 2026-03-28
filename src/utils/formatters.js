/**
 * Pure formatting utilities.
 * No side-effects — safe to use anywhere.
 */

/**
 * Format a number as currency.
 * @param {number} amount
 * @param {string} [symbol='₹']
 * @returns {string}  e.g. "₹1,299"
 */
export function formatCurrency(amount, symbol = '₹') {
  if (amount === null || amount === undefined) return `${symbol}0`;
  return `${symbol}${Number(amount).toLocaleString('en-IN')}`;
}

/**
 * Format an ISO date string to a human-readable time.
 * @param {string} isoString
 * @returns {string}  e.g. "2:45 PM"
 */
export function formatTime(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format an ISO date string to a readable date.
 * @param {string} isoString
 * @returns {string}  e.g. "28 Mar 2026"
 */
export function formatDate(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get initials from a name string.
 * @param {string} name
 * @returns {string}  e.g. "Rahul Sharma" → "RS"
 */
export function getInitials(name = '') {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

/**
 * Truncate a string to a given length with ellipsis.
 * @param {string} str
 * @param {number} [maxLength=60]
 * @returns {string}
 */
export function truncate(str, maxLength = 60) {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}
