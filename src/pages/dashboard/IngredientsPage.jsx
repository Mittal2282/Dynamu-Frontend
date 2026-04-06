import { useEffect, useState } from "react";
import { getIngredients, toggleIngredient } from "../../services/adminService";

/* ─── Toggle ────────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40 ${
        checked ? "bg-green-500" : "bg-red-500/70"
      }`}
      style={
        checked
          ? { boxShadow: "0 0 10px rgba(34,197,94,0.4)" }
          : { boxShadow: "0 0 8px rgba(239,68,68,0.25)" }
      }
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ─── Ingredient Card ───────────────────────────────────────────────────────── */
function IngredientCard({ ingredient, onToggle, saving }) {
  const { name, is_available, affected_count, items_using = [] } = ingredient;
  const isSaving = saving === name;
  const initial = name.charAt(0).toUpperCase();
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="relative rounded-2xl flex flex-col overflow-hidden transition-all duration-300"
      style={{
        background: "var(--t-surface)",
        border: `1px solid ${is_available ? "var(--t-line)" : "rgba(239,68,68,0.3)"}`,
        boxShadow: !is_available ? "0 0 20px rgba(239,68,68,0.07)" : "none",
      }}
    >
      {/* Top stripe */}
      <div
        className="h-0.5 w-full shrink-0"
        style={{
          background: is_available
            ? "linear-gradient(90deg, var(--t-accent), var(--t-accent2))"
            : "linear-gradient(90deg, #ef4444, #f97316)",
        }}
      />

      <div className="p-4 flex flex-col gap-4 flex-1">
        {/* Top row */}
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold shrink-0 select-none"
            style={{
              background: is_available ? "linear-gradient(135deg, var(--t-accent-20), var(--t-accent2-20))" : "rgba(239,68,68,0.12)",
              color: is_available ? "var(--t-accent)" : "#f87171",
              border: `1px solid ${is_available ? "var(--t-accent-20)" : "rgba(239,68,68,0.2)"}`,
            }}
          >
            {initial}
          </div>

          <div className="flex-1 min-w-0 pt-0.5">
            <p className="text-sm font-semibold capitalize truncate leading-tight" style={{ color: "var(--t-text)" }}>
              {name}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: is_available ? "#22c55e" : "#ef4444" }} />
              <span className="text-[11px] font-medium" style={{ color: is_available ? "#4ade80" : "#f87171" }}>
                {is_available ? "In Stock" : "Out of Stock"}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px" style={{ background: "var(--t-line)" }} />

        {/* Toggle row */}
        <div className="flex items-center justify-between">
          {/* Dishes count + expand */}
          <button
            onClick={() => items_using.length > 0 && setExpanded((v) => !v)}
            className="flex items-center gap-2 transition-opacity"
            style={{ opacity: items_using.length > 0 ? 1 : 0.5, cursor: items_using.length > 0 ? "pointer" : "default" }}
          >
            <svg className="w-3.5 h-3.5 shrink-0" style={{ color: "var(--t-dim)" }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-[11px]" style={{ color: "var(--t-dim)" }}>
              <span className="font-bold" style={{ color: affected_count > 0 ? "var(--t-text)" : "var(--t-dim)" }}>
                {affected_count}
              </span>{" "}{affected_count === 1 ? "dish" : "dishes"}
            </span>
            {items_using.length > 0 && (
              <svg
                className="w-3 h-3 transition-transform duration-200"
                style={{ color: "var(--t-dim)", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </button>

          {isSaving ? (
            <div className="w-11 h-6 flex items-center justify-center">
              <div className="w-4 h-4 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
            </div>
          ) : (
            <Toggle checked={is_available} onChange={() => onToggle(name, !is_available)} disabled={isSaving} />
          )}
        </div>

        {/* Expandable items list */}
        {expanded && items_using.length > 0 && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
          >
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--t-dim)", borderBottom: "1px solid var(--t-line)" }}>
              Used in
            </p>
            <ul className="divide-y" style={{ borderColor: "var(--t-line)" }}>
              {items_using.map((dish) => (
                <li key={dish._id} className="flex items-center gap-2 px-3 py-2">
                  <span className="w-1 h-1 rounded-full shrink-0" style={{ background: "var(--t-dim)" }} />
                  <span className="text-xs truncate" style={{ color: "var(--t-text)" }}>{dish.name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Stat Chip ─────────────────────────────────────────────────────────────── */
function StatChip({ label, value, color }) {
  return (
    <div
      className="flex-1 min-w-0 rounded-2xl px-4 py-3 flex flex-col gap-0.5"
      style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
    >
      <p className="text-xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[11px] font-medium truncate" style={{ color: "var(--t-dim)" }}>
        {label}
      </p>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function IngredientsPage() {
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(null);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'out' | 'in'

  useEffect(() => {
    setLoading(true);
    getIngredients()
      .then(setIngredients)
      .catch(() => setError("Failed to load ingredients"))
      .finally(() => setLoading(false));
  }, []);

  const handleToggle = async (name, newAvailability) => {
    setSaving(name);
    setIngredients((prev) =>
      prev.map((ing) => (ing.name === name ? { ...ing, is_available: newAvailability } : ing))
    );
    try {
      await toggleIngredient(name, newAvailability);
    } catch {
      setIngredients((prev) =>
        prev.map((ing) => (ing.name === name ? { ...ing, is_available: !newAvailability } : ing))
      );
    } finally {
      setSaving(null);
    }
  };

  const outOfStockAll = ingredients.filter((i) => !i.is_available);
  const inStockAll = ingredients.filter((i) => i.is_available);
  const totalAffected = outOfStockAll.reduce((sum, i) => sum + i.affected_count, 0);

  const searchFiltered = ingredients.filter((ing) =>
    ing.name.toLowerCase().includes(search.toLowerCase())
  );
  const displayed =
    activeFilter === "out"
      ? searchFiltered.filter((i) => !i.is_available)
      : activeFilter === "in"
      ? searchFiltered.filter((i) => i.is_available)
      : searchFiltered;

  const FILTERS = [
    { key: "all", label: "All", count: ingredients.length },
    { key: "out", label: "Out of Stock", count: outOfStockAll.length },
    { key: "in", label: "In Stock", count: inStockAll.length },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              background: "linear-gradient(90deg, var(--t-text) 60%, var(--t-dim))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Ingredient Stock
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--t-dim)" }}>
            Mark ingredients as out of stock to instantly hide all dishes that use them.
          </p>
        </div>
        {/* Live indicator */}
        {!loading && ingredients.length > 0 && (
          <div
            className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium"
            style={{
              background: "var(--t-surface)",
              border: "1px solid var(--t-line)",
              color: "var(--t-dim)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Live
          </div>
        )}
      </div>

      {/* ── Alert banner ── */}
      {!loading && outOfStockAll.length > 0 && (
        <div
          className="flex items-center gap-4 px-5 py-4 rounded-2xl"
          style={{
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.2)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center text-lg"
            style={{ background: "rgba(239,68,68,0.12)" }}
          >
            🚫
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-300">
              {outOfStockAll.length} ingredient{outOfStockAll.length > 1 ? "s" : ""} out of stock
            </p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(248,113,113,0.7)" }}>
              {totalAffected} {totalAffected === 1 ? "dish is" : "dishes are"} currently hidden from customers
            </p>
          </div>
          <div
            className="shrink-0 text-2xl font-bold tabular-nums"
            style={{ color: "#f87171" }}
          >
            {outOfStockAll.length}
          </div>
        </div>
      )}

      {/* ── Stat chips ── */}
      {!loading && ingredients.length > 0 && (
        <div className="flex gap-3">
          <StatChip
            label="Total Ingredients"
            value={ingredients.length}
            color="var(--t-accent)"
          />
          <StatChip
            label="In Stock"
            value={inStockAll.length}
            color="#4ade80"
          />
          <StatChip
            label="Out of Stock"
            value={outOfStockAll.length}
            color={outOfStockAll.length > 0 ? "#f87171" : "var(--t-dim)"}
          />
        </div>
      )}

      {/* ── Search + Filter bar ── */}
      {!loading && ingredients.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
              style={{ color: "var(--t-dim)" }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <circle cx="11" cy="11" r="8" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ingredients…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors"
              style={{
                background: "var(--t-float)",
                border: "1px solid var(--t-line)",
                color: "var(--t-text)",
              }}
            />
          </div>

          {/* Filter pills */}
          <div
            className="flex items-center gap-1 p-1 rounded-xl shrink-0"
            style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
          >
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => setActiveFilter(f.key)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5"
                style={
                  activeFilter === f.key
                    ? {
                        background: "var(--t-surface)",
                        color: "var(--t-text)",
                        border: "1px solid var(--t-line)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                      }
                    : { color: "var(--t-dim)", border: "1px solid transparent" }
                }
              >
                {f.label}
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background:
                      activeFilter === f.key ? "var(--t-accent-20)" : "var(--t-line)",
                    color:
                      activeFilter === f.key ? "var(--t-accent)" : "var(--t-dim)",
                  }}
                >
                  {f.count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="relative">
            <div
              className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--t-accent-20)", borderTopColor: "var(--t-accent)" }}
            />
          </div>
          <p className="text-sm" style={{ color: "var(--t-dim)" }}>
            Loading ingredients…
          </p>
        </div>
      ) : error ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "var(--t-surface)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <span className="text-4xl mb-3">⚠️</span>
          <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
            {error}
          </p>
          <button
            onClick={() => {
              setLoading(true);
              getIngredients()
                .then(setIngredients)
                .catch(() => setError("Failed to load ingredients"))
                .finally(() => setLoading(false));
            }}
            className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{
              background: "var(--t-accent-20)",
              color: "var(--t-accent)",
              border: "1px solid var(--t-accent-20)",
            }}
          >
            Retry
          </button>
        </div>
      ) : ingredients.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-2xl border border-dashed"
          style={{ borderColor: "var(--t-line)", background: "var(--t-surface)" }}
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-4"
            style={{ background: "var(--t-float)" }}
          >
            🌿
          </div>
          <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>
            No ingredients found
          </p>
          <p className="text-xs mt-2 text-center max-w-xs" style={{ color: "var(--t-dim)" }}>
            Add ingredients to your menu items and they'll appear here for stock management.
          </p>
        </div>
      ) : displayed.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-3xl">🔍</span>
          <p className="text-sm font-medium" style={{ color: "var(--t-text)" }}>
            No matches
          </p>
          <p className="text-xs" style={{ color: "var(--t-dim)" }}>
            {search ? `Nothing matches "${search}"` : "No ingredients in this filter"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayed.map((ing) => (
            <IngredientCard
              key={ing.name}
              ingredient={ing}
              onToggle={handleToggle}
              saving={saving}
            />
          ))}
        </div>
      )}
    </div>
  );
}
