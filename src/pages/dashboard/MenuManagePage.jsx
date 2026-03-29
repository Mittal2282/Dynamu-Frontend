import { useEffect, useState, useRef } from 'react';
import { getDashMenu, updateDashMenuItem, toggleDashMenuItem } from '../../services/adminService';

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

export default function MenuManagePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(null);

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

  if (loading) return <div className="text-slate-400 text-sm">Loading menu…</div>;
  if (error) return <div className="text-red-400 text-sm">{error}</div>;

  // Group by category
  const grouped = items.reduce((acc, item) => {
    const cat = item.category || 'Other';
    (acc[cat] = acc[cat] || []).push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Menu Management</h1>
        <p className="text-slate-400 text-sm mt-0.5">
          Click on a name or price to edit it inline. Toggle the switch to show/hide items from customers.
        </p>
      </div>

      {Object.entries(grouped).map(([category, catItems]) => (
        <div key={category}>
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">{category}</h2>
          <div className="bg-slate-900 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-slate-500 text-xs uppercase">
                  <th className="text-left px-4 py-2 w-6"></th>
                  <th className="text-left px-4 py-2">Name</th>
                  <th className="text-left px-4 py-2 w-28">Price</th>
                  <th className="text-center px-4 py-2 w-28">Available</th>
                </tr>
              </thead>
              <tbody>
                {catItems.map((item, idx) => (
                  <tr
                    key={item._id}
                    className={`${idx < catItems.length - 1 ? 'border-b border-white/5' : ''} ${saving === item._id ? 'opacity-60' : ''}`}
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <div className="text-center text-slate-500 py-12">No menu items found.</div>
      )}
    </div>
  );
}
