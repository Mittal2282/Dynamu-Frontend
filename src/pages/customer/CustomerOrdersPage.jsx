import { useEffect, useState, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import Text from '../../components/ui/Text';
import { Spinner } from '../../components/ui/Spinner';
import { getCustomerOrders } from '../../services/customerService';
import { restaurantStore } from '../../store/restaurantStore';
import { formatCurrency } from '../../utils/formatters';

const ORDER_STATUS_BADGE = {
  pending:   'bg-yellow-500/20 text-yellow-300',
  confirmed: 'bg-blue-500/20 text-blue-300',
  preparing: 'bg-purple-500/20 text-purple-300',
  ready:     'bg-green-500/20 text-green-300',
  served:    'bg-slate-500/20 text-slate-300',
  cancelled: 'bg-red-500/20 text-red-300',
  completed: 'bg-slate-500/20 text-slate-300',
};

const ORDER_STATUS_LABEL = {
  pending:   'Waiting',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready:     'Ready!',
  served:    'Served',
  cancelled: 'Cancelled',
  completed: 'Done',
};

export default function CustomerOrdersPage() {
  const { orderVersion } = useOutletContext();
  const { currencySymbol, tableNumber: storedTable } = restaurantStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getCustomerOrders();
      setOrders(data);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  // Poll every 15s
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  // Immediate re-fetch on socket push (order placed or status changed)
  useEffect(() => {
    if (orderVersion > 0) fetchOrders();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderVersion]);

  if (loading) return (
    <div className="flex justify-center py-10">
      <Spinner size="md" />
    </div>
  );

  if (orders.length === 0) return (
    <div className="flex flex-col items-center justify-center py-14 text-center gap-3">
      <span className="text-4xl">🍽️</span>
      <Text color="muted" size="sm">No orders placed yet.</Text>
      <Text color="muted" size="xs">Add items from the menu and place your order!</Text>
    </div>
  );

  const original  = orders.find(o => !o.is_addon);
  const addons    = orders.filter(o => o.is_addon);
  const grandTotal = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const formatTime = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  function OrderBatch({ order, label }) {
    return (
      <div className="space-y-1.5">
        <div className="flex items-center justify-between gap-2">
          <Text size="xs" color="muted">
            {label} · #{order.order_number} · {formatTime(order.createdAt)}
          </Text>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${ORDER_STATUS_BADGE[order.status] ?? 'bg-white/10 text-slate-300'}`}>
            {ORDER_STATUS_LABEL[order.status] ?? order.status}
          </span>
        </div>
        <ul className="space-y-0.5">
          {order.items?.map((item, i) => (
            <li key={i} className="flex justify-between text-xs text-slate-400">
              <span>{item.name}</span>
              <span>×{item.quantity}</span>
            </li>
          ))}
        </ul>
        {order.estimated_prep_time && (
          <Text size="xs" color="secondary">
            Est. ready in ~{order.estimated_prep_time} min
          </Text>
        )}
      </div>
    );
  }

  return (
    <div className="px-4 py-4 pb-24">
      <div className="bg-slate-800/80 border border-white/5 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Text size="sm" weight="bold">Your Order</Text>
          {storedTable && <Text size="xs" color="muted">Table {storedTable}</Text>}
        </div>

        {original && <OrderBatch order={original} label="Order" />}

        {addons.map((addon, idx) => (
          <div key={addon._id} className="pt-2 border-t border-white/10">
            <OrderBatch order={addon} label={`Add-on${addons.length > 1 ? ` ${idx + 1}` : ''}`} />
          </div>
        ))}

        <div className="pt-2 border-t border-white/10 flex justify-between">
          <Text size="xs" color="muted">Total</Text>
          <Text size="sm" weight="bold" color="brand">
            {formatCurrency(grandTotal, currencySymbol)}
          </Text>
        </div>
      </div>

      <Text size="xs" color="muted" className="text-center py-2">
        Status updates automatically every 15s
      </Text>
    </div>
  );
}
