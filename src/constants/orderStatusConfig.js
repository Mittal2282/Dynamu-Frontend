/**
 * Shared order status visuals — keep in sync with restaurant dashboard and customer orders.
 * @see src/pages/dashboard/OrdersPage.jsx (imports this module)
 */

export const ORDER_STATUSES = ['pending', 'confirmed', 'preparing', 'ready', 'served'];

/** @type {Record<string, { label: string, dot: string, badge: string, stripe: string, stripeSolid: string, next: string|null, nextLabel: string|null, dashboardGroup: string }>} */
export const ORDER_STATUS_CONFIG = {
  pending: {
    label: 'New',
    dot: 'bg-yellow-400',
    badge: 'bg-yellow-500/20 text-yellow-400',
    stripe: 'from-yellow-500 to-yellow-400',
    stripeSolid: 'bg-yellow-500',
    next: 'confirmed',
    nextLabel: 'Confirm',
    dashboardGroup: 'allocated',
  },
  confirmed: {
    label: 'Confirmed',
    dot: 'bg-blue-400',
    badge: 'bg-blue-500/20 text-blue-400',
    stripe: 'from-blue-500 to-blue-400',
    stripeSolid: 'bg-blue-500',
    next: 'preparing',
    nextLabel: 'Start Preparing',
    dashboardGroup: 'allocated',
  },
  preparing: {
    label: 'Preparing',
    dot: 'bg-purple-400',
    badge: 'bg-purple-500/20 text-purple-400',
    stripe: 'from-purple-500 to-purple-400',
    stripeSolid: 'bg-purple-500',
    next: 'ready',
    nextLabel: 'Mark Ready',
    dashboardGroup: 'inprogress',
  },
  ready: {
    label: 'Ready',
    dot: 'bg-green-400',
    badge: 'bg-green-500/20 text-green-400',
    stripe: 'from-green-500 to-green-400',
    stripeSolid: 'bg-green-500',
    next: 'served',
    nextLabel: 'Mark Served',
    dashboardGroup: 'inprogress',
  },
  served: {
    label: 'Served',
    dot: 'bg-slate-400',
    badge: 'bg-slate-500/20 text-slate-300',
    stripe: 'from-slate-500 to-slate-600',
    stripeSolid: 'bg-slate-500',
    next: null,
    nextLabel: null,
    dashboardGroup: 'completed',
  },
  cancelled: {
    label: 'Cancelled',
    dot: 'bg-red-400',
    badge: 'bg-red-500/20 text-red-400',
    stripe: 'from-red-500 to-red-400',
    stripeSolid: 'bg-red-500',
    next: null,
    nextLabel: null,
    dashboardGroup: 'completed',
  },
  completed: {
    label: 'Done',
    dot: 'bg-slate-400',
    badge: 'bg-slate-500/20 text-slate-300',
    stripe: 'from-slate-500 to-slate-600',
    stripeSolid: 'bg-slate-500',
    next: null,
    nextLabel: null,
    dashboardGroup: 'completed',
  },
};

/** Dashboard 3-column layout config */
export const DASHBOARD_COLUMNS = [
  { key: 'allocated',  label: 'Allocated',   color: '#f59e0b' },
  { key: 'inprogress', label: 'In Progress', color: '#a855f7' },
  { key: 'completed',  label: 'Completed',   color: '#22c55e' },
];

/**
 * @param {string} status
 */
export function getOrderStatusConfig(status) {
  if (status === 'completed') return ORDER_STATUS_CONFIG.completed;
  if (status === 'cancelled') return ORDER_STATUS_CONFIG.cancelled;
  return ORDER_STATUS_CONFIG[status] || ORDER_STATUS_CONFIG.served;
}

/** Customer-facing 3-phase label */
export function getCustomerPhase(status) {
  if (status === 'pending') return 'waiting';
  if (['confirmed', 'preparing', 'ready'].includes(status)) return 'preparing';
  return 'completed';
}

/** Customer-facing phase line (uppercase in UI) */
export const CUSTOMER_STATUS_PHASE = {
  pending:   'Kitchen Queue',
  confirmed: 'Confirmed',
  preparing: 'High Heat',
  ready:     'Ready',
  served:    'Served',
  cancelled: 'Cancelled',
  completed: 'Done',
};
