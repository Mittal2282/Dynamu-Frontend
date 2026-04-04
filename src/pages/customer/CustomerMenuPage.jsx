import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import MenuItemCard from "../../components/customer/MenuItemCard";
import Text from "../../components/ui/Text";
import { useCartCount } from "../../store/cartStore";
import { restaurantStore } from "../../store/restaurantStore";
import { formatCurrency } from "../../utils/formatters";

// ── Category ordering ──────────────────────────────────────────────────────────
const CATEGORY_PRIORITY = [
  ["starter", "starters", "appetizer", "appetizers", "snack", "snacks"],
  ["soup", "soups", "salad", "salads"],
  ["main course", "main dishes", "mains", "main", "entree"],
  ["bread", "breads", "rice", "noodles", "pasta"],
  ["side", "sides", "accompaniment"],
  ["beverage", "beverages", "drinks", "mocktail", "cocktail"],
  ["dessert", "desserts", "sweet", "sweets", "ice cream"],
];

function getCategoryRank(name) {
  const lower = name.toLowerCase();
  for (let i = 0; i < CATEGORY_PRIORITY.length; i++) {
    if (CATEGORY_PRIORITY[i].some((k) => lower.includes(k))) return i;
  }
  return CATEGORY_PRIORITY.length;
}

function sortCategories(cats) {
  return [...cats].sort((a, b) => getCategoryRank(a) - getCategoryRank(b));
}

// ── Category section ───────────────────────────────────────────────────────────
function CategorySection({ name, items, currencySymbol, innerRef }) {
  return (
    <div ref={innerRef} className="scroll-mt-32 md:scroll-mt-36">
      {/* Section header */}
      <div className="mb-4">
        <h2
          className="text-xl md:text-2xl font-black uppercase tracking-tight"
          style={{ color: "var(--t-text)" }}
        >
          {name}
        </h2>
        <div
          className="mt-1.5 w-10 h-[3px] rounded-full"
          style={{ background: "var(--t-accent)" }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item) => (
          <MenuItemCard
            key={item._id}
            item={item}
            currencySymbol={currencySymbol}
          />
        ))}
      </div>
    </div>
  );
}

// ── Dual-thumb price range slider ─────────────────────────────────────────────
function PriceRangeSlider({ allItems, priceMin, setPriceMin, priceMax, setPriceMax, currencySymbol, onClose }) {
  const prices = useMemo(() => allItems.map((i) => i.price).filter(Boolean), [allItems]);
  const minBound = useMemo(() => Math.floor(Math.min(...prices, 0)), [prices]);
  const maxBound = useMemo(() => Math.ceil(Math.max(...prices, 1000)), [prices]);

  const currentMin = priceMin !== "" ? Number(priceMin) : minBound;
  const currentMax = priceMax !== "" ? Number(priceMax) : maxBound;

  const minPct = ((currentMin - minBound) / (maxBound - minBound)) * 100;
  const maxPct = ((currentMax - minBound) / (maxBound - minBound)) * 100;

  return (
    <div className="flex items-center gap-2.5 shrink-0 px-3 py-1.5 rounded-full border" style={{ background: "var(--t-accent-10)", borderColor: "var(--t-accent)" }}>
      {/* Min label */}
      <span className="text-[10px] font-bold tabular-nums whitespace-nowrap" style={{ color: "var(--t-accent)", minWidth: "2.5rem", textAlign: "right" }}>
        {formatCurrency(currentMin, currencySymbol)}
      </span>

      {/* Track + thumbs */}
      <div className="relative flex items-center" style={{ width: "96px", height: "20px" }}>
        {/* Background track */}
        <div className="absolute w-full h-[4px] rounded-full" style={{ background: "var(--t-line)" }} />
        {/* Active range fill */}
        <div
          className="absolute h-[4px] rounded-full"
          style={{
            left: `${minPct}%`,
            width: `${maxPct - minPct}%`,
            background: "var(--t-accent)",
          }}
        />
        {/* Min thumb */}
        <input
          type="range"
          min={minBound}
          max={maxBound}
          value={currentMin}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v <= currentMax) setPriceMin(v === minBound ? "" : String(v));
          }}
          className="price-range-thumb"
          style={{ zIndex: currentMin > maxBound - (maxBound - minBound) * 0.1 ? 5 : 3 }}
        />
        {/* Max thumb */}
        <input
          type="range"
          min={minBound}
          max={maxBound}
          value={currentMax}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (v >= currentMin) setPriceMax(v === maxBound ? "" : String(v));
          }}
          className="price-range-thumb"
          style={{ zIndex: 4 }}
        />
      </div>

      {/* Max label */}
      <span className="text-[10px] font-bold tabular-nums whitespace-nowrap" style={{ color: "var(--t-accent)", minWidth: "2.5rem" }}>
        {formatCurrency(currentMax, currencySymbol)}
      </span>

      {/* Close */}
      <button
        onClick={onClose}
        className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black shrink-0 transition-opacity hover:opacity-80"
        style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}
      >
        ✕
      </button>
    </div>
  );
}

// ── Icons ──────────────────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function CustomerMenuPage() {
  const menuFromStore = restaurantStore((s) => s.menu);
  const { menu: menuFromOutlet } = useOutletContext() || {};
  const menu = useMemo(() => {
    return menuFromStore && Object.keys(menuFromStore).length > 0
      ? menuFromStore
      : (menuFromOutlet ?? {});
  }, [menuFromStore, menuFromOutlet]);

  const { currencySymbol } = restaurantStore();
  const count = useCartCount();

  const categories = useMemo(() => sortCategories(Object.keys(menu)), [menu]);

  const [activeCategory, setActiveCategory] = useState(
    () => categories[0] ?? null,
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const [vegFilter, setVegFilter] = useState(null); // null | true | false
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const headerRef = useRef(null);
  const categoryRefs = useRef({});
  const sliderCategoryRefs = useRef({});
  const isScrollingToRef = useRef(false);

  const allMenuItems = useMemo(() => Object.values(menu).flat(), [menu]);

  const activeFilterCount =
    (vegFilter !== null ? 1 : 0) + (priceMin !== "" || priceMax !== "" ? 1 : 0);

  const isSearchActive = searchQuery.trim() !== "" || activeFilterCount > 0;

  const filteredItems = useMemo(() => {
    if (!isSearchActive) return [];
    const q = searchQuery.trim().toLowerCase();
    return allMenuItems
      .map((item) => {
        if (vegFilter !== null && item.is_veg !== vegFilter) return null;
        if (priceMin !== "" && item.price < parseFloat(priceMin)) return null;
        if (priceMax !== "" && item.price > parseFloat(priceMax)) return null;
        if (!q) return { ...item, _score: 0 };
        const iName = (item.name || "").toLowerCase();
        const iDesc = (item.description || "").toLowerCase();
        const iCat = (item.category || "").toLowerCase();
        if (iName === q) return { ...item, _score: 100 };
        if (iName.startsWith(q)) return { ...item, _score: 80 };
        if (iName.includes(q)) return { ...item, _score: 60 };
        if (iCat.includes(q)) return { ...item, _score: 40 };
        if (iDesc.includes(q)) return { ...item, _score: 20 };
        return null;
      })
      .filter(Boolean)
      .sort((a, b) => b._score - a._score);
  }, [
    allMenuItems,
    isSearchActive,
    searchQuery,
    vegFilter,
    priceMin,
    priceMax,
  ]);

  // ── Scroll spy ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (isSearchActive || categories.length === 0) return;

    const ratioMap = new Map();
    const observers = [];

    categories.forEach((cat) => {
      const el = categoryRefs.current[cat];
      if (!el) return;

      const obs = new IntersectionObserver(
        ([entry]) => {
          ratioMap.set(
            cat,
            entry.isIntersecting ? entry.intersectionRatio : -1,
          );
          if (isScrollingToRef.current) return;

          // Pick the category with the highest intersection ratio
          let bestCat = null;
          let bestRatio = -Infinity;
          ratioMap.forEach((ratio, c) => {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              bestCat = c;
            }
          });
          if (bestCat) setActiveCategory(bestCat);
        },
        {
          // Top bias: bottom third of viewport acts as trigger exit zone
          rootMargin: "-10% 0px -55% 0px",
          threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0],
        },
      );

      obs.observe(el);
      observers.push(obs);
    });

    return () => observers.forEach((obs) => obs.disconnect());
  }, [categories, isSearchActive]);

  // ── Scroll to category section ────────────────────────────────────────────
  const scrollToCategory = useCallback((cat) => {
    setActiveCategory(cat);
    const el = categoryRefs.current[cat];
    if (!el) return;

    isScrollingToRef.current = true;
    const headerHeight = (headerRef.current?.offsetHeight ?? 100) + 16;
    const elementTop =
      el.getBoundingClientRect().top + window.scrollY - headerHeight;
    window.scrollTo({ top: Math.max(0, elementTop), behavior: "smooth" });

    setTimeout(() => {
      isScrollingToRef.current = false;
    }, 1000);
  }, []);

  const clearAllFilters = () => {
    setSearchQuery("");
    setVegFilter(null);
    setPriceMin("");
    setPriceMax("");
  };

  // ── Sync category slider scroll when activeCategory changes ──────────
  useEffect(() => {
    if (!activeCategory || isSearchActive) return;
    const el = sliderCategoryRefs.current[activeCategory];
    if (el) {
      el.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    }
  }, [activeCategory, isSearchActive]);

  // Sync activeCategory if categories change (e.g. first load)
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      // Use requestAnimationFrame or just let it be handled by user interaction
      // Actually, if we're on a new set of categories, we should set it.
      // To avoid the lint error, we could use a functional update but it doesn't really apply here.
      // Let's just wrap it in a microtask or check if it's really necessary.
      setTimeout(() => {
        setActiveCategory((prev) =>
          categories.includes(prev) ? prev : categories[0],
        );
      }, 0);
    }
  }, [categories, activeCategory]);

  return (
    <div
      className={`flex-1 flex flex-col ${count > 0 ? "pb-40 md:pb-16" : "pb-24 md:pb-10"}`}
      style={{
        backgroundColor: "color-mix(in srgb, var(--t-bg) 96%, black)",
      }}
    >
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div
        ref={headerRef}
        className="sticky top-[57px] z-20 border-b"
        style={{ background: "color-mix(in srgb, var(--t-bg) 96%, black)", borderColor: "var(--t-line)" }}
      >
        {/* Search bar */}
        <div className="px-4 md:px-6 pt-3 pb-2">
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--t-dim)" }}>
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder="Search dishes, ingredients…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl pl-10 pr-9 py-3 text-sm focus:outline-none transition-all"
              style={{
                background: "var(--t-float)",
                border: `1.5px solid ${searchQuery ? "var(--t-accent)" : "var(--t-line)"}`,
                color: "var(--t-text)",
                boxShadow: searchQuery ? "0 0 0 3px var(--t-accent-10)" : "none",
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold transition-colors hover:bg-white/10"
                style={{ color: "var(--t-dim)" }}
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Quick filter chips — always visible */}
        <div className="px-4 md:px-6 pb-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {/* Veg chips */}
          {[
            { label: "Veg", value: true, dot: "#22c55e" },
            { label: "Non-Veg", value: false, dot: "#ef4444" },
          ].map((opt) => {
            const active = vegFilter === opt.value;
            return (
              <button
                key={String(opt.value)}
                onClick={() => setVegFilter(active ? null : opt.value)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 shrink-0"
                style={
                  active
                    ? { background: `${opt.dot}22`, borderColor: opt.dot, color: opt.dot }
                    : { background: "var(--t-float)", borderColor: "var(--t-line)", color: "var(--t-dim)" }
                }
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: opt.dot, opacity: active ? 1 : 0.5 }} />
                {opt.label}
                {active && <span className="ml-0.5 opacity-70">✕</span>}
              </button>
            );
          })}

          {/* Divider */}
          <div className="w-px h-4 shrink-0" style={{ background: "var(--t-line)" }} />

          {/* Price chip / inline slider */}
          {showPriceFilter ? (
            <PriceRangeSlider
              allItems={allMenuItems}
              priceMin={priceMin}
              setPriceMin={setPriceMin}
              priceMax={priceMax}
              setPriceMax={setPriceMax}
              currencySymbol={currencySymbol}
              onClose={() => { setShowPriceFilter(false); setPriceMin(""); setPriceMax(""); }}
            />
          ) : (
            <button
              onClick={() => setShowPriceFilter(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-all duration-200 shrink-0"
              style={
                priceMin || priceMax
                  ? { background: "var(--t-accent-10)", borderColor: "var(--t-accent)", color: "var(--t-accent)" }
                  : { background: "var(--t-float)", borderColor: "var(--t-line)", color: "var(--t-dim)" }
              }
            >
              <span>₹</span>
              {priceMin && priceMax
                ? `${formatCurrency(priceMin, currencySymbol)} – ${formatCurrency(priceMax, currencySymbol)}`
                : priceMin
                  ? `From ${formatCurrency(priceMin, currencySymbol)}`
                  : priceMax
                    ? `Up to ${formatCurrency(priceMax, currencySymbol)}`
                    : "Price"}
            </button>
          )}

          {/* Clear all */}
          {activeFilterCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border shrink-0 transition-all"
              style={{ background: "var(--t-accent-10)", borderColor: "var(--t-accent-40)", color: "var(--t-accent)" }}
            >
              Clear all
              <span className="w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black" style={{ background: "var(--t-accent)", color: "var(--t-bg)" }}>
                {activeFilterCount}
              </span>
            </button>
          )}
        </div>

        {/* Category slider — always visible */}
        {!isSearchActive && (
          <div className="px-4 md:px-6 pb-3 flex gap-2 overflow-x-auto no-scrollbar">
            {categories.map((cat) => {
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  ref={(el) => { sliderCategoryRefs.current[cat] = el; }}
                  onClick={() => scrollToCategory(cat)}
                  className="relative px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0"
                  style={
                    active
                      ? {
                          background: "var(--t-accent)",
                          color: "#fff",
                          boxShadow: "0 4px 14px var(--t-accent-40)",
                        }
                      : {
                          background: "var(--t-float)",
                          color: "var(--t-dim)",
                          border: "1px solid var(--t-line)",
                        }
                  }
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="px-4 md:px-6 lg:px-8 py-4">
        {isSearchActive ? (
          /* Search results */
          filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
              <span className="text-4xl">🔍</span>
              <Text size="sm" color="muted">
                No items match your search
              </Text>
              <button
                onClick={clearAllFilters}
                className="text-xs font-semibold mt-1"
                style={{ color: "var(--t-accent)" }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <Text size="xs" color="muted" className="mb-3">
                {filteredItems.length} result
                {filteredItems.length !== 1 ? "s" : ""}
              </Text>
              {filteredItems.map((item) => (
                <MenuItemCard
                  key={item._id}
                  item={item}
                  currencySymbol={currencySymbol}
                />
              ))}
            </div>
          )
        ) : (
          /* Category sections */
          <div className="space-y-10">
            {categories.map((cat) => {
              const items = menu[cat] ?? [];
              if (!items.length) return null;
              return (
                <CategorySection
                  key={cat}
                  name={cat}
                  items={items}
                  currencySymbol={currencySymbol}
                  innerRef={(el) => {
                    categoryRefs.current[cat] = el;
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
