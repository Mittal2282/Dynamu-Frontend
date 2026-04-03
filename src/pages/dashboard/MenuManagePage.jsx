import { useEffect, useState, useRef } from 'react';
import { getDashMenu, updateDashMenuItem, toggleDashMenuItem, toggleChefsSpecial, toggleFeatured } from '../../services/adminService';

const VEG_INDICATOR = { true: '🟢', false: '🔴' };

function EditableCell({ value, onSave, type = 'text' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const parsed = type === 'number' ? parseFloat(draft) : draft.trim();
    if (parsed !== value) onSave(parsed);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
        className="bg-slate-700 border border-orange-500 rounded px-2 py-0.5 text-sm text-white w-full focus:outline-none"
      />
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className="cursor-pointer hover:text-orange-400 transition-colors"
      title="Click to edit"
    >
      {type === 'number' ? `₹${value}` : value}
    </span>
  );
}

function DiscountCell({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    setEditing(false);
    const parsed = parseFloat(draft);
    if (!isNaN(parsed) && parsed !== value) onSave(parsed);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1 justify-center">
        <input
          ref={inputRef}
          type="number"
          min="0"
          max="100"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setDraft(value); setEditing(false); } }}
          className="bg-slate-700 border border-orange-500 rounded px-2 py-0.5 text-sm text-white w-14 focus:outline-none"
        />
        <span className="text-slate-400 text-xs">%</span>
      </div>
    );
  }

  return (
    <span
      onClick={() => { setDraft(value); setEditing(true); }}
      className={`cursor-pointer text-xs font-semibold transition-colors ${value > 0 ? 'text-amber-400 hover:text-amber-300' : 'text-slate-600 hover:text-amber-400'}`}
      title="Click to edit discount"
    >
      {value > 0 ? `${value}%` : '—'}
    </span>
  );
}

export default function MenuManagePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);

  // Search & filter
  const [searchQuery, setSearchQuery]   = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [availFilter, setAvailFilter]   = useState('all'); // 'all' | 'available' | 'unavailable'

  useEffect(() => {
    getDashMenu()
      .then(setItems)
      .catch(() => setError('Failed to load menu.'))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdate = async (id, field, val) => {
    setSaving(id);
    try {
      const updated = await updateDashMenuItem(id, { [field]: val });
      setItems(prev => prev.map(it => it._id === id ? { ...it, ...updated } : it));
    } catch {
      alert('Failed to save change.');
    } finally {
      setSaving(null);
    }
  };

  const handleToggle = async (id) => {
    setSaving(id);
    try {
      const updated = await toggleDashMenuItem(id);
      setItems(prev => prev.map(it => it._id === id ? { ...it, ...updated } : it));
    } catch {
      alert('Failed to toggle availability.');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleChefsSpecial = async (id) => {
    setSaving(id);
    try {
      const updated = await toggleChefsSpecial(id);
      setItems(prev => prev.map(it => it._id === id ? { ...it, ...updated } : it));
    } catch {
      alert('Failed to toggle Chef\'s Special.');
    } finally {
      setSaving(null);
    }
  };

  const handleToggleFeatured = async (id) => {
    setSaving(id);
    try {
      const updated = await toggleFeatured(id);
      setItems(prev => prev.map(it => it._id === id ? { ...it, ...updated } : it));
    } catch {
      alert('Failed to toggle Featured.');
    } finally {
      setSaving(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-48 gap-3">
      <div className="w-6 h-6 border-[3px] border-white/10 border-t-orange-500 rounded-full animate-spin" />
      <span className="text-slate-500 text-sm">Loading menu…</span>
    </div>
  );
  if (error) return (
    <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">{error}</div>
  );

  const allCategories = [...new Set(items.map(i => i.category || 'Other'))].sort();

  // Apply search + filters
  const visibleItems = items.filter(item => {
    if (categoryFilter && (item.category || 'Other') !== categoryFilter) return false;
    if (availFilter === 'available' && !item.is_available) return false;
    if (availFilter === 'unavailable' && item.is_available) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const inName = (item.name || '').toLowerCase().includes(q);
      const inCat  = (item.category || '').toLowerCase().includes(q);
      const inDesc = (item.description || '').toLowerCase().includes(q);
      if (!inName && !inCat && !inDesc) return false;
    }
    return true;
  });

  // Group filtered items by category
  const grouped = visibleItems.reduce((acc, item) => {
    const cat = item.category || 'Other';
    (acc[cat] = acc[cat] || []).push(item);
    return acc;
  }, {});

  const isFiltering = searchQuery.trim() !== '' || categoryFilter !== '' || availFilter !== 'all';

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ background: 'linear-gradient(90deg, #fff 30%, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
        >
          Menu Management
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Click on a name or price to edit inline. Toggle the switch to show/hide items from customers.
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search items…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            style={{ '--tw-border-opacity': 1 }}
            onFocus={e => e.target.style.borderColor = 'var(--t-accent)'}
            onBlur={e => e.target.style.borderColor = ''}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none transition-colors"
        >
          <option value="">All categories</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Availability filter */}
        <div className="flex rounded-xl border border-white/10 overflow-hidden text-xs font-semibold bg-white/5">
          {[
            { value: 'all',         label: 'All' },
            { value: 'available',   label: 'Available' },
            { value: 'unavailable', label: 'Hidden' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setAvailFilter(opt.value)}
              className={`px-3 py-2 transition-all duration-150 ${
                availFilter === opt.value
                  ? 'text-white'
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
              }`}
              style={availFilter === opt.value ? { background: 'var(--t-accent)' } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Clear filters */}
        {isFiltering && (
          <button
            onClick={() => { setSearchQuery(''); setCategoryFilter(''); setAvailFilter('all'); }}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Results count when filtering */}
      {isFiltering && (
        <p className="text-xs text-slate-500">
          {visibleItems.length} of {items.length} items
        </p>
      )}

      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category}>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">{category}</h2>
            <span className="text-[11px] text-slate-600">{catItems.length} items</span>
          </div>
          <div className="bg-slate-900 rounded-2xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-[11px] uppercase tracking-wider">
                  <th className="text-left px-4 py-3 w-6"></th>
                  <th className="text-left px-4 py-3">Name</th>
                  <th className="text-left px-4 py-3 w-28">Price</th>
                  <th className="text-center px-4 py-3 w-28">Available</th>
                  <th className="text-center px-4 py-3 w-28">Chef's Special</th>
                  <th className="text-center px-4 py-3 w-24">Featured</th>
                  <th className="text-center px-4 py-3 w-24">Discount</th>
                </tr>
              </thead>
              <tbody>
                {catItems.map((item, idx) => (
                  <tr
                    key={item._id}
                    className={`${idx < catItems.length - 1 ? 'border-b border-white/5' : ''} ${saving === item._id ? 'opacity-60' : ''} ${!item.is_available ? 'opacity-50' : ''}`}
                  >
                    <td className="px-4 py-3 text-center text-xs">{VEG_INDICATOR[item.is_veg] ?? '⚪'}</td>
                    <td className="px-4 py-3 text-white">
                      <EditableCell
                        value={item.name}
                        onSave={val => handleUpdate(item._id, 'name', val)}
                      />
                    </td>
                    <td className="px-4 py-3 text-white">
                      <EditableCell
                        value={item.price}
                        type="number"
                        onSave={val => handleUpdate(item._id, 'price', val)}
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggle(item._id)}
                        disabled={saving === item._id}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                          item.is_available ? 'bg-green-500' : 'bg-slate-600'
                        }`}
                        title={item.is_available ? 'Available — click to hide' : 'Hidden — click to show'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ${
                            item.is_available ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleChefsSpecial(item._id)}
                        disabled={saving === item._id}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                          item.is_chefs_special ? 'bg-amber-500' : 'bg-slate-600'
                        }`}
                        title={item.is_chefs_special ? "Chef's Special — click to remove" : "Mark as Chef's Special"}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ${
                            item.is_chefs_special ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleFeatured(item._id)}
                        disabled={saving === item._id}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
                          item.is_featured ? 'bg-blue-500' : 'bg-slate-600'
                        }`}
                        title={item.is_featured ? 'Featured — click to unfeature' : 'Mark as Featured'}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ${
                            item.is_featured ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <DiscountCell
                        value={item.discount_percentage ?? 0}
                        onSave={val => handleUpdate(item._id, 'discount_percentage', Math.min(100, Math.max(0, val)))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {visibleItems.length === 0 && (
        <div className="bg-slate-900 border border-white/10 rounded-2xl flex flex-col items-center justify-center py-16 gap-3 text-center">
          <span className="text-4xl">{isFiltering ? '🔍' : '📋'}</span>
          <p className="text-slate-500 text-sm">{isFiltering ? 'No items match your search.' : 'No menu items found.'}</p>
          {isFiltering && (
            <button
              onClick={() => { setSearchQuery(''); setCategoryFilter(''); setAvailFilter('all'); }}
              className="text-xs text-orange-400 hover:text-orange-300 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
