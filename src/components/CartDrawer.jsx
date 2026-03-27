import React from 'react';

export default function CartDrawer({
  isOpen,
  onClose,
  items = [],
  onAdd,
  onRemove,
  onPlaceOrder,
  total = 0,
  count = 0,
  loading = false,
  subtitle = '',
}) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/60 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="w-full max-w-md bg-slate-900 rounded-t-3xl max-h-[82vh] flex flex-col shadow-2xl">
          {/* Drag handle */}
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 bg-white/20 rounded-full" />
          </div>

          {/* Header */}
          <div className="px-5 py-3 flex items-center justify-between border-b border-white/10 shrink-0">
            <div>
              <h2 className="text-lg font-bold">Your Cart</h2>
              {subtitle && (
                <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white text-3xl leading-none w-8 h-8 flex items-center justify-center"
            >
              &times;
            </button>
          </div>

          {/* Items list */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
            {items.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12">
                <span className="text-4xl">🛒</span>
                <p className="text-slate-500 text-sm">Your cart is empty</p>
              </div>
            ) : (
              items.map((item) => {
                const itemId = item._id ?? item.id;
                return (
                  <div
                    key={itemId}
                    className="flex items-center gap-3 bg-slate-800 rounded-xl p-3"
                  >
                    {/* Veg indicator */}
                    <span
                      className="block w-2.5 h-2.5 rounded-full shrink-0 mt-0.5"
                      style={{
                        backgroundColor:
                          item.is_veg === true
                            ? '#22c55e'
                            : item.is_veg === false
                            ? '#ef4444'
                            : '#94a3b8',
                      }}
                    />

                    {/* Name + price */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-snug truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        ₹{item.price} &times; {item.qty} ={' '}
                        <span className="text-orange-400 font-bold">
                          ₹{item.price * item.qty}
                        </span>
                      </p>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onRemove(item)}
                        className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-base flex items-center justify-center active:scale-95 transition-transform"
                      >
                        −
                      </button>
                      <span className="text-sm font-bold w-4 text-center">
                        {item.qty}
                      </span>
                      <button
                        onClick={() => onAdd(item)}
                        className="w-7 h-7 rounded-full bg-orange-500 text-white font-bold text-base flex items-center justify-center active:scale-95 transition-transform"
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="px-5 pb-8 pt-3 border-t border-white/10 space-y-3 shrink-0">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">
                  {count} {count === 1 ? 'item' : 'items'}
                </span>
                <span className="font-bold text-xl">₹{total}</span>
              </div>
              <button
                onClick={onPlaceOrder}
                disabled={loading}
                className="w-full py-4 bg-orange-500 rounded-2xl font-bold text-white shadow-xl shadow-orange-500/20 active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Placing Order…' : 'Place Order Now 🍽️'}
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
