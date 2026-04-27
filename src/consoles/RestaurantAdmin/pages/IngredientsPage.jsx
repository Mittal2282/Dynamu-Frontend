import { useMemo, useState, useEffect } from "react";
import { getIngredients, toggleIngredient } from "../../../services/dashboardService";
import { useInfiniteList, useSentinel } from "../../../hooks/useInfiniteList";

function useDebounce(value, delay) {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

/* ─── Toggle ────────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      role="switch"
      aria-checked={checked}
      className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-300 focus:outline-none disabled:cursor-not-allowed disabled:opacity-40"
      style={{
        background: checked ? "#22c55e" : "rgba(239,68,68,0.7)",
        boxShadow: checked
          ? "0 0 10px rgba(34,197,94,0.4)"
          : "0 0 8px rgba(239,68,68,0.25)",
      }}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transform transition-transform duration-300 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ─── VegDot ─────────────────────────────────────────────────────────────────*/
function VegDot({ type = "veg", size = "sm" }) {
  const cfg = {
    veg:    { border: "#22c55e", dot: "#22c55e" },
    nonveg: { border: "#b45309", dot: "#ef4444" },
    mixed:  { border: "#d97706", dot: "#f59e0b" },
  };
  const { border, dot } = cfg[type] || cfg.veg;
  const boxSize = size === "lg" ? 18 : 14;
  const dotSize = size === "lg" ? 8  : 6;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: boxSize,
        height: boxSize,
        borderRadius: 3,
        border: `1.5px solid ${border}`,
        flexShrink: 0,
      }}
    >
      <span style={{ width: dotSize, height: dotSize, borderRadius: "50%", background: dot }} />
    </span>
  );
}

const VEG_LABELS = { veg: "Veg", nonveg: "Non-Veg", mixed: "Mixed" };
const VEG_COLORS = { veg: "#4ade80", nonveg: "#f87171", mixed: "#fbbf24" };

function getVegType(items_using = []) {
  const hasVeg    = items_using.some((d) => d.is_veg === true);
  const hasNonVeg = items_using.some((d) => d.is_veg === false);
  if (hasVeg && hasNonVeg) return "mixed";
  if (hasNonVeg) return "nonveg";
  return "veg";
}

/* ─── Ingredient Row ─────────────────────────────────────────────────────────*/
function IngredientCard({ ingredient, onToggle, saving }) {
  const { name, is_available, affected_count, items_using = [] } = ingredient;
  const isSaving  = saving === name;
  const initial   = name.charAt(0).toUpperCase();
  const vegType   = getVegType(items_using);
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">

        {/* Avatar */}
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 select-none"
          style={{
            background: is_available
              ? "linear-gradient(135deg, var(--t-accent-20), var(--t-accent2-20))"
              : "rgba(239,68,68,0.12)",
            color: is_available ? "var(--t-accent)" : "#f87171",
            border: `1px solid ${is_available ? "var(--t-accent-20)" : "rgba(239,68,68,0.2)"}`,
          }}
        >
          {initial}
        </div>

        {/* Name + veg indicator */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <p
            className="text-sm font-semibold capitalize truncate leading-tight"
            style={{ color: "var(--t-text)" }}
          >
            {name}
          </p>
          <VegDot type={vegType} />
          <span
            className="text-[11px] font-medium shrink-0 hidden sm:block"
            style={{ color: VEG_COLORS[vegType] }}
          >
            {VEG_LABELS[vegType]}
          </span>
        </div>

        {/* Stock pill */}
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 hidden xs:block"
          style={
            is_available
              ? { background: "rgba(34,197,94,0.12)", color: "#4ade80" }
              : { background: "rgba(239,68,68,0.12)", color: "#f87171" }
          }
        >
          {is_available ? "In Stock" : "Out of Stock"}
        </span>

        {/* Dishes count + expand chevron */}
        <button
          onClick={() => items_using.length > 0 && setExpanded((v) => !v)}
          className="flex items-center gap-1.5 shrink-0 transition-opacity"
          style={{
            opacity: items_using.length > 0 ? 1 : 0.45,
            cursor: items_using.length > 0 ? "pointer" : "default",
          }}
        >
          <span className="text-[11px]" style={{ color: "var(--t-dim)" }}>
            <span
              className="font-bold"
              style={{ color: affected_count > 0 ? "var(--t-text)" : "var(--t-dim)" }}
            >
              {affected_count}
            </span>{" "}
            {affected_count === 1 ? "dish" : "dishes"}
          </span>
          {items_using.length > 0 && (
            <svg
              className="w-3 h-3 transition-transform duration-200"
              style={{
                color: "var(--t-dim)",
                transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {/* Toggle / spinner */}
        {isSaving ? (
          <div className="w-11 h-6 flex items-center justify-center shrink-0">
            <div className="w-4 h-4 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
          </div>
        ) : (
          <Toggle
            checked={is_available}
            onChange={() => onToggle(name, !is_available)}
            disabled={isSaving}
          />
        )}
      </div>

      {/* Expandable dishes list */}
      {expanded && items_using.length > 0 && (
        <div
          className="mx-4 mb-3 rounded-xl overflow-hidden"
          style={{ background: "var(--t-float)", border: "1px solid var(--t-line)" }}
        >
          <p
            className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest"
            style={{ color: "var(--t-dim)", borderBottom: "1px solid var(--t-line)" }}
          >
            Used in
          </p>
          <ul className="divide-y" style={{ borderColor: "var(--t-line)" }}>
            {items_using.map((dish) => (
              <li key={dish._id} className="flex items-center gap-2.5 px-3 py-2">
                <div
                  className="w-8 h-8 rounded-lg shrink-0 overflow-hidden flex items-center justify-center"
                  style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
                >
                  {dish.image_url ? (
                    <img src={dish.image_url} alt={dish.name} className="w-full h-full object-cover" />
                  ) : (
                    <VegDot type={dish.is_veg ? "veg" : "nonveg"} />
                  )}
                </div>
                <VegDot type={dish.is_veg ? "veg" : "nonveg"} />
                <span className="text-xs truncate flex-1 min-w-0" style={{ color: "var(--t-text)" }}>
                  {dish.name}
                </span>
                {dish.price != null && (
                  <span className="text-[10px] font-bold shrink-0" style={{ color: "var(--t-accent)" }}>
                    ₹{dish.price}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
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

/* ─── Skeleton ───────────────────────────────────────────────────────────────── */
function IngredientRowSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="shimmer w-9 h-9 rounded-xl shrink-0" />
      <div className="flex-1 space-y-1.5 min-w-0">
        <div className="shimmer h-3.5 w-32 rounded" />
        <div className="shimmer h-3 w-16 rounded" />
      </div>
      <div className="shimmer h-5 w-16 rounded-full hidden sm:block" />
      <div className="shimmer h-4 w-14 rounded" />
      <div className="shimmer h-6 w-11 rounded-full shrink-0" />
    </div>
  );
}

function IngredientsPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="shimmer h-8 w-48 rounded-xl" />
          <div className="shimmer h-4 w-72 rounded" />
        </div>
        <div className="shimmer h-7 w-14 rounded-full" />
      </div>
      {/* Stat chips */}
      <div className="flex gap-3">
        {[80, 56, 48].map((w, i) => (
          <div
            key={i}
            className="flex-1 rounded-2xl px-4 py-3 space-y-2"
            style={{ background: "var(--t-surface)", border: "1px solid var(--t-line)" }}
          >
            <div className={`shimmer h-6 rounded`} style={{ width: `${w}%` }} />
            <div className="shimmer h-3 w-3/4 rounded" />
          </div>
        ))}
      </div>
      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="shimmer h-10 flex-1 rounded-xl" />
        <div className="shimmer h-10 w-56 rounded-xl" />
      </div>
      {/* Rows */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid var(--t-line)", background: "var(--t-surface)" }}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i}>
            <IngredientRowSkeleton />
            {i < 7 && <div className="h-px mx-4" style={{ background: "var(--t-line)" }} />}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ─────────────────────────────────────────────────────────────── */
export default function IngredientsPage() {
  const [saving, setSaving]             = useState(null);
  const [search, setSearch]             = useState("");
  const [activeFilter, setActiveFilter] = useState("all"); // 'all' | 'out' | 'in'

  const debouncedSearch = useDebounce(search, 400);

  const params = useMemo(() => ({
    ...(debouncedSearch && { search: debouncedSearch }),
    ...(activeFilter !== "all" && { status: activeFilter }),
  }), [debouncedSearch, activeFilter]);

  const { items: ingredients, setItems: setIngredients, hasMore, loading, error, loadMore, total } =
    useInfiniteList(getIngredients, params);

  const sentinelRef = useSentinel(loadMore);

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

  const isFiltering = debouncedSearch !== "" || activeFilter !== "all";

  const FILTERS = [
    { key: "all", label: "All" },
    { key: "out", label: "Out of Stock" },
    { key: "in",  label: "In Stock" },
  ];

  const initialLoad = loading && ingredients.length === 0;

  return (
    <div className="space-y-6">

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
        {!initialLoad && total > 0 && (
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

      {/* ── Stat chips ── */}
      {!initialLoad && total > 0 && (
        <div className="flex gap-3">
          <StatChip
            label={isFiltering ? "Matching" : "Total Ingredients"}
            value={total}
            color="var(--t-accent)"
          />
          <StatChip
            label="In Stock"
            value={ingredients.filter((i) => i.is_available).length}
            color="#4ade80"
          />
          <StatChip
            label="Out of Stock"
            value={ingredients.filter((i) => !i.is_available).length}
            color={ingredients.some((i) => !i.is_available) ? "#f87171" : "var(--t-dim)"}
          />
        </div>
      )}

      {/* ── Search + Filter bar ── */}
      {!initialLoad && (total > 0 || isFiltering) && (
        <div className="flex flex-col sm:flex-row gap-3">
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
                {activeFilter === f.key && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{
                      background: "var(--t-accent-20)",
                      color: "var(--t-accent)",
                    }}
                  >
                    {total}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Content ── */}
      {initialLoad ? (
        <IngredientsPageSkeleton />
      ) : error && ingredients.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-16 rounded-2xl"
          style={{ background: "var(--t-surface)", border: "1px solid rgba(239,68,68,0.2)" }}
        >
          <span className="text-4xl mb-3">⚠️</span>
          <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>{error}</p>
          <button
            onClick={() => setActiveFilter(activeFilter)} // re-trigger params change
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
      ) : !isFiltering && total === 0 ? (
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
          <p className="text-sm font-semibold" style={{ color: "var(--t-text)" }}>No ingredients found</p>
          <p className="text-xs mt-2 text-center max-w-xs" style={{ color: "var(--t-dim)" }}>
            Add ingredients to your menu items and they'll appear here for stock management.
          </p>
        </div>
      ) : total === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-2">
          <span className="text-3xl">🔍</span>
          <p className="text-sm font-medium" style={{ color: "var(--t-text)" }}>No matches</p>
          <p className="text-xs" style={{ color: "var(--t-dim)" }}>
            {search ? `Nothing matches "${search}"` : "No ingredients in this filter"}
          </p>
        </div>
      ) : (
        <>
          <div
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid var(--t-line)", background: "var(--t-surface)" }}
          >
            {ingredients.map((ing, i) => (
              <div key={ing.name}>
                <IngredientCard ingredient={ing} onToggle={handleToggle} saving={saving} />
                {i < ingredients.length - 1 && (
                  <div className="h-px mx-4" style={{ background: "var(--t-line)" }} />
                )}
              </div>
            ))}
          </div>

          {/* ── Infinite scroll sentinel ── */}
          <div ref={sentinelRef} className="h-1" />
          {loading && (
            <div className="flex justify-center py-4">
              <div
                className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "var(--t-accent-20)", borderTopColor: "var(--t-accent)" }}
              />
            </div>
          )}
          {!hasMore && ingredients.length > 0 && (
            <p className="text-center text-xs py-2" style={{ color: "var(--t-dim)" }}>
              All {total} ingredient{total !== 1 ? "s" : ""} loaded
            </p>
          )}
        </>
      )}
    </div>
  );
}
