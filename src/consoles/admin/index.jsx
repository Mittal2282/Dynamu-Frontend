import React, { useContext } from 'react';
import { AppContext } from '../../store/AppContext';

export default function AdminPage() {
  const { orders } = useContext(AppContext);

  return (
    <div className="page-transition space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-secondary">Kitchen Display</h2>
        <span className="bg-white/10 px-3 py-1 rounded-full text-[10px] animate-pulse">Live</span>
      </div>
      {orders.length === 0 ? (
        <p className="text-slate-400">Waiting for first order...</p>
      ) : (
        <div className="space-y-4">
          {orders.map(order => (
            <div key={order.id} className="glass border-l-4 border-secondary p-4 space-y-2">
              <div className="flex justify-between">
                <span className="font-bold">Table {order.table_number}</span>
                <span className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
              </div>
              <div className="text-sm space-y-1">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{it.qty}x {it.name}</span>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex justify-between items-center">
                <span className="text-secondary font-bold">₹{order.total_price}</span>
                <button className="bg-white/10 px-3 py-1 rounded-lg text-xs">Mark Done</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
