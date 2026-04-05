import { useEffect, useState, useRef } from "react";
import {
  getDashMenu,
  updateDashMenuItem,
  toggleDashMenuItem,
  toggleChefsSpecial,
  toggleFeatured,
  getDashCategories,
} from "../../services/adminService";
import ProductFormModal from "../../components/dashboard/ProductFormModal";
import BulkUploadModal from "../../components/dashboard/BulkUploadModal";
import AddCategoryModal from "../../components/dashboard/AddCategoryModal";

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
function MenuItemCard({ item, onToggleAvail, onToggleSpecial, onToggleFeatured, onEdit, saving }) {
  const isSaving = saving === item._id;
  const discount = item.discount_percentage ?? 0;
  const effectivePrice = discount > 0 ? Math.round(item.price * (1 - discount / 100)) : null;
  const isVeg = item.is_veg !== false; // default to veg if undefined

  return (
    <div
      className="relative rounded-2xl overflow-hidden border flex flex-col group transition-all duration-200"
      style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}
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
            {isVeg ? "🥗" : "🍗"}
          </div>
        )}

        {/* Unavailable overlay */}
        {!item.is_available && (
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
            style={{ borderColor: isVeg ? "#22c55e" : "#ef4444" }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: isVeg ? "#22c55e" : "#ef4444" }}
            />
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
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span className="text-sm font-bold" style={{ color: "var(--t-accent)" }}>
              ₹{effectivePrice ?? item.price}
            </span>
            {effectivePrice && (
              <span className="text-xs line-through text-slate-500">₹{item.price}</span>
            )}
          </div>
        </div>

        {/* Availability — hero toggle */}
        <div
          className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl"
          style={{
            background: item.is_available ? "rgba(34,197,94,0.07)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${item.is_available ? "rgba(34,197,94,0.18)" : "rgba(255,255,255,0.06)"}`,
          }}
        >
          <span
            className={`text-xs font-semibold ${
              item.is_available ? "text-green-400" : "text-slate-500"
            }`}
          >
            {item.is_available ? "Available" : "Hidden"}
          </span>
          <Toggle
            checked={item.is_available}
            onChange={() => onToggleAvail(item._id)}
            disabled={isSaving}
            colorOn="bg-green-500"
          />
        </div>

        {/* Secondary actions */}
        <div className="flex items-center gap-1.5">
          {/* Chef's Special */}
          <button
            onClick={() => onToggleSpecial(item._id)}
            disabled={isSaving}
            title="Toggle Chef's Special"
            className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 rounded-lg transition-all duration-150 border disabled:opacity-50 ${
              item.is_chefs_special
                ? "text-amber-400 border-amber-500/25"
                : "text-slate-500 border-white/6 hover:text-amber-400 hover:border-amber-500/20"
            }`}
            style={{ background: item.is_chefs_special ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.03)" }}
          >
            <span>🔥</span>
            <span>Special</span>
          </button>

          {/* Featured */}
          <button
            onClick={() => onToggleFeatured(item._id)}
            disabled={isSaving}
            title="Toggle Featured"
            className={`flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-1.5 rounded-lg transition-all duration-150 border disabled:opacity-50 ${
              item.is_featured
                ? "text-blue-400 border-blue-500/25"
                : "text-slate-500 border-white/6 hover:text-blue-400 hover:border-blue-500/20"
            }`}
            style={{ background: item.is_featured ? "rgba(96,165,250,0.08)" : "rgba(255,255,255,0.03)" }}
          >
            <span>⭐</span>
            <span>Featured</span>
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(item)}
            disabled={isSaving}
            title="Edit item"
            className="w-8 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors disabled:opacity-50 border border-white/6 hover:border-white/15"
            style={{ background: "rgba(255,255,255,0.04)" }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 0l.172.172a2 2 0 010 2.828L12 16H9v-3z" />
            </svg>
          </button>
        </div>
      </div>

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
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
            {items.map((item) => (
              <MenuItemCard
                key={item._id}
                item={item}
                onToggleAvail={handlers.onToggleAvail}
                onToggleSpecial={handlers.onToggleSpecial}
                onToggleFeatured={handlers.onToggleFeatured}
                onEdit={handlers.onEdit}
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

  const handlers = {
    onToggleAvail: handleToggleAvail,
    onToggleSpecial: handleToggleSpecial,
    onToggleFeatured: handleToggleFeatured,
    onEdit: handleEdit,
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
