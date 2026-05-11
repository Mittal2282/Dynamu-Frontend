/**
 * Pure formatting utilities.
 * No side-effects — safe to use anywhere.
 */

/**
 * Format a number as currency.
 * @param amount
 * @param symbol  Currency symbol (default ₹)
 * @param decimals  Decimal places (default 0)
 * @returns e.g. "₹1,299"
 */
export function formatCurrency(
  amount: number | null | undefined,
  symbol: string = '₹',
  decimals: number = 0,
): string {
  if (amount === null || amount === undefined) return `${symbol}0`;
  const num = Number(amount);
  if (decimals > 0) {
    return `${symbol}${num.toFixed(decimals)}`;
  }
  return `${symbol}${num.toLocaleString('en-IN')}`;
}

/**
 * Format an ISO date string to a human-readable time.
 * @param isoString
 * @returns e.g. "2:45 PM"
 */
export function formatTime(isoString: string): string {
  if (!isoString) return '';
  return new Date(isoString).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format an ISO date string to a readable date.
 * @param isoString
 * @returns e.g. "28 Mar 2026"
 */
export function formatDate(isoString: string): string {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Get initials from a name string.
 * @param name
 * @returns e.g. "Rahul Sharma" → "RS"
 */
export function getInitials(name: string = ''): string {
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
 * @param str
 * @param maxLength  Default 60
 */
export function truncate(str: string, maxLength: number = 60): string {
  if (!str) return '';
  return str.length > maxLength ? `${str.slice(0, maxLength)}…` : str;
}
