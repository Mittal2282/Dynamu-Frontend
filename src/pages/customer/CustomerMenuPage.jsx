import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import CartControl from "../../components/customer/CartControl";
import { VegBadge } from "../../components/ui/Badge";
import Text from "../../components/ui/Text";
import LazyImage from "../../components/ui/LazyImage";
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

// ── Level dots (spice / sugar indicator) ─────────────────────────────────────
function LevelDots({ level = 0, max = 5, color, icon }) {
  if (!level) return null;
  return (
    <div className="flex items-center gap-1">
      <span className="text-[10px] leading-none">{icon}</span>
      <div className="flex gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full transition-all"
            style={{
              background: i < level ? color : "var(--t-line)",
              opacity: i < level ? 1 : 0.35,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ── Menu item card ─────────────────────────────────────────────────────────────
function MenuItemCard({ item, currencySymbol }) {
  const hasDiscount = item.discount_percentage > 0;
  const discountedPrice = hasDiscount
    ? Math.round(item.price * (1 - item.discount_percentage / 100))
    : null;

  // Ingredients — support both array and comma-separated string
  const rawIngredients = item.ingredients;
  const ingredients = Array.isArray(rawIngredients)
    ? rawIngredients
    : typeof rawIngredients === "string" && rawIngredients.trim()
      ? rawIngredients
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  const spicyLevel =
    item.spicy_level != null && item.spicy_level > 0 ? item.spicy_level : null;
  const sugarLevel =
    item.sugar_level != null && item.sugar_level > 0 ? item.sugar_level : null;

  return (
    <div
      className="rounded-2xl overflow-hidden border transition-transform duration-150 active:scale-[0.99]"
      style={{ background: "var(--t-surface)", borderColor: "var(--t-line)" }}
    >
      <div className="p-3 flex gap-3">
        {/* ── Image ──────────────────────────────────────────────────────── */}
        <div className="relative shrink-0 self-start overflow-hidden rounded-xl">
          <LazyImage
            src={item.image_url}
            alt={item.name}
            containerClassName="w-[88px] h-[88px] rounded-xl overflow-hidden"
            imgClassName="w-full h-full object-cover"
            placeholder={
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "var(--t-float)" }}
              >
                <span className="text-3xl">{item.is_veg ? "🥗" : "🍗"}</span>
              </div>
            }
          />

          {/* Veg / Non-veg dot */}
          <div className="absolute top-1.5 left-1.5 p-[3px] rounded-sm bg-white/90 shadow-sm">
            <VegBadge isVeg={item.is_veg} size="sm" />
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────────── */}
        <div className="flex-1 min-w-0 flex flex-col">
          <h3
            className="font-bold text-sm leading-snug"
            style={{ color: "var(--t-text)" }}
          >
            {item.name}
          </h3>

          {item.description && (
            <p
              className="text-[11px] mt-0.5 leading-relaxed line-clamp-2"
              style={{ color: "var(--t-dim)" }}
            >
              {item.description}
            </p>
          )}

          {/* Spice + Sugar level dots */}
          {(spicyLevel !== null || sugarLevel !== null) && (
            <div className="flex gap-3 mt-1.5">
              {spicyLevel !== null && (
                <LevelDots
                  level={spicyLevel}
                  icon="🌶️"
                  color="var(--t-accent)"
                />
              )}
              {sugarLevel !== null && (
                <LevelDots
                  level={sugarLevel}
                  icon="🍬"
                  color="var(--t-accent2)"
                />
              )}
            </div>
          )}

          {/* Pricing + Cart control */}
          <div className="mt-auto pt-2 flex items-center justify-between gap-2">
            <div className="flex items-end gap-2 pr-3 mt-1.5 min-h-[32px]">
              <div
                className="font-black text-sm"
                style={{ color: "var(--t-accent)" }}
              >
                {formatCurrency(
                  discountedPrice ?? item.price_label ?? item.price,
                  currencySymbol,
                )}
              </div>
              {hasDiscount && (
                <div className="flex flex-col items-start gap-1">
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-md border uppercase leading-none tracking-tight"
                    style={{
                      background:
                        "color-mix(in srgb, var(--t-success) 12%, transparent)",
                      borderColor:
                        "color-mix(in srgb, var(--t-success) 20%, transparent)",
                      color: "var(--t-success)",
                    }}
                  >
                    {item.discount_percentage}% off
                  </span>
                  <span
                    className="text-[10px] line-through opacity-70 ml-1 leading-none"
                    style={{ color: "var(--t-dim)" }}
                  >
                    {formatCurrency(item.price, currencySymbol)}
                  </span>
                </div>
              )}
              <span
                className="text-[9px] mb-0.5"
                style={{ color: "var(--t-dim)" }}
              >
                incl. GST
              </span>
            </div>
            <div className="shrink-0">
              <CartControl item={item} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Ingredients carousel ──────────────────────────────────────────── */}
      {ingredients.length > 0 && (
        <div
          className="px-3 pb-2.5 pt-0 border-t -mt-0.5"
          style={{ borderColor: "var(--t-line)" }}
        >
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2">
            <span
              className="text-[9px] font-semibold uppercase tracking-wider shrink-0"
              style={{ color: "var(--t-dim)" }}
            >
              with
            </span>
            {ingredients.map((ing, i) => (
              <span
                key={i}
                className="shrink-0 text-[10px] px-2 py-0.5 rounded-full border font-medium whitespace-nowrap"
                style={{
                  borderColor: "var(--t-line)",
                  color: "var(--t-dim)",
                  background: "var(--t-float)",
                }}
              >
                {ing}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category section ───────────────────────────────────────────────────────────
function CategorySection({ name, items, currencySymbol, innerRef }) {
  return (
    <div ref={innerRef} className="scroll-mt-28">
      {/* Section header */}
      <div className="mb-4">
        <h2
          className="text-xl font-black uppercase tracking-tight"
          style={{ color: "var(--t-text)" }}
        >
          {name}
        </h2>
        <div
          className="mt-1.5 w-10 h-[3px] rounded-full"
          style={{ background: "var(--t-accent)" }}
        />
      </div>

      <div className="space-y-3">
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

// ── Filter button SVGs ─────────────────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg
      className="w-3.5 h-3.5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg
      className="w-4 h-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
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
  const [showFilters, setShowFilters] = useState(false);
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
    <div className={`flex-1 flex flex-col ${count > 0 ? "pb-40" : "pb-24"}`}>
      {/* ── Sticky header ─────────────────────────────────────────────────── */}
      <div
        ref={headerRef}
        className="sticky top-[72px] z-20"
        style={{ background: "var(--t-bg)" }}
      >
        {/* Search bar — slides up when scrolling down */}
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{
            maxHeight: "220px",
            opacity: 1,
          }}
        >
          <div className="px-4 pt-3 pb-2">
            {/* Input row */}
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--t-dim)" }}
                >
                  <SearchIcon />
                </span>
                <input
                  type="text"
                  placeholder="Search dishes, ingredients…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl pl-9 pr-8 py-2.5 text-sm focus:outline-none transition-colors"
                  style={{
                    background: "var(--t-float)",
                    border: `1px solid ${searchQuery ? "var(--t-accent-40)" : "var(--t-line)"}`,
                    color: "var(--t-text)",
                  }}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                    style={{ color: "var(--t-dim)" }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Filter toggle */}
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="relative shrink-0 p-2.5 rounded-xl border transition-all"
                style={
                  showFilters || activeFilterCount > 0
                    ? {
                        background: "var(--t-accent-10)",
                        borderColor: "var(--t-accent-40)",
                        color: "var(--t-accent)",
                      }
                    : {
                        background: "var(--t-float)",
                        borderColor: "var(--t-line)",
                        color: "var(--t-dim)",
                      }
                }
              >
                <FilterIcon />
                {activeFilterCount > 0 && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] flex items-center justify-center font-bold"
                    style={{ background: "var(--t-accent)" }}
                  >
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Filter panel */}
            {showFilters && (
              <div
                className="mt-2 p-3 rounded-xl border space-y-3"
                style={{
                  background: "var(--t-float)",
                  borderColor: "var(--t-line)",
                }}
              >
                {/* Diet */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider w-10 shrink-0"
                    style={{ color: "var(--t-dim)" }}
                  >
                    Diet
                  </span>
                  <div className="flex gap-1.5">
                    {[
                      { label: "All", value: null, icon: "🍽️" },
                      { label: "Veg", value: true, icon: "🟢" },
                      { label: "Non-Veg", value: false, icon: "🔴" },
                    ].map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() =>
                          setVegFilter(
                            vegFilter === opt.value ? null : opt.value,
                          )
                        }
                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all"
                        style={
                          vegFilter === opt.value
                            ? {
                                background: "var(--t-accent-20)",
                                borderColor: "var(--t-accent)",
                                color: "var(--t-accent)",
                              }
                            : {
                                background: "transparent",
                                borderColor: "var(--t-line)",
                                color: "var(--t-dim)",
                              }
                        }
                      >
                        {opt.icon} {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-semibold uppercase tracking-wider w-10 shrink-0"
                    style={{ color: "var(--t-dim)" }}
                  >
                    Price
                  </span>
                  <input
                    type="number"
                    placeholder="Min"
                    value={priceMin}
                    onChange={(e) => setPriceMin(e.target.value)}
                    className="w-16 rounded-lg px-2 py-1 text-xs focus:outline-none border"
                    style={{
                      background: "var(--t-surface)",
                      borderColor: "var(--t-line)",
                      color: "var(--t-text)",
                    }}
                  />
                  <span className="text-xs" style={{ color: "var(--t-dim)" }}>
                    –
                  </span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={priceMax}
                    onChange={(e) => setPriceMax(e.target.value)}
                    className="w-16 rounded-lg px-2 py-1 text-xs focus:outline-none border"
                    style={{
                      background: "var(--t-surface)",
                      borderColor: "var(--t-line)",
                      color: "var(--t-text)",
                    }}
                  />
                  {(priceMin || priceMax) && (
                    <button
                      onClick={() => {
                        setPriceMin("");
                        setPriceMax("");
                      }}
                      className="text-[11px] font-semibold"
                      style={{ color: "var(--t-accent)" }}
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Category slider — always visible in header */}
        {!isSearchActive && (
          <div
            className="px-4 py-2.5 border-b"
            style={{ borderColor: "var(--t-line)" }}
          >
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  ref={(el) => {
                    sliderCategoryRefs.current[cat] = el;
                  }}
                  onClick={() => scrollToCategory(cat)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200"
                  style={
                    activeCategory === cat
                      ? {
                          background: "var(--t-accent)",
                          color: "#fff",
                          boxShadow: "0 2px 10px var(--t-glow-20)",
                        }
                      : {
                          background: "var(--t-float)",
                          color: "var(--t-dim)",
                        }
                  }
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <div className="px-4 py-4">
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
