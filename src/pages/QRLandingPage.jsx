import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api/axiosInstance';

export default function QRLandingPage() {
  const { qrCodeId } = useParams();

  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [restaurant, setRestaurant]   = useState(null);
  const [table, setTable]             = useState(null);
  const [menu, setMenu]               = useState({});           // { CATEGORY: [items] }
  const [selected, setSelected]       = useState(null);

  useEffect(() => {
    api.post('/api/customer/session/start', { qr_code_id: qrCodeId })
      .then(res => {
        const { session_token, restaurant, table, menu } = res.data.data;
        localStorage.setItem('session_token', session_token);
        setRestaurant(restaurant);
        setTable(table);
        setMenu(menu);
        setSelected(Object.keys(menu)[0] ?? null);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Could not load the menu. Please scan the QR again.');
      })
      .finally(() => setLoading(false));
  }, [qrCodeId]);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-slate-400 text-sm">Loading menu…</p>
      </div>
    );
  }

  /* ── Error ── */
  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-3 px-6 text-center text-white">
        <p className="text-4xl">😕</p>
        <p className="text-slate-300">{error}</p>
      </div>
    );
  }

  const categories = Object.keys(menu);
  const items      = selected ? (menu[selected] ?? []) : [];

  /* ── Menu ── */
  return (
    <div className="max-w-md mx-auto min-h-screen bg-slate-950 text-white flex flex-col">

      {/* Header */}
      <div className="bg-slate-900 px-4 pt-6 pb-4 sticky top-0 z-20">
        <h1 className="text-2xl font-bold">{restaurant.name}</h1>
        <p className="text-sm text-slate-400 mt-0.5">Table {table.table_number} &nbsp;·&nbsp; Scan to order</p>

        {/* Category strip */}
        <div className="flex gap-2 overflow-x-auto mt-4 pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelected(cat)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selected === cat
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-10">
        {items.length === 0 && (
          <p className="text-slate-500 text-center mt-10">No items in this category.</p>
        )}
        {items.map(item => (
          <div key={item._id} className="bg-slate-800 rounded-xl p-4 flex gap-3 items-start">

            {/* Veg / non-veg dot */}
            <span className="mt-1 shrink-0">
              <span
                className="block w-3 h-3 rounded-full border-2"
                style={{
                  borderColor: item.is_veg ? '#22c55e' : '#ef4444',
                  backgroundColor: item.is_veg ? '#22c55e' : '#ef4444',
                }}
              />
            </span>

            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <span className="font-semibold text-sm leading-snug">{item.name}</span>
                <span className="text-orange-400 font-bold text-sm shrink-0">
                  ₹{item.price_label ?? item.price}
                </span>
              </div>
              {item.description && (
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{item.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-3 text-xs text-slate-600">
        Powered by Dynamu
      </div>
    </div>
  );
}
