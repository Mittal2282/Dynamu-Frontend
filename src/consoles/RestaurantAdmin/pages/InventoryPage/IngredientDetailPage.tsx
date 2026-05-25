import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getIngredientDetail,
  getIngredientLedger,
  updateIngredient,
  updateMenuItemRecipe,
  getDashMenu,
  type IngredientDetail,
  type LedgerEntry,
  type RecipeEntry,
} from "../../../../services/dashboardService";
import type { MenuItem } from "../../../../types/menu";

const UNITS = ["g", "kg", "ml", "L", "pcs", "units"] as const;
type Unit = (typeof UNITS)[number];

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

// ─── Edit Ingredient Modal ────────────────────────────────────────────────────

interface EditIngredientModalProps {
  ingredient: IngredientDetail["ingredient"];
  onClose: () => void;
  onSave: () => void;
}

function EditIngredientModal({ ingredient, onClose, onSave }: EditIngredientModalProps) {
  const [name, setName] = useState(ingredient.name);
  const [unit, setUnit] = useState<Unit>((ingredient.unit as Unit) ?? "units");
  const [stock, setStock] = useState(String(ingredient.current_stock));
  const [minStock, setMinStock] = useState(String(ingredient.minimum_stock));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      await updateIngredient(ingredient.name, {
        current_stock: Number(stock),
        unit,
        minimum_stock: Number(minStock),
        new_name: name.trim() !== ingredient.name ? name.trim() : undefined,
      });
      onSave();
    } catch (e: unknown) {
      setError((e as Error).message ?? "Failed to update");
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
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--t-line)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--t-text)" }}>Edit Ingredient</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--t-float)", color: "var(--t-dim)" }}>
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
            <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>Current Stock</label>
              <input type="number" min={0} value={stock} onChange={(e) => setStock(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none tabular-nums"
                style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }} />
            </div>
          </div>
          <div>
            <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>Low Stock Threshold</label>
            <input type="number" min={0} value={minStock} onChange={(e) => setMinStock(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none tabular-nums"
              style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }} />
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--t-float)", color: "var(--t-text)", border: "1px solid var(--t-line)" }}>
            Cancel
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "var(--t-accent)", color: "#fff", opacity: saving ? 0.7 : 1 }}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Add Menu Item Modal ──────────────────────────────────────────────────────

interface AddMenuItemModalProps {
  ingredientName: string;
  ingredientUnit: string;
  existingMenuItems: IngredientDetail["menuItems"];
  onClose: () => void;
  onSave: () => void;
}

function AddMenuItemModal({ ingredientName, ingredientUnit, existingMenuItems, onClose, onSave }: AddMenuItemModalProps) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState<Unit>((ingredientUnit as Unit) ?? "g");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getDashMenu({ limit: 100 }).then((r) => setMenuItems(r.items)).catch(() => {});
  }, []);

  const filtered = menuItems.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase())
  );

  async function handleAdd() {
    if (!selectedId || !qty) return;
    const menuItem = menuItems.find((m) => m._id === selectedId);
    if (!menuItem) return;

    // Get existing recipe and append/update this ingredient
    const existing = existingMenuItems.find((e) => e._id === selectedId);
    const currentRecipe: RecipeEntry[] = (menuItem as unknown as { recipe?: RecipeEntry[] }).recipe ?? [];

    let newRecipe: RecipeEntry[];
    if (existing) {
      newRecipe = currentRecipe.map((r) =>
        r.name.toLowerCase() === ingredientName.toLowerCase()
          ? { ...r, quantity: Number(qty), unit }
          : r
      );
    } else {
      const alreadyInRecipe = currentRecipe.find((r) => r.name.toLowerCase() === ingredientName.toLowerCase());
      if (alreadyInRecipe) {
        newRecipe = currentRecipe.map((r) =>
          r.name.toLowerCase() === ingredientName.toLowerCase()
            ? { ...r, quantity: Number(qty), unit }
            : r
        );
      } else {
        newRecipe = [...currentRecipe, { name: ingredientName, quantity: Number(qty), unit }];
      }
    }

    setSaving(true);
    try {
      await updateMenuItemRecipe(selectedId, newRecipe);
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
        className="w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--t-line)" }}>
          <p className="text-sm font-bold" style={{ color: "var(--t-text)" }}>Link Menu Item</p>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: "var(--t-float)", color: "var(--t-dim)" }}>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>Menu Item</label>
            <input
              type="text"
              placeholder="Search menu items…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 rounded-xl text-sm outline-none mb-2"
              style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}
            />
            <div className="max-h-36 overflow-y-auto rounded-xl" style={{ border: "1px solid var(--t-line)" }}>
              {filtered.length === 0 ? (
                <p className="text-xs text-center py-4" style={{ color: "var(--t-dim)" }}>No items found</p>
              ) : (
                filtered.map((m) => {
                  const linked = existingMenuItems.find((e) => e._id === m._id);
                  return (
                    <div
                      key={m._id}
                      onClick={() => setSelectedId(m._id)}
                      className="flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-colors"
                      style={{
                        background: selectedId === m._id ? "rgba(var(--t-accent-rgb,249,115,22),0.08)" : "transparent",
                        borderBottom: "1px solid var(--t-line)",
                      }}
                    >
                      <span className="w-2 h-2 rounded-sm shrink-0"
                        style={{ background: m.is_veg !== false ? "#22c55e" : "#ef4444" }} />
                      <span className="flex-1 text-sm truncate" style={{ color: "var(--t-text)" }}>{m.name}</span>
                      {linked && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded"
                          style={{ background: "rgba(var(--t-accent-rgb,249,115,22),0.1)", color: "var(--t-accent)" }}>
                          {linked.recipe_entry?.quantity}{linked.recipe_entry?.unit}
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>Quantity</label>
              <input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)}
                placeholder="e.g. 200"
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none tabular-nums"
                style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }} />
            </div>
            <div>
              <label className="block text-[11px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>Unit</label>
              <select value={unit} onChange={(e) => setUnit(e.target.value as Unit)}
                className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
                style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5 flex gap-3">
          <button onClick={onClose} disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "var(--t-float)", color: "var(--t-text)", border: "1px solid var(--t-line)" }}>
            Cancel
          </button>
          <button onClick={handleAdd} disabled={saving || !selectedId || !qty}
            className="flex-1 py-2.5 rounded-xl text-sm font-bold flex items-center justify-center gap-2"
            style={{ background: "var(--t-accent)", color: "#fff", opacity: (saving || !selectedId || !qty) ? 0.6 : 1 }}>
            {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Link Item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── IngredientDetailPage ─────────────────────────────────────────────────────

export default function IngredientDetailPage() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();
  const ingredientName = decodeURIComponent(name ?? "");

  const [detail, setDetail] = useState<IngredientDetail | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [ledgerHasMore, setLedgerHasMore] = useState(true);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"used-in" | "ledger">("used-in");
  const [showEdit, setShowEdit] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [editUnit, setEditUnit] = useState<Unit>("g");
  const [savingRow, setSavingRow] = useState(false);

  const loadDetail = useCallback(async () => {
    setLoading(true);
    try {
      const d = await getIngredientDetail(ingredientName);
      setDetail(d);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [ingredientName]);

  const loadLedger = useCallback(async (page: number, reset: boolean) => {
    setLedgerLoading(true);
    try {
      const result = await getIngredientLedger(ingredientName, { page, limit: 20 });
      setLedger((prev) => (reset ? result.items : [...prev, ...result.items]));
      setLedgerTotal(result.total);
      setLedgerHasMore(result.hasMore);
      if (!reset) setLedgerPage(page + 1);
      else setLedgerPage(2);
    } finally {
      setLedgerLoading(false);
    }
  }, [ingredientName]);

  useEffect(() => { loadDetail(); }, [loadDetail]);

  useEffect(() => {
    if (tab === "ledger" && ledger.length === 0) loadLedger(1, true);
  }, [tab, ledger.length, loadLedger]);

  async function handleRemoveMenuItemLink(menuItemId: string) {
    if (!detail) return;
    const mi = detail.menuItems.find((m) => m._id === menuItemId);
    if (!mi) return;
    const currentRecipe: RecipeEntry[] = (mi as unknown as { recipe?: RecipeEntry[] }).recipe ??
      (mi.recipe_entry ? [{ name: ingredientName, ...mi.recipe_entry }] : []);
    const newRecipe = currentRecipe.filter((r) => r.name.toLowerCase() !== ingredientName.toLowerCase());
    await updateMenuItemRecipe(menuItemId, newRecipe);
    loadDetail();
  }

  async function handleSaveRowEdit(menuItemId: string) {
    if (!detail) return;
    const mi = detail.menuItems.find((m) => m._id === menuItemId);
    if (!mi) return;
    setSavingRow(true);
    try {
      const currentRecipe: RecipeEntry[] = (mi as unknown as { recipe?: RecipeEntry[] }).recipe ??
        (mi.recipe_entry ? [{ name: ingredientName, ...mi.recipe_entry }] : []);
      const newRecipe = currentRecipe.map((r) =>
        r.name.toLowerCase() === ingredientName.toLowerCase()
          ? { name: ingredientName, quantity: Number(editQty), unit: editUnit }
          : r
      );
      if (!currentRecipe.find((r) => r.name.toLowerCase() === ingredientName.toLowerCase())) {
        newRecipe.push({ name: ingredientName, quantity: Number(editQty), unit: editUnit });
      }
      await updateMenuItemRecipe(menuItemId, newRecipe);
      setEditRowId(null);
      loadDetail();
    } finally {
      setSavingRow(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <span className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin"
          style={{ borderColor: "var(--t-accent)" }} />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="flex flex-col items-center justify-center h-40 gap-3">
        <p className="text-sm" style={{ color: "var(--t-dim)" }}>Ingredient not found</p>
        <button onClick={() => navigate("/dashboard/inventory")}
          className="text-xs font-semibold px-3 py-1.5 rounded-xl"
          style={{ background: "var(--t-accent)", color: "#fff" }}>
          Back to Inventory
        </button>
      </div>
    );
  }

  const { ingredient, menuItems } = detail;
  const currentStock = ingredient.current_stock ?? 0;
  const minStock = ingredient.minimum_stock ?? 0;
  const statusColor = !ingredient.is_available || currentStock <= 0
    ? "#ef4444"
    : minStock > 0 && currentStock <= minStock
    ? "#f59e0b"
    : "#22c55e";
  const statusLabel = !ingredient.is_available
    ? "Unavailable"
    : currentStock <= 0
    ? "Out of Stock"
    : minStock > 0 && currentStock <= minStock
    ? "Low Stock"
    : "Available";

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      {/* Back */}
      <button
        onClick={() => navigate("/dashboard/inventory")}
        className="flex items-center gap-1.5 text-xs font-semibold w-fit"
        style={{ color: "var(--t-dim)" }}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Inventory
      </button>

      {/* Header card */}
      <div
        className="shrink-0 rounded-2xl px-5 py-4"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: statusColor }} />
              <h1 className="text-xl font-bold" style={{ color: "var(--t-text)" }}>{ingredient.name}</h1>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{
                  background: `${statusColor}20`,
                  color: statusColor,
                }}
              >
                {statusLabel}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>Current Stock</p>
                <p className="text-2xl font-bold tabular-nums mt-0.5" style={{ color: statusColor }}>
                  {currentStock.toLocaleString("en-IN")}
                  <span className="text-sm font-semibold ml-1" style={{ color: "var(--t-dim)" }}>{ingredient.unit}</span>
                </p>
              </div>
              {minStock > 0 && (
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>Min Threshold</p>
                  <p className="text-lg font-bold tabular-nums mt-0.5" style={{ color: "var(--t-text)" }}>
                    {minStock} {ingredient.unit}
                  </p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--t-dim)" }}>Used In</p>
                <p className="text-lg font-bold mt-0.5" style={{ color: "var(--t-text)" }}>
                  {menuItems.length} {menuItems.length === 1 ? "dish" : "dishes"}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowEdit(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shrink-0"
            style={{ background: "var(--t-float)", color: "var(--t-text)", border: "1px solid var(--t-line)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Details
          </button>
        </div>
      </div>

      {/* Tabs + content */}
      <div
        className="flex-1 flex flex-col min-h-0 rounded-2xl overflow-hidden"
        style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
      >
        {/* Tab bar */}
        <div
          className="shrink-0 flex items-center gap-1 px-4 pt-3 pb-0"
          style={{ borderBottom: "1px solid var(--t-line)" }}
        >
          {(["used-in", "ledger"] as const).map((t) => {
            const labels = { "used-in": `Used In (${menuItems.length})`, ledger: `Ledger` };
            const active = tab === t;
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="px-4 py-2.5 text-xs font-semibold transition-colors relative"
                style={{ color: active ? "var(--t-accent)" : "var(--t-dim)" }}
              >
                {labels[t]}
                {active && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: "var(--t-accent)" }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto">
          {/* ── Used In Tab ── */}
          {tab === "used-in" && (
            <div>
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: "1px solid var(--t-line)" }}
              >
                <p className="text-xs font-semibold" style={{ color: "var(--t-dim)" }}>
                  Menu items that use this ingredient
                </p>
                <button
                  onClick={() => setShowAddItem(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
                  style={{ background: "var(--t-accent)", color: "#fff" }}
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Menu Item
                </button>
              </div>

              {/* Column headers */}
              <div
                className="grid px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide"
                style={{
                  gridTemplateColumns: "1fr 120px 120px 80px",
                  borderBottom: "1px solid var(--t-line)",
                  color: "var(--t-dim)",
                }}
              >
                <span>Menu Item</span>
                <span>Quantity Used</span>
                <span>Unit</span>
                <span className="text-right">Actions</span>
              </div>

              {menuItems.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <p className="text-sm" style={{ color: "var(--t-dim)" }}>
                    No menu items linked yet
                  </p>
                  <button
                    onClick={() => setShowAddItem(true)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl"
                    style={{ background: "var(--t-accent)", color: "#fff" }}
                  >
                    Link First Item
                  </button>
                </div>
              ) : (
                menuItems.map((mi) => (
                  <div
                    key={mi._id}
                    className="grid items-center px-5 py-3"
                    style={{
                      gridTemplateColumns: "1fr 120px 120px 80px",
                      borderBottom: "1px solid var(--t-line)",
                    }}
                  >
                    {/* Name */}
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-2 h-2 rounded-sm shrink-0"
                        style={{ background: mi.is_veg !== false ? "#22c55e" : "#ef4444" }} />
                      <p className="text-sm font-semibold truncate" style={{ color: "var(--t-text)" }}>{mi.name}</p>
                      {mi.category && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded shrink-0"
                          style={{ background: "var(--t-float)", color: "var(--t-dim)", border: "1px solid var(--t-line)" }}>
                          {mi.category}
                        </span>
                      )}
                    </div>

                    {/* Qty / unit (inline edit) */}
                    {editRowId === mi._id ? (
                      <>
                        <input
                          type="number"
                          min={0}
                          value={editQty}
                          onChange={(e) => setEditQty(e.target.value)}
                          autoFocus
                          className="px-2.5 py-1.5 rounded-lg text-sm outline-none tabular-nums mr-2"
                          style={{ background: "var(--t-float)", border: "1px solid var(--t-accent)", color: "var(--t-text)" }}
                        />
                        <select
                          value={editUnit}
                          onChange={(e) => setEditUnit(e.target.value as Unit)}
                          className="px-2 py-1.5 rounded-lg text-sm outline-none"
                          style={{ background: "var(--t-float)", border: "1px solid var(--t-line)", color: "var(--t-text)" }}
                        >
                          {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                        </select>
                      </>
                    ) : (
                      <>
                        <p className="text-sm tabular-nums" style={{ color: "var(--t-text)" }}>
                          {mi.recipe_entry?.quantity ?? "—"}
                        </p>
                        <p className="text-sm" style={{ color: "var(--t-dim)" }}>
                          {mi.recipe_entry?.unit ?? ingredient.unit}
                        </p>
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 justify-end">
                      {editRowId === mi._id ? (
                        <>
                          <button
                            onClick={() => handleSaveRowEdit(mi._id)}
                            disabled={savingRow}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--t-accent)", color: "#fff" }}
                          >
                            {savingRow
                              ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            }
                          </button>
                          <button onClick={() => setEditRowId(null)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--t-float)", color: "var(--t-dim)", border: "1px solid var(--t-line)" }}>
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => {
                              setEditRowId(mi._id);
                              setEditQty(String(mi.recipe_entry?.quantity ?? ""));
                              setEditUnit((mi.recipe_entry?.unit as Unit) ?? (ingredient.unit as Unit) ?? "g");
                            }}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--t-float)", color: "var(--t-dim)", border: "1px solid var(--t-line)" }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRemoveMenuItemLink(mi._id)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center"
                            style={{ background: "var(--t-float)", color: "#ef4444", border: "1px solid var(--t-line)" }}
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Ledger Tab ── */}
          {tab === "ledger" && (
            <div>
              <div
                className="flex items-center justify-between px-5 py-3.5"
                style={{ borderBottom: "1px solid var(--t-line)" }}
              >
                <p className="text-xs font-semibold" style={{ color: "var(--t-dim)" }}>
                  {ledgerTotal} transaction{ledgerTotal !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Column headers */}
              <div
                className="grid px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide sticky top-0"
                style={{
                  gridTemplateColumns: "1fr 100px 100px 1fr",
                  borderBottom: "1px solid var(--t-line)",
                  background: "var(--t-surface)",
                  color: "var(--t-dim)",
                }}
              >
                <span>Date</span>
                <span>Change</span>
                <span>Balance</span>
                <span>Source</span>
              </div>

              {ledger.length === 0 && !ledgerLoading ? (
                <div className="flex items-center justify-center py-12">
                  <p className="text-sm" style={{ color: "var(--t-dim)" }}>No transactions yet</p>
                </div>
              ) : (
                <>
                  {ledger.map((entry) => (
                    <div
                      key={entry._id}
                      className="grid items-center px-5 py-3"
                      style={{
                        gridTemplateColumns: "1fr 100px 100px 1fr",
                        borderBottom: "1px solid var(--t-line)",
                      }}
                    >
                      <p className="text-xs" style={{ color: "var(--t-dim)" }}>{fmtDate(entry.created_at)}</p>
                      <p
                        className="text-sm font-bold tabular-nums"
                        style={{ color: entry.delta < 0 ? "#ef4444" : "#22c55e" }}
                      >
                        {entry.delta > 0 ? "+" : ""}{entry.delta} {ingredient.unit}
                      </p>
                      <p className="text-sm tabular-nums" style={{ color: "var(--t-text)" }}>
                        {entry.balance_after} {ingredient.unit}
                      </p>
                      <div className="min-w-0">
                        {entry.reason === "order_fulfilled" ? (
                          <p className="text-xs truncate" style={{ color: "var(--t-text)" }}>
                            Order #{entry.order_number}
                            {entry.menu_item_name && (
                              <span style={{ color: "var(--t-dim)" }}> · {entry.menu_item_name}</span>
                            )}
                          </p>
                        ) : entry.reason === "bulk_update" ? (
                          <p className="text-xs" style={{ color: "var(--t-dim)" }}>Bulk restock</p>
                        ) : (
                          <p className="text-xs" style={{ color: "var(--t-dim)" }}>
                            {entry.notes ?? "Manual update"}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}

                  {ledgerHasMore && (
                    <div className="flex justify-center py-4">
                      <button
                        onClick={() => loadLedger(ledgerPage, false)}
                        disabled={ledgerLoading}
                        className="text-xs font-semibold px-4 py-2 rounded-xl"
                        style={{ background: "var(--t-float)", color: "var(--t-text)", border: "1px solid var(--t-line)" }}
                      >
                        {ledgerLoading ? "Loading…" : "Load More"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showEdit && (
        <EditIngredientModal
          ingredient={ingredient}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); loadDetail(); }}
        />
      )}
      {showAddItem && (
        <AddMenuItemModal
          ingredientName={ingredient.name}
          ingredientUnit={ingredient.unit}
          existingMenuItems={menuItems}
          onClose={() => setShowAddItem(false)}
          onSave={() => { setShowAddItem(false); loadDetail(); }}
        />
      )}
    </div>
  );
}
