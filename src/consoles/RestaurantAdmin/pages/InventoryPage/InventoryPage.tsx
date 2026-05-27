import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Modal, Form, InputNumber, Select, Space, Spin, Input, Pagination, message,
} from "antd";
import {
  getIngredients,
  createIngredient,
  updateIngredient,
  deleteIngredient,
  bulkUpdateIngredientStock,
  bulkAddIngredientStock,
  importIngredientsFromMenu,
  getIngredientDetail,
  type Ingredient,
} from "../../../../services/dashboardService";

const UNITS = ["g", "kg", "ml", "L", "pcs", "units"];

const FILTERS = [
  { label: "All", value: "" },
  { label: "Available", value: "available" },
  { label: "Low Stock", value: "low" },
  { label: "Out of Stock", value: "out" },
];

const SORT_OPTIONS = [
  { label: "Name A → Z",       value: "name_asc" },
  { label: "Name Z → A",       value: "name_desc" },
  { label: "Most Used Dishes",  value: "recipe_count_desc" },
  { label: "Least Used Dishes", value: "recipe_count_asc" },
  { label: "Stock: High → Low", value: "stock_desc" },
  { label: "Stock: Low → High", value: "stock_asc" },
];

// ─── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ ing }: { ing: Ingredient }) {
  const cfg = (() => {
    if (!ing.is_available || ing.current_stock <= 0)
      return { label: "Out of Stock", color: "#ef4444", bg: "rgba(239,68,68,0.09)", border: "rgba(239,68,68,0.22)" };
    if (ing.minimum_stock > 0 && ing.current_stock <= ing.minimum_stock)
      return { label: "Low Stock", color: "#d97706", bg: "rgba(217,119,6,0.09)", border: "rgba(217,119,6,0.22)" };
    return { label: "In Stock", color: "#16a34a", bg: "rgba(22,163,74,0.09)", border: "rgba(22,163,74,0.22)" };
  })();
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      padding: "3px 10px", borderRadius: 100,
      fontSize: 13, fontWeight: 600, letterSpacing: "0.02em",
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      whiteSpace: "nowrap",
    }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  );
}

// ─── Mini stock bar ────────────────────────────────────────────────────────────

function MiniBar({ current, min }: { current: number; min: number }) {
  if (min <= 0) return null;
  const pct = Math.min(100, Math.round((current / min) * 100));
  const color = current <= 0 ? "#ef4444" : current <= min ? "#d97706" : "#16a34a";
  return (
    <div style={{ height: 3, borderRadius: 9999, background: "var(--t-line)", width: 80, marginTop: 5, alignSelf: "center" }}>
      <div style={{
        height: "100%", borderRadius: 9999, background: color,
        width: `${pct}%`, transition: "width 0.35s ease",
      }} />
    </div>
  );
}

// ─── Inline-editable stock cell ────────────────────────────────────────────────

function StockCell({ ing, onSaved }: { ing: Ingredient; onSaved: (s: number, u: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [qty, setQty] = useState(ing.current_stock);
  const [unit, setUnit] = useState(ing.unit);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (qty === ing.current_stock && unit === ing.unit) { setEditing(false); return; }
    setSaving(true);
    try {
      await updateIngredient(ing.name, { current_stock: qty, unit });
      onSaved(qty, unit);
      message.success("Stock updated");
    } catch { message.error("Failed to update stock"); }
    finally { setSaving(false); setEditing(false); }
  }

  if (editing) {
    return (
      <Space size={4} onClick={(e) => e.stopPropagation()} style={{ flexWrap: "nowrap" }}>
        <InputNumber
          autoFocus size="small" min={0} value={qty}
          onChange={(v) => setQty(v ?? 0)} onPressEnter={save}
          style={{ width: 86 }}
        />
        <Select size="small" value={unit} onChange={setUnit}
          options={UNITS.map((u) => ({ value: u, label: u }))} style={{ width: 70 }} />
        <button onClick={save} disabled={saving} style={{
          padding: "3px 9px", borderRadius: 5,
          background: "var(--t-accent)", color: "#fff",
          border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
        }}>Save</button>
        <button onClick={(e) => { e.stopPropagation(); setEditing(false); }} style={{
          padding: "3px 8px", borderRadius: 5,
          background: "transparent", color: "var(--t-dim)",
          border: "1px solid var(--t-line)", cursor: "pointer", fontSize: 13,
        }}>Cancel</button>
      </Space>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={(e) => { e.stopPropagation(); setQty(ing.current_stock); setUnit(ing.unit); setEditing(true); }}
      title="Click to edit stock"
      style={{
        display: "inline-flex", alignItems: "flex-start", gap: 6,
        padding: "4px 8px", borderRadius: 7, cursor: "pointer",
        border: `1px solid ${hovered ? "var(--t-accent)" : "transparent"}`,
        background: hovered ? "color-mix(in srgb, var(--t-accent) 6%, transparent)" : "transparent",
        transition: "border-color 0.15s, background 0.15s",
      }}
    >
      <div>
        <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 15, fontWeight: 500, color: "var(--t-text)" }}>
          {ing.current_stock.toLocaleString("en-IN")}
          <span style={{ fontSize: 13, color: "var(--t-dim)", fontWeight: 400, marginLeft: 3 }}>{ing.unit}</span>
        </span>
        <MiniBar current={ing.current_stock} min={ing.minimum_stock} />
      </div>
      <span style={{ color: hovered ? "var(--t-accent)" : "transparent", transition: "color 0.15s", marginTop: 2, flexShrink: 0 }}>
        <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </span>
    </div>
  );
}

// ─── Ingredient availability toggle ───────────────────────────────────────────

function IngredientToggle({ ing, onToggled }: { ing: Ingredient; onToggled: (isAvail: boolean) => void }) {
  const [saving, setSaving] = useState(false);
  const on = ing.is_available;

  async function handleToggle(e: React.MouseEvent) {
    e.stopPropagation();
    setSaving(true);
    try {
      await updateIngredient(ing.name, { is_available: !on });
      onToggled(!on);
    } catch {
      message.error("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  return (
    <button
      onClick={handleToggle}
      disabled={saving}
      title={on ? "Disable ingredient" : "Enable ingredient"}
      style={{
        width: 34, height: 19, borderRadius: 10, flexShrink: 0,
        background: on ? "var(--t-accent)" : "var(--t-line)",
        border: "none", cursor: saving ? "wait" : "pointer",
        position: "relative", transition: "background 0.2s",
        opacity: saving ? 0.6 : 1, padding: 0,
      }}
    >
      <span style={{
        position: "absolute", top: 2,
        left: on ? 17 : 2,
        width: 15, height: 15, borderRadius: "50%",
        background: "#fff",
        transition: "left 0.18s cubic-bezier(0.4,0,0.2,1)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.25)",
        display: "block",
      }} />
    </button>
  );
}

// ─── Bulk modal search input ───────────────────────────────────────────────────

function BulkSearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: "relative", marginBottom: 12 }}>
      <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"
        style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "var(--t-dim)", pointerEvents: "none" }}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search ingredients…"
        style={{
          width: "100%", paddingLeft: 30, paddingRight: 12,
          paddingTop: 7, paddingBottom: 7,
          borderRadius: 8, border: "1px solid var(--t-line)",
          background: "var(--t-bg)", color: "var(--t-text)",
          fontSize: 14, outline: "none",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}

// ─── Bulk modal column header ──────────────────────────────────────────────────

type ColDef = { label: string; w: number | "flex" };

function BulkColHeader({ cols }: { cols: ColDef[] }) {
  return (
    <div style={{
      display: "flex", padding: "7px 4px",
      borderBottom: "1px solid var(--t-line)",
      borderTop: "1px solid var(--t-line)",
      fontSize: 12, fontWeight: 700, color: "var(--t-dim)",
      textTransform: "uppercase", letterSpacing: "0.07em",
    }}>
      {cols.map(({ label, w }) => (
        <span key={label} style={{ width: w === "flex" ? undefined : w, flex: w === "flex" ? 1 : undefined }}>
          {label}
        </span>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InventoryPage() {
  const navigate = useNavigate();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const [inputSearch, setInputSearch] = useState("");
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sort, setSort] = useState("name_asc");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addForm] = Form.useForm();

  const [bulkUpdateOpen, setBulkUpdateOpen] = useState(false);
  const [bulkAddOpen, setBulkAddOpen] = useState(false);
  const [bulkSaving, setBulkSaving] = useState(false);
  const [bulkItems, setBulkItems] = useState<Ingredient[]>([]);
  const [bulkFirstLoading, setBulkFirstLoading] = useState(false);
  const [bulkMoreLoading, setBulkMoreLoading] = useState(false);
  const [bulkInputSearch, setBulkInputSearch] = useState("");
  const [bulkUpdateVals, setBulkUpdateVals] = useState<Record<string, string>>({});
  const [bulkAddVals, setBulkAddVals] = useState<Record<string, { qty: string; unit: string }>>({});
  const bulkStateRef = useRef({ page: 1, search: "", hasMore: false, fetching: false });
  const bulkDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [deleteItems, setDeleteItems] = useState<{ _id: string; name: string }[] | null>(null);
  const [deleteSaving, setDeleteSaving] = useState(false);

  // ── Data loading ───────────────────────────────────────────────────────────

  const load = useCallback(async (p: number, s: string, st: string, so: string) => {
    setLoading(true);
    try {
      const res = await getIngredients({ page: p, limit: 10, search: s || undefined, status: st || undefined, sort: so });
      setIngredients(res.items as Ingredient[]);
      setTotal(res.total);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    importIngredientsFromMenu().catch(() => null).finally(() => load(1, "", "", "name_asc"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleSearchChange(val: string) {
    setInputSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(val);
      setPage(1);
      load(1, val, filterStatus, sort);
    }, 300);
  }

  function handleFilterChange(val: string) {
    setFilterStatus(val);
    setPage(1);
    load(1, search, val, sort);
  }

  function handleSortChange(val: string) {
    setSort(val);
    setPage(1);
    load(1, search, filterStatus, val);
  }

  async function loadBulkPage(pg: number, s: string, append: boolean) {
    if (bulkStateRef.current.fetching) return;
    bulkStateRef.current.fetching = true;
    if (!append) setBulkFirstLoading(true);
    else setBulkMoreLoading(true);
    try {
      const res = await getIngredients({ page: pg, limit: 20, search: s || undefined });
      setBulkItems((prev) => append ? [...prev, ...(res.items as Ingredient[])] : (res.items as Ingredient[]));
      bulkStateRef.current = { page: pg, search: s, hasMore: res.hasMore, fetching: false };
    } catch { bulkStateRef.current.fetching = false; }
    finally { setBulkFirstLoading(false); setBulkMoreLoading(false); }
  }

  function handleBulkSearchChange(val: string) {
    setBulkInputSearch(val);
    if (bulkDebounceRef.current) clearTimeout(bulkDebounceRef.current);
    bulkDebounceRef.current = setTimeout(() => loadBulkPage(1, val, false), 300);
  }

  function handleBulkScroll(e: React.UIEvent<HTMLDivElement>) {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    const st = bulkStateRef.current;
    if (scrollHeight - scrollTop - clientHeight < 100 && st.hasMore && !st.fetching)
      loadBulkPage(st.page + 1, st.search, true);
  }

  function openBulkModal(type: "update" | "add") {
    setBulkUpdateVals({});
    setBulkAddVals({});
    setBulkInputSearch("");
    setBulkItems([]);
    bulkStateRef.current = { page: 1, search: "", hasMore: false, fetching: false };
    if (type === "update") setBulkUpdateOpen(true);
    else setBulkAddOpen(true);
    loadBulkPage(1, "", false);
  }

  async function handleAdd() {
    const vals = await addForm.validateFields();
    setAddSaving(true);
    try {
      await createIngredient(vals);
      message.success(`"${vals.name}" added`);
      setAddOpen(false);
      addForm.resetFields();
      load(page, search, filterStatus, sort);
    } catch (e: unknown) { message.error((e as Error).message || "Failed"); }
    finally { setAddSaving(false); }
  }

  async function handleBulkUpdate() {
    const updates = Object.entries(bulkUpdateVals)
      .filter(([, v]) => v !== "")
      .map(([name, v]) => ({ name, new_stock: Number(v) }));
    if (!updates.length) { setBulkUpdateOpen(false); return; }
    setBulkSaving(true);
    try {
      await bulkUpdateIngredientStock(updates);
      message.success(`Updated ${updates.length} ingredients`);
      setBulkUpdateOpen(false);
      setBulkUpdateVals({});
      load(page, search, filterStatus, sort);
    } catch { message.error("Update failed"); }
    finally { setBulkSaving(false); }
  }

  async function handleBulkAdd() {
    const updates = Object.entries(bulkAddVals)
      .filter(([, { qty }]) => qty !== "" && Number(qty) > 0)
      .map(([name, { qty, unit }]) => ({ name, quantity: Number(qty), unit }));
    if (!updates.length) { setBulkAddOpen(false); return; }
    setBulkSaving(true);
    try {
      await bulkAddIngredientStock(updates);
      message.success(`Stock added for ${updates.length} ingredients`);
      setBulkAddOpen(false);
      setBulkAddVals({});
      load(page, search, filterStatus, sort);
    } catch { message.error("Bulk add failed"); }
    finally { setBulkSaving(false); }
  }

  function openDelete(name: string) {
    setDeleteTarget(name);
    setDeleteItems(null);
    getIngredientDetail(name)
      .then((d) => setDeleteItems(d.menuItems as { _id: string; name: string }[]))
      .catch(() => setDeleteItems([]));
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteSaving(true);
    try {
      await deleteIngredient(deleteTarget);
      message.success(`"${deleteTarget}" deleted`);
      setDeleteTarget(null);
      load(page, search, filterStatus, sort);
    } catch { message.error("Delete failed"); }
    finally { setDeleteSaving(false); }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const COL = "1fr 1fr 1fr 1fr 1fr";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: 18 }}>

      <style>{`
        .inv-row { transition: background 0.12s; }
        .inv-row:hover { background: var(--t-float) !important; }
        .inv-cell { border-right: 1px solid var(--t-line); padding: 15px 16px;
                    display: flex; align-items: center; justify-content: center; }
        .inv-cell:last-child { border-right: none; }
        .inv-hcell { border-right: 1px solid var(--t-line); padding: 12px 14px;
                     display: flex; align-items: center; justify-content: center; }
        .inv-hcell:last-child { border-right: none; }
        .inv-del { color: var(--t-dim); background: transparent; transition: all 0.15s; }
        .inv-del:hover { color: #ef4444 !important; background: rgba(239,68,68,0.09) !important; }
        .inv-search:focus { border-color: var(--t-accent) !important; }
        .inv-ghost:hover { border-color: var(--t-accent) !important; color: var(--t-accent) !important; }
        .inv-primary:hover { opacity: 0.88; }
        .inv-filter-btn:hover { color: var(--t-text) !important; }
        @keyframes inv-shimmer { 0%,100%{opacity:1} 50%{opacity:0.45} }
        .inv-skeleton { animation: inv-shimmer 1.6s ease-in-out infinite; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 23, fontWeight: 700, color: "var(--t-text)", letterSpacing: "-0.02em" }}>
            Inventory
          </h1>
          <p style={{ margin: "2px 0 0", fontSize: 14, color: "var(--t-dim)" }}>
            {total.toLocaleString()} ingredient{total !== 1 ? "s" : ""}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          {(["Bulk Update", "Bulk Add"] as const).map((label, i) => (
            <button
              key={label}
              className="inv-ghost"
              onClick={() => openBulkModal(i === 0 ? "update" : "add")}
              style={{
                padding: "7px 14px", borderRadius: 8,
                border: "1px solid var(--t-line)", background: "var(--t-surface)",
                color: "var(--t-text)", fontSize: 14, fontWeight: 500,
                cursor: "pointer", transition: "all 0.15s",
              }}
            >
              {label}
            </button>
          ))}
          <button
            className="inv-primary"
            onClick={() => setAddOpen(true)}
            style={{
              padding: "7px 16px", borderRadius: 8,
              border: "none", background: "var(--t-accent)",
              color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
              transition: "opacity 0.15s",
            }}
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add Ingredient
          </button>
        </div>
      </div>

      {/* ── Search + Filter + Sort ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        {/* Search */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--t-dim)", pointerEvents: "none" }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          {inputSearch && (
            <button
              onClick={() => handleSearchChange("")}
              style={{
                position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                background: "none", border: "none", cursor: "pointer", color: "var(--t-dim)",
                fontSize: 14, lineHeight: 1, padding: 2,
              }}
            >×</button>
          )}
          <input
            className="inv-search"
            placeholder="Search ingredients…"
            value={inputSearch}
            onChange={(e) => handleSearchChange(e.target.value)}
            style={{
              width: 232, paddingLeft: 34, paddingRight: inputSearch ? 28 : 12,
              paddingTop: 8, paddingBottom: 8,
              borderRadius: 9, border: "1px solid var(--t-line)",
              background: "var(--t-surface)", color: "var(--t-text)",
              fontSize: 14, outline: "none", transition: "border-color 0.2s",
            }}
          />
        </div>

        {/* Filter pills */}
        <div style={{
          display: "flex", gap: 2, padding: 3,
          background: "var(--t-surface)", borderRadius: 9,
          border: "1px solid var(--t-line)",
        }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              className={filterStatus !== f.value ? "inv-filter-btn" : undefined}
              onClick={() => handleFilterChange(f.value)}
              style={{
                padding: "5px 12px", borderRadius: 7,
                fontSize: 13.5, fontWeight: filterStatus === f.value ? 600 : 500,
                border: "none", cursor: "pointer", transition: "all 0.15s",
                background: filterStatus === f.value ? "var(--t-accent)" : "transparent",
                color: filterStatus === f.value ? "#fff" : "var(--t-dim)",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Sort dropdown */}
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            style={{ color: "var(--t-dim)", flexShrink: 0 }}>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
          </svg>
          <div style={{ position: "relative" }}>
            <select
              value={sort}
              onChange={(e) => handleSortChange(e.target.value)}
              style={{
                padding: "7px 30px 7px 11px",
                borderRadius: 9, border: "1px solid var(--t-line)",
                background: "var(--t-surface)", color: "var(--t-text)",
                fontSize: 14, fontWeight: 500, cursor: "pointer",
                outline: "none", appearance: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--t-accent)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--t-line)"; }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <svg width="10" height="10" fill="none" stroke="currentColor" viewBox="0 0 24 24"
              style={{
                position: "absolute", right: 9, top: "50%", transform: "translateY(-50%)",
                pointerEvents: "none", color: "var(--t-dim)",
              }}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
        border: "1px solid var(--t-line)",
        borderRadius: 12,
        background: "var(--t-surface)",
      }}>
        {/* Scrollable area — header is sticky inside so it shares the exact same width as rows */}
        <div style={{ overflowY: "auto", flex: 1 }}>
          {/* Sticky column headers */}
          <div style={{
            display: "grid", gridTemplateColumns: COL,
            borderBottom: "1px solid var(--t-line)",
            borderRadius: "12px 12px 0 0",
            background: "var(--t-float)",
            position: "sticky", top: 0, zIndex: 2,
          }}>
            {["Ingredient", "Status", "Current Stock", "Min Threshold", "Actions"].map((h) => (
              <span key={h} className="inv-hcell" style={{
                fontSize: 12.5, fontWeight: 700, color: "var(--t-dim)",
                textTransform: "uppercase", letterSpacing: "0.07em",
              }}>
                {h}
              </span>
            ))}
          </div>
          {loading ? (
            // Skeleton
            <>
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: COL,
                  borderBottom: "1px solid var(--t-line)",
                }}>
                  <div className="inv-cell" style={{ flexDirection: "column", gap: 6 }}>
                    <div className="inv-skeleton" style={{ height: 13, width: 90 + (i * 13) % 50, borderRadius: 5, background: "var(--t-line)" }} />
                    <div className="inv-skeleton" style={{ height: 10, width: 50, borderRadius: 4, background: "var(--t-line)", opacity: 0.6 }} />
                  </div>
                  <div className="inv-cell">
                    <div className="inv-skeleton" style={{ height: 22, width: 88, borderRadius: 100, background: "var(--t-line)" }} />
                  </div>
                  <div className="inv-cell" style={{ flexDirection: "column", gap: 5 }}>
                    <div className="inv-skeleton" style={{ height: 13, width: 72, borderRadius: 4, background: "var(--t-line)" }} />
                    <div className="inv-skeleton" style={{ height: 3, width: 80, borderRadius: 9999, background: "var(--t-line)" }} />
                  </div>
                  <div className="inv-cell">
                    <div className="inv-skeleton" style={{ height: 13, width: 48, borderRadius: 4, background: "var(--t-line)" }} />
                  </div>
                  <div className="inv-cell" style={{ gap: 10 }}>
                    <div className="inv-skeleton" style={{ height: 19, width: 34, borderRadius: 10, background: "var(--t-line)" }} />
                    <div className="inv-skeleton" style={{ height: 19, width: 24, borderRadius: 6, background: "var(--t-line)" }} />
                  </div>
                </div>
              ))}
            </>
          ) : ingredients.length === 0 ? (
            <div style={{ padding: "56px 0", textAlign: "center" }}>
              <div style={{ fontSize: 30, marginBottom: 10 }}>📦</div>
              <p style={{ color: "var(--t-dim)", fontSize: 14, margin: 0 }}>
                {inputSearch || filterStatus ? "No ingredients match your filter" : "No ingredients yet"}
              </p>
            </div>
          ) : (
            ingredients.map((ing) => (
              <div
                key={ing.name}
                className="inv-row"
                onClick={() => navigate(`/dashboard/inventory/${encodeURIComponent(ing.name)}`)}
                style={{
                  display: "grid", gridTemplateColumns: COL,
                  borderBottom: "1px solid var(--t-line)",
                  cursor: "pointer",
                }}
              >
                {/* Name */}
                <div className="inv-cell" style={{ flexDirection: "column", minWidth: 0 }}>
                  <p style={{
                    margin: 0, fontSize: 15, fontWeight: 600,
                    color: "var(--t-text)", letterSpacing: "-0.005em",
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    maxWidth: "100%", textAlign: "center",
                  }}>
                    {ing.name}
                  </p>
                  {ing.recipe_count > 0 && (
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: "var(--t-dim)", textAlign: "center" }}>
                      {ing.recipe_count} {ing.recipe_count === 1 ? "dish" : "dishes"}
                    </p>
                  )}
                </div>

                {/* Status */}
                <div className="inv-cell">
                  <StatusBadge ing={ing} />
                </div>

                {/* Stock */}
                <div className="inv-cell" onClick={(e) => e.stopPropagation()}>
                  <StockCell
                    ing={ing}
                    onSaved={(s, u) =>
                      setIngredients((prev) => prev.map((i) => i.name === ing.name ? { ...i, current_stock: s, unit: u } : i))
                    }
                  />
                </div>

                {/* Min threshold */}
                <div className="inv-cell">
                  <span style={{ fontSize: 14, color: "var(--t-dim)", fontVariantNumeric: "tabular-nums" }}>
                    {ing.minimum_stock > 0 ? `${ing.minimum_stock} ${ing.unit}` : "—"}
                  </span>
                </div>

                {/* Actions: toggle + delete */}
                <div
                  className="inv-cell"
                  onClick={(e) => e.stopPropagation()}
                  style={{ gap: 10 }}
                >
                  <IngredientToggle
                    ing={ing}
                    onToggled={(isAvail) =>
                      setIngredients((prev) =>
                        prev.map((i) => i.name === ing.name ? { ...i, is_available: isAvail } : i)
                      )
                    }
                  />
                  <button
                    className="inv-del"
                    onClick={(e) => { e.stopPropagation(); openDelete(ing.name); }}
                    style={{
                      padding: 5, borderRadius: 6, border: "none",
                      cursor: "pointer", display: "flex", alignItems: "center",
                    }}
                  >
                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Pagination ── */}
      {total > 10 && (
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Pagination
            current={page} pageSize={10} total={total}
            showSizeChanger={false}
            showTotal={(t, [from, to]) => `${from}–${to} of ${t}`}
            onChange={(p) => { setPage(p); load(p, search, filterStatus, sort); }}
            size="small"
          />
        </div>
      )}

      {/* ── Add Ingredient ── */}
      <Modal
        title="Add Ingredient"
        open={addOpen}
        onOk={handleAdd}
        onCancel={() => { setAddOpen(false); addForm.resetFields(); }}
        okButtonProps={{ loading: addSaving }}
        okText="Add Ingredient"
        destroyOnClose
      >
        <Form form={addForm} layout="vertical" style={{ marginTop: 16 }}
          initialValues={{ unit: "g", current_stock: 0, minimum_stock: 0 }}>
          <Form.Item name="name" label="Name" rules={[{ required: true, message: "Name is required" }]}>
            <Input placeholder="e.g. Paneer" autoFocus />
          </Form.Item>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <Form.Item name="unit" label="Unit" style={{ margin: 0 }}>
              <Select options={UNITS.map((u) => ({ value: u, label: u }))} />
            </Form.Item>
            <Form.Item name="current_stock" label="Opening Stock" style={{ margin: 0 }}>
              <InputNumber min={0} style={{ width: "100%" }} />
            </Form.Item>
          </div>
          <Form.Item name="minimum_stock" label="Low Stock Threshold"
            extra="Set to 0 to disable low-stock warning" style={{ marginTop: 16 }}>
            <InputNumber min={0} style={{ width: "100%" }} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Bulk Update ── */}
      <Modal
        title="Bulk Stock Update"
        open={bulkUpdateOpen}
        onOk={handleBulkUpdate}
        onCancel={() => setBulkUpdateOpen(false)}
        okButtonProps={{ loading: bulkSaving }}
        okText="Apply Updates"
        width={560}
        destroyOnClose
      >
        <p style={{ color: "var(--t-dim)", fontSize: 13, margin: "8px 0 12px" }}>
          Sets absolute stock value — leave empty to skip that ingredient
        </p>
        <BulkSearchInput value={bulkInputSearch} onChange={handleBulkSearchChange} />
        <BulkColHeader cols={[{ label: "Ingredient", w: "flex" }, { label: "Current", w: 90 }, { label: "New Stock", w: 160 }]} />
        <div style={{ overflowY: "auto", maxHeight: 340 }} onScroll={handleBulkScroll}>
          {bulkFirstLoading ? (
            <div style={{ padding: 32, textAlign: "center" }}><Spin /></div>
          ) : bulkItems.map((ing) => (
            <div key={ing.name} style={{
              display: "flex", alignItems: "center",
              padding: "8px 4px", borderBottom: "1px solid var(--t-line)",
            }}>
              <span style={{ flex: 1, fontSize: 14, color: "var(--t-text)" }}>{ing.name}</span>
              <span style={{ width: 90, fontSize: 13, color: "var(--t-dim)" }}>{ing.current_stock} {ing.unit}</span>
              <div style={{ width: 160 }}>
                <InputNumber min={0} size="small" style={{ width: "100%" }}
                  placeholder={String(ing.current_stock)}
                  value={bulkUpdateVals[ing.name] !== undefined ? Number(bulkUpdateVals[ing.name]) : undefined}
                  onChange={(v) => setBulkUpdateVals((p) => ({ ...p, [ing.name]: v != null ? String(v) : "" }))}
                  addonAfter={<span style={{ fontSize: 13 }}>{ing.unit}</span>} />
              </div>
            </div>
          ))}
          {bulkMoreLoading && (
            <div style={{ padding: 12, textAlign: "center" }}><Spin size="small" /></div>
          )}
        </div>
      </Modal>

      {/* ── Bulk Add ── */}
      <Modal
        title="Bulk Add Stock"
        open={bulkAddOpen}
        onOk={handleBulkAdd}
        onCancel={() => setBulkAddOpen(false)}
        okButtonProps={{ loading: bulkSaving }}
        okText="Add to Stock"
        width={600}
        destroyOnClose
      >
        <p style={{ color: "var(--t-dim)", fontSize: 13, margin: "8px 0 12px" }}>
          Adds to existing stock with unit conversion — leave empty to skip
        </p>
        <BulkSearchInput value={bulkInputSearch} onChange={handleBulkSearchChange} />
        <BulkColHeader cols={[{ label: "Ingredient", w: "flex" }, { label: "Current", w: 90 }, { label: "Add Qty + Unit", w: 190 }]} />
        <div style={{ overflowY: "auto", maxHeight: 340 }} onScroll={handleBulkScroll}>
          {bulkFirstLoading ? (
            <div style={{ padding: 32, textAlign: "center" }}><Spin /></div>
          ) : bulkItems.map((ing) => (
            <div key={ing.name} style={{
              display: "flex", alignItems: "center",
              padding: "8px 4px", borderBottom: "1px solid var(--t-line)",
            }}>
              <span style={{ flex: 1, fontSize: 14, color: "var(--t-text)" }}>{ing.name}</span>
              <span style={{ width: 90, fontSize: 13, color: "var(--t-dim)" }}>{ing.current_stock} {ing.unit}</span>
              <Space size={4} style={{ width: 190 }}>
                <InputNumber min={0} size="small" placeholder="0" style={{ width: 90 }}
                  value={bulkAddVals[ing.name]?.qty ? Number(bulkAddVals[ing.name].qty) : undefined}
                  onChange={(v) =>
                    setBulkAddVals((p) => ({
                      ...p,
                      [ing.name]: { qty: v != null ? String(v) : "", unit: p[ing.name]?.unit ?? ing.unit },
                    }))
                  } />
                <Select size="small" style={{ width: 80 }}
                  value={bulkAddVals[ing.name]?.unit ?? ing.unit}
                  onChange={(u) =>
                    setBulkAddVals((p) => ({ ...p, [ing.name]: { qty: p[ing.name]?.qty ?? "", unit: u } }))
                  }
                  options={UNITS.map((u) => ({ value: u, label: u }))} />
              </Space>
            </div>
          ))}
          {bulkMoreLoading && (
            <div style={{ padding: 12, textAlign: "center" }}><Spin size="small" /></div>
          )}
        </div>
      </Modal>

      {/* ── Delete Confirm ── */}
      <Modal
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#ef4444", display: "flex" }}>
              <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </span>
            Delete "{deleteTarget}"?
          </span>
        }
        open={deleteTarget !== null}
        onOk={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        okButtonProps={{ danger: true, loading: deleteSaving }}
        okText="Delete"
        destroyOnClose
      >
        {deleteItems === null ? (
          <p style={{ color: "var(--t-dim)", display: "flex", alignItems: "center", gap: 8 }}>
            <Spin size="small" />Checking usage…
          </p>
        ) : deleteItems.length > 0 ? (
          <>
            <p style={{ color: "#d97706", marginBottom: 8, fontWeight: 500 }}>
              Used in {deleteItems.length} menu {deleteItems.length === 1 ? "item" : "items"}:
            </p>
            <ul style={{ paddingLeft: 20, maxHeight: 160, overflowY: "auto", color: "var(--t-text)", margin: 0 }}>
              {deleteItems.map((item) => <li key={item._id} style={{ marginBottom: 3 }}>{item.name}</li>)}
            </ul>
            <p style={{ color: "var(--t-dim)", fontSize: 13, marginTop: 10, marginBottom: 0 }}>
              Deleting will remove this ingredient from their recipe lists.
            </p>
          </>
        ) : (
          <p style={{ color: "var(--t-dim)", marginBottom: 0 }}>
            This ingredient is not used in any menu items.
          </p>
        )}
      </Modal>
    </div>
  );
}
