import { useEffect, useState, useRef } from "react";
import {
  getDashMenu,
  updateDashMenuItem,
  deleteDashMenuItem,
  toggleDashMenuItem,
  toggleChefsSpecial,
  toggleFeatured,
  getDashCategories,
} from "../../services/adminService";
import ProductFormModal from "../../components/dashboard/ProductFormModal";
import BulkUploadModal from "../../components/dashboard/BulkUploadModal";
import AddCategoryModal from "../../components/dashboard/AddCategoryModal";
import { getItemVegStatus, variantEffectivePrice } from "../../utils/vegStatus";

/* ─── Toggle Switch ──────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange, disabled, colorOn = "bg-green-500" }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-checked={checked}
      role="switch"
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? colorOn : "bg-slate-600/80"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* ─── Item Card ──────────────────────────────────────────────────────────────── */
function MenuItemCard({ item, onToggleAvail, onToggleSpecial, onToggleFeatured, onEdit, onDelete, onUpdateDiscount, onUpdateVariants, saving }) {
  const isSaving = saving === item._id;
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);
  const [discountInput, setDiscountInput] = useState(String(item.discount_percentage ?? 0));
  // Variant inline editing: { idx, field: 'price'|'discount', value }
  const [variantDraft, setVariantDraft] = useState(null);
  const discount = item.discount_percentage ?? 0;
  const effectivePrice = discount > 0 ? Math.round(item.price * (1 - discount / 100)) : null;
  const vegStatus = getItemVegStatus(item);
  const vegColor = vegStatus === 'veg' ? '#22c55e' : vegStatus === 'nonveg' ? '#ef4444' : '#94a3b8';
  const hasVariants = item.has_variants && item.variants?.length > 0;
  const minVariantPrice = hasVariants
    ? Math.min(...item.variants.map(v => variantEffectivePrice(v)))
    : null;

  const commitVariant = (idx, field, rawValue) => {
    const val = Math.min(field === 'discount' ? 100 : Infinity, Math.max(0, parseFloat(rawValue) || 0));
    setVariantDraft(null);
    const key = field === 'price' ? 'price' : 'discount_percentage';
    const current = item.variants[idx][key] ?? 0;
    if (val === current) return;
    const updated = item.variants.map((v, i) => i === idx ? { ...v, [key]: val } : v);
    onUpdateVariants(item._id, updated);
  };
  const blockedByIngredient = item.stock_status === false && (item.blocked_by_ingredients?.length ?? 0) > 0;

  const commitDiscount = () => {
    const val = Math.min(100, Math.max(0, parseInt(discountInput, 10) || 0));
    setEditingDiscount(false);
    if (val === discount) return;
    if (hasVariants) {
      const updated = item.variants.map(v => ({ ...v, discount_percentage: val }));
      onUpdateVariants(item._id, updated);
    } else {
      onUpdateDiscount(item._id, val);
    }
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden border flex flex-col group transition-all duration-200"
      style={{
        background: "var(--t-surface)",
        borderColor: blockedByIngredient ? "rgba(251,146,60,0.35)" : "var(--t-line)",
      }}
    >
      {/* ── Image ── */}
      <div className="relative w-full overflow-hidden" style={{ paddingBottom: "58%" }}>
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="absolute inset-0 flex items-center justify-center text-5xl"
            style={{ background: "var(--t-float)" }}
          >
            {vegStatus !== 'nonveg' ? "🥗" : "🍗"}
          </div>
        )}

        {/* Ingredient-blocked overlay */}
        {blockedByIngredient && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 backdrop-blur-[1px]"
            style={{ background: "rgba(0,0,0,0.7)" }}>
            <span className="text-lg">🚫</span>
            <span
              className="text-[9px] font-black uppercase tracking-[0.12em] px-2 py-0.5 rounded"
              style={{ background: "rgba(251,146,60,0.25)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.4)" }}
            >
              Ingredient Off
            </span>
          </div>
        )}

        {/* Manually hidden overlay */}
        {!item.is_available && !blockedByIngredient && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/65 backdrop-blur-[1px]">
            <span
              className="text-[10px] font-black uppercase tracking-[0.15em] px-2.5 py-1 rounded border"
              style={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.2)" }}
            >
              Hidden
            </span>
          </div>
        )}

        {/* Veg / non-veg dot — top left */}
        <div
          className="absolute top-2 left-2 p-[3px] rounded-sm shadow-sm"
          style={{ background: "rgba(255,255,255,0.93)" }}
        >
          <div
            className="w-3 h-3 rounded-sm border-[2px] flex items-center justify-center"
            style={{ borderColor: vegColor }}
          >
            {vegStatus === 'mixed' ? (
              <div className="flex items-center gap-[2px]">
                <div className="w-1 h-1 rounded-full" style={{ background: '#22c55e' }} />
                <div className="w-1 h-1 rounded-full" style={{ background: '#ef4444' }} />
              </div>
            ) : (
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: vegColor }} />
            )}
          </div>
        </div>

        {/* Discount ribbon — top right */}
        {discount > 0 && (
          <div
            className="absolute top-2 right-2 text-[11px] font-black px-1.5 py-0.5 rounded-md"
            style={{ background: "#f59e0b", color: "#000" }}
          >
            −{discount}%
          </div>
        )}

        {/* Chef's Special — bottom left */}
        {item.is_chefs_special && (
          <div
            className="absolute bottom-2 left-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
            style={{ background: "rgba(0,0,0,0.68)", color: "#fbbf24" }}
          >
            🔥 Special
          </div>
        )}

        {/* Featured — bottom right */}
        {item.is_featured && (
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold"
            style={{ background: "rgba(0,0,0,0.68)", color: "#60a5fa" }}
          >
            ⭐ Featured
          </div>
        )}
      </div>

      {/* ── Content ── */}
      <div className="flex flex-col gap-2.5 p-3 flex-1">
        {/* Name + price */}
        <div>
          <p className="text-sm font-semibold text-white line-clamp-1 leading-snug">
            {item.name}
          </p>
          <div className="flex items-center justify-between gap-1 mt-0.5">
            <div className="flex items-baseline gap-1.5 min-w-0">
              {hasVariants ? (
                <span className="text-sm font-bold" style={{ color: "var(--t-accent)" }}>
                  from ₹{minVariantPrice}
                </span>
              ) : (
                <>
                  <span className="text-sm font-bold" style={{ color: "var(--t-accent)" }}>
                    ₹{effectivePrice ?? item.price}
                  </span>
                  {effectivePrice && (
                    <span className="text-xs line-through text-slate-500">₹{item.price}</span>
                  )}
                </>
              )}
            </div>

            {/* Discount chip — with ✏ affordance */}
            {editingDiscount ? (
              <div className="flex items-center gap-1">
                <input
                  autoFocus
                  type="number"
                  min={0}
                  max={100}
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  onBlur={commitDiscount}
                  onKeyDown={(e) => { if (e.key === "Enter") commitDiscount(); if (e.key === "Escape") setEditingDiscount(false); }}
                  className="w-12 text-center text-xs font-bold rounded-md py-0.5 focus:outline-none"
                  style={{ background: "var(--t-float)", border: "1px solid var(--t-accent)", color: "var(--t-accent)" }}
                />
                <span className="text-[10px] text-slate-500">%</span>
              </div>
            ) : (
              <button
                onClick={() => { setDiscountInput(String(discount)); setEditingDiscount(true); }}
                disabled={isSaving}
                title="Click to set discount"
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold transition-all duration-150 disabled:opacity-40"
                style={
                  discount > 0
                    ? { background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }
                    : { background: "var(--t-float)", color: "var(--t-dim)", border: "1px solid var(--t-line)" }
                }
              >
                <svg className="w-2.5 h-2.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                </svg>
                {discount > 0 ? `−${discount}%` : "Discount"}
              </button>
            )}
          </div>
        </div>

        {/* Variants — quick edit panel */}
        {hasVariants && (
          <div
            className="rounded-xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.08)" }}
          >
            {/* Section header */}
            <div
              className="flex items-center justify-between px-2.5 py-1.5"
              style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            >
              <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "var(--t-dim)" }}>
                {item.variants[0]?.groupName || "Variants"}
              </span>
              <span className="text-[9px]" style={{ color: "#475569" }}>tap to edit</span>
            </div>
            {/* Variant rows — 2-line layout for responsiveness */}
            <div>
              {item.variants.map((v, idx) => {
                const vCol = v.isVeg !== false ? "#22c55e" : "#ef4444";
                const avail = v.isAvailable !== false;
                const effPrice = variantEffectivePrice(v);
                const vDisc = v.discount_percentage ?? 0;
                const isDraftingPrice = variantDraft?.idx === idx && variantDraft.field === 'price';
                const isDraftingDisc  = variantDraft?.idx === idx && variantDraft.field === 'discount';
                return (
                  <div
                    key={idx}
                    className="px-2.5 py-2"
                    style={{
                      opacity: avail ? 1 : 0.5,
                      background: "rgba(255,255,255,0.01)",
                      borderBottom: idx < item.variants.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                    }}
                  >
                    {/* Line 1: availability pill + veg dot + name */}
                    <div className="flex items-center gap-1.5 mb-1">
                      {/* Availability toggle — labeled pill */}
                      <button
                        type="button"
                        title={avail ? "Tap to mark unavailable" : "Tap to mark available"}
                        disabled={isSaving}
                        onClick={() => {
                          const updated = item.variants.map((vv, i) => i === idx ? { ...vv, isAvailable: !avail } : vv);
                          onUpdateVariants(item._id, updated);
                        }}
                        className="shrink-0 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-all duration-150 disabled:opacity-40"
                        style={
                          avail
                            ? { background: 'rgba(34,197,94,0.12)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }
                            : { background: 'rgba(71,85,105,0.2)', color: '#64748b', border: '1px solid rgba(71,85,105,0.3)' }
                        }
                      >
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: avail ? '#22c55e' : '#475569' }} />
                        {avail ? 'On' : 'Off'}
                      </button>
                      {/* Veg dot */}
                      <span
                        className="w-2 h-2 rounded-[2px] border shrink-0 flex items-center justify-center"
                        style={{ borderColor: vCol }}
                      >
                        <span className="w-1 h-1 rounded-full block" style={{ background: vCol }} />
                      </span>
                      {/* Name */}
                      <span className="text-[11px] text-slate-300 truncate flex-1 min-w-0">{v.name}</span>
                    </div>

                    {/* Line 2: discount + price — right-aligned */}
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Discount inline editor */}
                      {isDraftingDisc ? (
                        <input
                          autoFocus
                          type="number" min="0" max="100"
                          value={variantDraft.value}
                          onChange={e => setVariantDraft(d => ({ ...d, value: e.target.value }))}
                          onBlur={() => commitVariant(idx, 'discount', variantDraft.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitVariant(idx, 'discount', variantDraft.value); if (e.key === 'Escape') setVariantDraft(null); }}
                          className="w-10 text-center text-[10px] font-bold rounded py-0.5 focus:outline-none"
                          style={{ background: "var(--t-float)", border: "1px solid var(--t-accent)", color: "var(--t-accent)" }}
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={isSaving}
                          title={vDisc > 0 ? "Click to edit discount" : "Click to add discount"}
                          onClick={() => setVariantDraft({ idx, field: 'discount', value: String(vDisc) })}
                          className="text-[10px] font-semibold shrink-0 px-1 py-0.5 rounded transition-colors"
                          style={vDisc > 0
                            ? { color: '#fbbf24', background: 'rgba(245,158,11,0.1)' }
                            : { color: 'var(--t-dim)', background: 'transparent' }}
                        >
                          {vDisc > 0 ? `−${vDisc}%` : '+ disc'}
                        </button>
                      )}
                      {/* Price inline editor — with ✏ hint */}
                      {isDraftingPrice ? (
                        <input
                          autoFocus
                          type="number" min="0"
                          value={variantDraft.value}
                          onChange={e => setVariantDraft(d => ({ ...d, value: e.target.value }))}
                          onBlur={() => commitVariant(idx, 'price', variantDraft.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitVariant(idx, 'price', variantDraft.value); if (e.key === 'Escape') setVariantDraft(null); }}
                          className="w-14 text-center text-[11px] font-bold rounded py-0.5 focus:outline-none"
                          style={{ background: "var(--t-float)", border: "1px solid var(--t-accent)", color: "var(--t-accent)" }}
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={isSaving}
                          title="Click to edit price"
                          onClick={() => setVariantDraft({ idx, field: 'price', value: String(v.price) })}
                          className="flex items-center gap-0.5 text-[11px] font-semibold shrink-0 transition-colors group/vp"
                          style={{ color: "var(--t-accent)" }}
                        >
                          {vDisc > 0 ? (
                            <span className="flex items-baseline gap-1">
                              <span>₹{effPrice}</span>
                              <span className="line-through text-[9px] opacity-50">₹{v.price}</span>
                            </span>
                          ) : `₹${v.price}`}
                          <svg className="w-2.5 h-2.5 ml-0.5 opacity-30 group-hover/vp:opacity-80 transition-opacity shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── Availability row (redesigned) ── */}
        {blockedByIngredient ? (
          <div
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
            style={{
              background: "rgba(251,146,60,0.07)",
              border: "1px solid rgba(251,146,60,0.2)",
            }}
          >
            <span className="text-sm">🚫</span>
            <span className="text-[11px] font-semibold text-orange-400 leading-tight">
              Blocked · ingredient off
            </span>
          </div>
        ) : (
          <div
            className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl"
            style={{
              background: item.is_available ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${item.is_available ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.07)"}`,
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: item.is_available ? "#22c55e" : "#475569" }}
              />
              <span
                className="text-xs font-semibold truncate"
                style={{ color: item.is_available ? "#4ade80" : "#64748b" }}
              >
                {item.is_available ? "Visible to customers" : "Hidden from menu"}
              </span>
            </div>
            <Toggle
              checked={item.is_available}
              onChange={() => onToggleAvail(item._id)}
              disabled={isSaving}
              colorOn="bg-green-500"
            />
          </div>
        )}

        {/* ── Action strip (redesigned 2×2 grid) ── */}
        <div className="flex flex-col gap-1.5">
          {/* Row 1: Special + Featured toggles */}
          <div className="flex gap-1.5">
            <button
              onClick={() => onToggleSpecial(item._id)}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 border disabled:opacity-50"
              style={
                item.is_chefs_special
                  ? { background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.35)" }
                  : { background: "rgba(255,255,255,0.03)", color: "#64748b", border: "1px solid rgba(255,255,255,0.07)" }
              }
            >
              <span>🔥</span>
              <span className="whitespace-nowrap">Special</span>
            </button>

            <button
              onClick={() => onToggleFeatured(item._id)}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 border disabled:opacity-50"
              style={
                item.is_featured
                  ? { background: "rgba(96,165,250,0.12)", color: "#60a5fa", border: "1px solid rgba(96,165,250,0.3)" }
                  : { background: "rgba(255,255,255,0.03)", color: "#64748b", border: "1px solid rgba(255,255,255,0.07)" }
              }
            >
              <span>⭐</span>
              <span className="whitespace-nowrap">Featured</span>
            </button>
          </div>

          {/* Row 2: Edit + Delete */}
          <div className="flex gap-1.5">
            <button
              onClick={() => onEdit(item)}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 hover:text-white disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.04)", color: "var(--t-text)", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
              </svg>
              Edit Item
            </button>

            <button
              onClick={() => setConfirmDelete(true)}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-150 hover:text-red-400 hover:border-red-500/30 disabled:opacity-50"
              style={{ background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.09)" }}
            >
              <svg className="w-3 h-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete confirmation overlay ── */}
      {confirmDelete && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-2xl px-4 text-center"
          style={{ background: "rgba(0,0,0,0.82)", backdropFilter: "blur(4px)" }}>
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          <div>
            <p className="text-sm font-semibold text-white">Delete item?</p>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.name}</p>
          </div>
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg border border-white/15 text-slate-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => { setConfirmDelete(false); onDelete(item._id); }}
              className="flex-1 py-1.5 text-xs font-semibold rounded-lg bg-red-500/80 hover:bg-red-500 text-white transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Saving overlay */}
      {isSaving && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl"
          style={{ background: "rgba(0,0,0,0.45)" }}>
          <div className="w-6 h-6 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

/* ─── Category Section ───────────────────────────────────────────────────────── */
function CategorySection({ category, items, handlers, onAddToCategory }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-2.5 min-w-0 group"
        >
          <svg
            className={`w-3.5 h-3.5 shrink-0 text-slate-500 group-hover:text-slate-300 transition-all duration-200 ${
              collapsed ? "-rotate-90" : ""
            }`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
          <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400 group-hover:text-slate-200 transition-colors truncate">
            {category}
          </h2>
          <span
            className="text-[11px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
            style={{ background: "var(--t-float)", color: "var(--t-dim)" }}
          >
            {items.length}
          </span>
        </button>

        <button
          onClick={() => onAddToCategory(category)}
          className="text-[11px] font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg transition-all duration-150 text-slate-500 hover:text-white shrink-0 border border-white/6 hover:border-white/15"
          style={{ background: "rgba(255,255,255,0.04)" }}
        >
          <span className="text-base leading-none">+</span> Add here
        </button>
      </div>

      {!collapsed && (
        items.length === 0 ? (
          <div
            className="rounded-2xl flex items-center justify-center h-28 border border-dashed"
            style={{ borderColor: "rgba(255,255,255,0.07)" }}
          >
            <p className="text-slate-600 text-xs">No items in this category</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map((item) => (
              <MenuItemCard
                key={item._id}
                item={item}
                onToggleAvail={handlers.onToggleAvail}
                onToggleSpecial={handlers.onToggleSpecial}
                onToggleFeatured={handlers.onToggleFeatured}
                onEdit={handlers.onEdit}
                onDelete={handlers.onDelete}
                onUpdateDiscount={handlers.onUpdateDiscount}
                onUpdateVariants={handlers.onUpdateVariants}
                saving={handlers.saving}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────────────────────── */
export default function MenuManagePage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(null);

  // Search & filter
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [availFilter, setAvailFilter] = useState("all");

  // Categories
  const [categories, setCategories] = useState([]);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);

  // Add Product dropdown
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef(null);

  // Product form modal
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Bulk upload modal
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  useEffect(() => {
    getDashMenu()
      .then(setItems)
      .catch(() => setError("Failed to load menu."))
      .finally(() => setLoading(false));
    getDashCategories()
      .then(setCategories)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const h = (e) => {
      if (addMenuRef.current && !addMenuRef.current.contains(e.target)) setAddMenuOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  /* ── Handlers ── */
  const handleUpdate = async (id, field, val) => {
    setSaving(id);
    try {
      const updated = await updateDashMenuItem(id, { [field]: val });
      setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...updated } : it)));
    } catch {
      alert("Failed to save change.");
    } finally {
      setSaving(null);
    }
  };

  const handleToggleAvail = async (id) => {
    setSaving(id);
    try {
      const updated = await toggleDashMenuItem(id);
      setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...updated } : it)));
    } catch {
      alert("Failed to toggle availability.");
    } finally {
      setSaving(null);
    }
  };

  const handleToggleSpecial = async (id) => {
    setSaving(id);
    try {
      const updated = await toggleChefsSpecial(id);
      setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...updated } : it)));
    } catch {
      alert("Failed to toggle Chef's Special.");
    } finally {
      setSaving(null);
    }
  };

  const handleToggleFeatured = async (id) => {
    setSaving(id);
    try {
      const updated = await toggleFeatured(id);
      setItems((prev) => prev.map((it) => (it._id === id ? { ...it, ...updated } : it)));
    } catch {
      alert("Failed to toggle Featured.");
    } finally {
      setSaving(null);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setProductModalOpen(true);
  };

  const handleAddToCategory = (category) => {
    setEditingItem(null);
    setProductModalOpen(true);
    // Pre-select category via initial values — ProductFormModal handles via item prop
    // Pass a stub with category pre-filled
    setEditingItem({ _id: null, category, _isNew: true });
  };

  const handleProductSaved = (savedItem) => {
    setItems((prev) =>
      editingItem?._id
        ? prev.map((it) => (it._id === savedItem._id ? savedItem : it))
        : [...prev, savedItem]
    );
    setProductModalOpen(false);
    setEditingItem(null);
  };

  const handleBulkImport = () => {
    getDashMenu().then(setItems);
    setBulkModalOpen(false);
  };

  const handleUpdateDiscount = async (itemId, value) => {
    setSaving(itemId);
    try {
      const updated = await updateDashMenuItem(itemId, { discount_percentage: value });
      setItems((prev) => prev.map((i) => (i._id === itemId ? { ...i, ...updated } : i)));
    } catch {
      // silently ignore
    } finally {
      setSaving(null);
    }
  };

  const handleUpdateVariants = async (itemId, updatedVariants) => {
    setSaving(itemId);
    try {
      const updated = await updateDashMenuItem(itemId, { variants: updatedVariants });
      setItems((prev) => prev.map((i) => (i._id === itemId ? { ...i, ...updated } : i)));
    } catch {
      // silently ignore
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (itemId) => {
    setSaving(itemId);
    try {
      await deleteDashMenuItem(itemId);
      setItems((prev) => prev.filter((i) => i._id !== itemId));
    } catch {
      // silently ignore — item stays in list
    } finally {
      setSaving(null);
    }
  };

  const handlers = {
    onToggleAvail: handleToggleAvail,
    onToggleSpecial: handleToggleSpecial,
    onToggleFeatured: handleToggleFeatured,
    onEdit: handleEdit,
    onDelete: handleDelete,
    onUpdateDiscount: handleUpdateDiscount,
    onUpdateVariants: handleUpdateVariants,
    saving,
  };

  /* ── Loading / error ── */
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 gap-3">
        <div className="w-6 h-6 border-[3px] border-white/10 border-t-orange-500 rounded-full animate-spin" />
        <span className="text-slate-500 text-sm">Loading menu…</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-red-400 text-sm">
        {error}
      </div>
    );
  }

  /* ── Derived data ── */
  const allCategories = [...new Set(items.map((i) => i.category || "Uncategorised"))].sort();

  const visibleItems = items.filter((item) => {
    if (categoryFilter && (item.category || "Uncategorised") !== categoryFilter) return false;
    if (availFilter === "available" && !item.is_available) return false;
    if (availFilter === "unavailable" && item.is_available) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      if (
        !(item.name || "").toLowerCase().includes(q) &&
        !(item.category || "").toLowerCase().includes(q) &&
        !(item.description || "").toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const grouped = visibleItems.reduce((acc, item) => {
    const cat = item.category || "Uncategorised";
    (acc[cat] = acc[cat] || []).push(item);
    return acc;
  }, {});

  const isFiltering = searchQuery.trim() !== "" || categoryFilter !== "" || availFilter !== "all";
  const availableCount = items.filter((i) => i.is_available).length;

  return (
    <div className="space-y-7">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              background: "linear-gradient(90deg, #fff 30%, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Menu Management
          </h1>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: "var(--t-accent-20)", color: "var(--t-accent)" }}>
              {items.length} items
            </span>
            <span className="text-slate-600 text-xs">·</span>
            <span className="text-slate-500 text-xs">{availableCount} available</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => setCategoryModalOpen(true)}
            className="inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M7 7h10M7 12h4m-4 5h10M5 3h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2z" />
            </svg>
            Category
          </button>

          <div className="relative" ref={addMenuRef}>
            <button
              onClick={() => setAddMenuOpen((o) => !o)}
              className="inline-flex items-center gap-2 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all active:scale-95"
              style={{ background: "var(--t-accent)" }}
            >
              + Add Item
              <svg
                className={`w-3.5 h-3.5 transition-transform duration-150 ${addMenuOpen ? "rotate-180" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {addMenuOpen && (
              <div className="absolute right-0 mt-1.5 w-52 rounded-xl shadow-2xl z-50 overflow-hidden py-1"
                style={{ background: "var(--t-float)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <button
                  onClick={() => { setEditingItem(null); setProductModalOpen(true); setAddMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2.5"
                >
                  <span className="text-base">➕</span> Single Product
                </button>
                <button
                  onClick={() => { setBulkModalOpen(true); setAddMenuOpen(false); }}
                  className="w-full text-left px-4 py-2.5 text-sm text-white hover:bg-white/5 transition-colors flex items-center gap-2.5"
                >
                  <span className="text-base">📂</span> Bulk Upload
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-52">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search items…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-8 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            onFocus={(e) => (e.target.style.borderColor = "var(--t-accent)")}
            onBlur={(e) => (e.target.style.borderColor = "")}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs">
              ✕
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-slate-300 focus:outline-none transition-colors"
          style={{ color: "var(--t-text)" }}
        >
          <option value="">All categories</option>
          {allCategories.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Availability filter */}
        <div className="flex rounded-xl border border-white/10 overflow-hidden text-xs font-semibold bg-white/5">
          {[
            { value: "all", label: "All" },
            { value: "available", label: "Available" },
            { value: "unavailable", label: "Hidden" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAvailFilter(opt.value)}
              className={`px-3 py-2 transition-all duration-150 ${
                availFilter === opt.value
                  ? "text-white"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
              style={availFilter === opt.value ? { background: "var(--t-accent)" } : {}}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isFiltering && (
          <>
            <span className="text-slate-600 text-xs">{visibleItems.length} of {items.length}</span>
            <button
              onClick={() => { setSearchQuery(""); setCategoryFilter(""); setAvailFilter("all"); }}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* ── Category sections ───────────────────────────────────────────────── */}
      {Object.entries(grouped).map(([category, catItems]) => (
        <CategorySection
          key={category}
          category={category}
          items={catItems}
          handlers={handlers}
          onAddToCategory={handleAddToCategory}
        />
      ))}

      {/* ── Empty state ──────────────────────────────────────────────────────── */}
      {visibleItems.length === 0 && (
        <div
          className="border border-white/10 rounded-2xl flex flex-col items-center justify-center py-20 text-center gap-3"
          style={{ background: "var(--t-surface)" }}
        >
          <span className="text-5xl">{isFiltering ? "🔍" : "🍽️"}</span>
          <p className="text-white font-semibold">
            {isFiltering ? "No items match your filters" : "Your menu is empty"}
          </p>
          <p className="text-slate-500 text-sm max-w-xs">
            {isFiltering
              ? "Try adjusting your search or filters."
              : "Add your first dish to get started."}
          </p>
          {isFiltering ? (
            <button
              onClick={() => { setSearchQuery(""); setCategoryFilter(""); setAvailFilter("all"); }}
              className="text-sm font-semibold px-4 py-2 rounded-xl transition-all"
              style={{ color: "var(--t-accent)", background: "var(--t-accent-10)" }}
            >
              Clear all filters
            </button>
          ) : (
            <button
              onClick={() => { setEditingItem(null); setProductModalOpen(true); }}
              className="text-sm font-semibold text-white px-4 py-2 rounded-xl transition-all active:scale-95"
              style={{ background: "var(--t-accent)" }}
            >
              + Add First Item
            </button>
          )}
        </div>
      )}

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <ProductFormModal
        isOpen={productModalOpen}
        onClose={() => { setProductModalOpen(false); setEditingItem(null); }}
        onSave={handleProductSaved}
        item={editingItem?._isNew ? { category: editingItem.category } : editingItem}
        existingCategories={categories}
      />

      <BulkUploadModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        onImport={handleBulkImport}
        categories={categories}
      />

      <AddCategoryModal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        onCreated={(name) => setCategories((prev) => [...prev, name])}
      />
    </div>
  );
}
