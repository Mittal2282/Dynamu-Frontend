import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  bulkUpdateIngredientStock,
  importIngredientsFromMenu,
  type Ingredient,
} from "../../../../services/dashboardService";

const UNITS = ["g", "kg", "ml", "L", "pcs", "units"] as const;
type Unit = (typeof UNITS)[number];

// ─── Stock bar ────────────────────────────────────────────────────────────────

function StockBar({ current, minimum }: { current: number; minimum: number }) {
  if (!minimum || minimum <= 0) return null;
  const pct = Math.min(100, Math.round((current / minimum) * 100));
  const color =
    current <= 0
      ? "#ef4444"
      : current <= minimum
      ? "#f59e0b"
      : "#22c55e";
  return (
    <div
      className="h-1.5 rounded-full overflow-hidden w-20 shrink-0"
      style={{ background: "var(--t-line)" }}
    >
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

function statusColor(ing: Ingredient): string {
  if (!ing.is_available || ing.current_stock <= 0) return "#ef4444";
  if (ing.minimum_stock > 0 && ing.current_stock <= ing.minimum_stock)
    return "#f59e0b";
  return "#22c55e";
}

// ─── Add Ingredient Modal ─────────────────────────────────────────────────────

interface AddIngredientModalProps {
  onClose: () => void;
  onSave: () => void;
}

function AddIngredientModal({ onClose, onSave }: AddIngredientModalProps) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState<Unit>("g");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit() {
    if (!name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    setError("");
    try {
      await createIngredient({
        name: name.trim(),
        unit,
        current_stock: stock ? Number(stock) : 0,
        minimum_stock: minStock ? Number(minStock) : 0,
      });
      onSave();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to create ingredient");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--t-line)" }}
        >
          <p className="text-sm font-bold" style={{ color: "var(--t-text)" }}>
            Add Ingredient
          </p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--t-float)", color: "var(--t-dim)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}>
              {error}
            </p>
          )}
          <div>
            <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>
              Name *
            </label>
            <input
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder="e.g. Paneer"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}
              >
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>
                Opening Stock
              </label>
              <input
                type="number"
                min={0}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>
              Low Stock Threshold (min)
            </label>
            <input
              type="number"
              min={0}
              value={minStock}
              onChange={(e) => setMinStock(e.target.value)}
              placeholder="0 = no threshold"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}
            />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--t-float)", color: "var(--t-text)", border: "1px solid var(--t-line)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "var(--t-accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Add Ingredient"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Bulk Update Modal ────────────────────────────────────────────────────────

interface BulkUpdateModalProps {
  ingredients: Ingredient[];
  onClose: () => void;
  onSave: () => void;
}

function BulkUpdateModal({ ingredients, onClose, onSave }: BulkUpdateModalProps) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleApply() {
    const updates = Object.entries(values)
      .filter(([, v]) => v !== "")
      .map(([name, v]) => ({ name, new_stock: Number(v) }));
    if (!updates.length) { onClose(); return; }
    setSaving(true);
    try {
      await bulkUpdateIngredientStock(updates);
      onSave();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && !saving && onClose()}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl flex flex-col"
        style={{
          background: "var(--t-surface)",
          border: "1px solid var(--t-line)",
          maxHeight: "80vh",
        }}
      >
        {/* Header */}
        <div
          className="shrink-0 px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--t-line)" }}
        >
          <div>
            <p className="text-sm font-bold" style={{ color: "var(--t-text)" }}>
              Bulk Stock Update
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--t-dim)" }}>
              Leave a field empty to skip that ingredient
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--t-float)", color: "var(--t-dim)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {/* Column headers */}
          <div
            className="grid grid-cols-3 gap-3 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide sticky top-0"
            style={{ borderBottom: "1px solid var(--t-line)", background: "var(--t-surface)", color: "var(--t-dim)" }}
          >
            <span>Ingredient</span>
            <span>Current</span>
            <span>New Stock</span>
          </div>
          {ingredients.map((ing) => (
            <div
              key={ing.name}
              className="grid grid-cols-3 gap-3 items-center px-5 py-2.5"
              style={{ borderBottom: "1px solid var(--t-line)" }}
            >
              <p className="text-sm font-semibold truncate" style={{ color: "var(--t-text)" }}>
                {ing.name}
              </p>
              <p className="text-sm tabular-nums" style={{ color: "var(--t-dim)" }}>
                {ing.current_stock} {ing.unit}
              </p>
              <div className="flex items-center gap-1">
                <input
                  type="number"
                  min={0}
                  value={values[ing.name] ?? ""}
                  onChange={(e) => setValues((p) => ({ ...p, [ing.name]: e.target.value }))}
                  placeholder={String(ing.current_stock)}
                  className="flex-1 px-2.5 py-1.5 rounded-lg text-sm outline-none min-w-0 tabular-nums"
                  style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}
                />
                <span className="text-[11px] shrink-0" style={{ color: "var(--t-dim)" }}>
                  {ing.unit}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="shrink-0 px-5 py-4 flex gap-3"
          style={{ borderTop: "1px solid var(--t-line)" }}
        >
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--t-float)", color: "var(--t-text)", border: "1px solid var(--t-line)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={saving}
            className="flex-[2] py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "var(--t-accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              "Apply Updates"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Ingredient Row ───────────────────────────────────────────────────────────

interface IngredientRowProps {
  ing: Ingredient;
  onNavigate: () => void;
  onStockSaved: (newStock: number) => void;
  onDelete: () => void;
}

function IngredientRow({ ing, onNavigate, onStockSaved, onDelete }: IngredientRowProps) {
  const [editing, setEditing] = useState(false);
  const [editVal, setEditVal] = useState(String(ing.current_stock));
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function startEdit(e: React.MouseEvent) {
    e.stopPropagation();
    setEditVal(String(ing.current_stock));
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 50);
  }

  async function saveEdit() {
    const newVal = Number(editVal);
    if (isNaN(newVal) || newVal === ing.current_stock) { setEditing(false); return; }
    setSaving(true);
    try {
      await updateIngredient(ing.name, { current_stock: newVal });
      onStockSaved(newVal);
    } finally {
      setSaving(false);
      setEditing(false);
    }
  }

  const dot = statusColor(ing);

  return (
    <div
      className="flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors"
      style={{ borderBottom: "1px solid var(--t-line)" }}
      onClick={onNavigate}
    >
      {/* Status dot */}
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: dot }}
      />

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: "var(--t-text)" }}>
          {ing.name}
        </p>
        {ing.recipe_count > 0 && (
          <p className="text-[11px] mt-0.5" style={{ color: "var(--t-dim)" }}>
            Used in {ing.recipe_count} {ing.recipe_count === 1 ? "dish" : "dishes"}
          </p>
        )}
      </div>

      {/* Stock bar */}
      {ing.minimum_stock > 0 && (
        <StockBar current={ing.current_stock} minimum={ing.minimum_stock} />
      )}

      {/* Stock value — click to edit inline */}
      <div
        className="flex items-center gap-1.5 shrink-0"
        onClick={startEdit}
      >
        {editing ? (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <input
              ref={inputRef}
              type="number"
              min={0}
              value={editVal}
              onChange={(e) => setEditVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") saveEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              onBlur={saveEdit}
              className="w-20 px-2 py-1 rounded-lg text-sm text-right outline-none tabular-nums"
              style={{ background: "var(--t-float)", border: "1px solid var(--t-accent)", color: "var(--t-text)" }}
            />
            <span className="text-xs" style={{ color: "var(--t-dim)" }}>{ing.unit}</span>
            {saving && <span className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--t-accent)" }} />}
          </div>
        ) : (
          <span
            className="text-sm font-semibold tabular-nums px-2.5 py-1 rounded-lg"
            style={{
              background: "var(--t-float)",
              border: "1px solid var(--t-line)",
              color: dot,
            }}
            title="Click to edit stock"
          >
            {ing.current_stock.toLocaleString("en-IN")} {ing.unit}
          </span>
        )}
      </div>

      {/* Min threshold */}
      {ing.minimum_stock > 0 && (
        <span className="text-[11px] shrink-0" style={{ color: "var(--t-dim)" }}>
          min {ing.minimum_stock}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: "var(--t-dim)", background: "var(--t-float)" }}
        title="Delete"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>

      {/* Chevron */}
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
        style={{ color: "var(--t-dim)" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

// ─── InventoryPage ────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [allIngredients, setAllIngredients] = useState<Ingredient[]>([]);

  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const filterRef = useRef({ search: "", status: "" });

  const loadIngredients = useCallback(async (page: number, reset: boolean, s: string, st: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const result = await getIngredients({ search: s || undefined, status: st || undefined, page, limit: 30 });
      setIngredients((prev) => (reset ? result.items as Ingredient[] : [...prev, ...(result.items as Ingredient[])]));
      setTotal(result.total);
      setHasMore(result.hasMore);
      if (!reset) setCurrentPage(page + 1);
      else setCurrentPage(2);
    } catch {
      // ignore
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Run import in parallel with initial list load.
    // If import added new entries, reload to reflect them.
    const listPromise = loadIngredients(1, true, "", "");
    const importPromise = importIngredientsFromMenu().catch(() => ({ imported: 0 }));
    Promise.all([listPromise, importPromise]).then(([, { imported }]) => {
      if (imported > 0) loadIngredients(1, true, "", "");
    });
  }, [loadIngredients]);

  useEffect(() => {
    filterRef.current = { search, status };
    setIngredients([]);
    setCurrentPage(1);
    setHasMore(true);
    loadIngredients(1, true, search, status);
  }, [search, status, loadIngredients]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMore && !loadingRef.current) {
        loadIngredients(currentPage, false, filterRef.current.search, filterRef.current.status);
      }
    }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, currentPage, loadIngredients]);

  function handleSearchChange(val: string) {
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => setSearch(val), 300);
  }

  async function handleDelete(name: string) {
    if (!confirm(`Delete ingredient "${name}"? This cannot be undone.`)) return;
    await deleteIngredient(name);
    refresh();
  }

  function refresh() {
    setIngredients([]);
    setCurrentPage(1);
    setHasMore(true);
    loadIngredients(1, true, filterRef.current.search, filterRef.current.status);
  }

  async function openBulk() {
    const result = await getIngredients({ limit: 200 });
    setAllIngredients(result.items as Ingredient[]);
    setShowBulk(true);
  }

  const STATUS_TABS = [
    { value: "", label: "All" },
    { value: "available", label: "Available" },
    { value: "low", label: "Low Stock" },
    { value: "out", label: "Out of Stock" },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between pb-4"
        style={{ borderBottom: "1px solid var(--t-line)" }}
      >
        <div>
          <h1 className="text-lg font-bold" style={{ color: "var(--t-text)" }}>
            Inventory
          </h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--t-dim)" }}>
            {total} ingredient{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={openBulk}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold"
            style={{ background: "var(--t-float)", color: "var(--t-text)", border: "1px solid var(--t-line)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Bulk Update
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
            style={{ background: "var(--t-accent)", color: "#fff" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Ingredient
          </button>
        </div>
      </div>

      {/* Search + filter */}
      <div className="shrink-0 flex items-center gap-2 py-3">
        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-xl shrink-0 w-[220px]"
          style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
        >
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: "var(--t-dim)" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search ingredients…"
            onChange={(e) => handleSearchChange(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none min-w-0"
            style={{ color: "var(--t-text)" }}
          />
        </div>

        {/* Status tabs */}
        <div className="flex items-center gap-1.5">
          {STATUS_TABS.map((tab) => {
            const active = status === tab.value;
            return (
              <button
                key={tab.value}
                onClick={() => setStatus(tab.value)}
                className="shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                style={{
                  background: active ? "var(--t-accent)" : "var(--t-surface)",
                  color: active ? "#fff" : "var(--t-dim)",
                  border: `1px solid ${active ? "var(--t-accent)" : "var(--t-line)"}`,
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto rounded-2xl"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        {ingredients.length === 0 && loading ? (
          <div className="space-y-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3.5 animate-pulse"
                style={{ borderBottom: "1px solid var(--t-line)" }}
              >
                <div className="w-2 h-2 rounded-full" style={{ background: "var(--t-line)" }} />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 rounded" style={{ background: "var(--t-line)", width: "30%" }} />
                  <div className="h-2.5 rounded" style={{ background: "var(--t-line)", width: "20%" }} />
                </div>
                <div className="h-7 w-20 rounded-lg" style={{ background: "var(--t-line)" }} />
              </div>
            ))}
          </div>
        ) : ingredients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"
                style={{ color: "var(--t-dim)", opacity: 0.5 }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--t-dim)" }}>
              No ingredients found
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl"
              style={{ background: "var(--t-accent)", color: "#fff" }}
            >
              Add First Ingredient
            </button>
          </div>
        ) : (
          <div className="group">
            {ingredients.map((ing) => (
              <IngredientRow
                key={ing.name}
                ing={ing}
                onNavigate={() => navigate(`/dashboard/inventory/${encodeURIComponent(ing.name)}`)}
                onStockSaved={(newStock) => {
                  setIngredients((prev) =>
                    prev.map((i) => (i.name === ing.name ? { ...i, current_stock: newStock } : i))
                  );
                }}
                onDelete={() => handleDelete(ing.name)}
              />
            ))}
            <div ref={sentinelRef} className="h-4 flex items-center justify-center">
              {loading && hasMore && (
                <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin"
                  style={{ borderColor: "var(--t-accent)" }} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAdd && (
        <AddIngredientModal
          onClose={() => setShowAdd(false)}
          onSave={() => { setShowAdd(false); refresh(); }}
        />
      )}
      {showBulk && (
        <BulkUpdateModal
          ingredients={allIngredients}
          onClose={() => setShowBulk(false)}
          onSave={() => { setShowBulk(false); refresh(); }}
        />
      )}
    </div>
  );
}
