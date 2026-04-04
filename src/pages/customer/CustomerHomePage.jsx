import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import MenuItemCard from "../../components/customer/MenuItemCard";
import { useCartCount } from "../../store/cartStore";
import { authStore } from "../../store/authStore";
import { restaurantStore } from "../../store/restaurantStore";

// ── Skeletons ─────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-3 animate-pulse">
      <div className="w-full h-[88px] rounded-xl bg-white/10 mb-2" />
      <div className="h-2 bg-white/10 rounded w-1/2 mb-1.5" />
      <div className="h-3 bg-white/10 rounded w-full mb-1.5" />
      <div className="h-3 bg-white/10 rounded w-2/5 mb-2" />
      <div className="h-7 bg-white/10 rounded-lg w-full" />
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, badge, right }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        {icon && <span className="text-base leading-none">{icon}</span>}
        <p
          className="text-xs md:text-sm font-bold uppercase tracking-widest"
          style={{ color: "var(--t-dim)" }}
        >
          {title}
        </p>
        {badge && (
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded-full border"
            style={{
              color: "var(--t-accent)",
              borderColor: "var(--t-accent-40)",
              background: "var(--t-accent-20)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      {right}
    </div>
  );
}

// ── Hero section ──────────────────────────────────────────────────────────────

function HeroSection({ tagline, customerName }) {
  return (
    <div className="relative overflow-hidden px-4 md:px-6 lg:px-8 pt-6 pb-8 md:pb-10">
      {/* Background glow */}
      <div
        className="absolute -top-20 -left-20 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--t-accent-10) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, var(--t-accent2-10) 0%, transparent 70%)",
        }}
      />

      {/* Welcome text */}
      <div className="relative">
        <h1
          className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-black leading-none tracking-tight"
          style={{
            background:
              "linear-gradient(135deg, var(--t-accent) 0%, #ffb347 60%, var(--t-accent) 100%)",
            WebkitBackgroundClip: "text",
            backgroundClip: "text",
            WebkitTextFillColor: "transparent",
            filter: "drop-shadow(0 0 40px var(--t-accent-40))",
          }}
        >
          {customerName ? `Welcome, ${customerName}` : "Welcome"}
        </h1>
        {tagline && (
          <p
            className="mt-3 text-sm md:text-base lg:text-lg leading-relaxed max-w-2xl"
            style={{ color: "var(--t-dim)" }}
          >
            {tagline}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Action cards ──────────────────────────────────────────────────────────────

function ExploreMenuCard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 md:p-6 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden group"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--t-accent) 18%, var(--t-surface)) 0%, var(--t-surface) 100%)",
        border: "1px solid color-mix(in srgb, var(--t-accent) 25%, var(--t-line))",
      }}
    >
      {/* Decorative plate */}
      <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-[80px] md:text-[100px] opacity-[0.08] pointer-events-none select-none transition-transform group-hover:translate-x-2 group-hover:translate-y-2">
        🍽️
      </div>

      <div className="relative flex items-center gap-4">
        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl md:text-2xl"
          style={{
            background: "color-mix(in srgb, var(--t-accent) 20%, transparent)",
            border: "1px solid color-mix(in srgb, var(--t-accent) 30%, transparent)",
          }}
        >
          📖
        </div>
        <div className="flex-1 min-w-0">
          <p
            className="text-sm md:text-base font-black uppercase tracking-wide"
            style={{ color: "#ffffff" }}
          >
            Explore Menu
          </p>
          <p
            className="text-xs md:text-sm mt-0.5 leading-snug"
            style={{ color: "rgba(245,246,250,0.65)" }}
          >
            Browse curated selections &amp; seasonal signatures
          </p>
        </div>
        <span
          className="shrink-0 text-sm font-black transition-transform group-hover:translate-x-1"
          style={{ color: "var(--t-accent)" }}
        >
          →
        </span>
      </div>
    </button>
  );
}

function AskAICard({ onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl p-5 md:p-6 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden group"
      style={{
        background:
          "linear-gradient(135deg, color-mix(in srgb, var(--t-accent2) 12%, var(--t-surface)) 0%, var(--t-surface) 100%)",
        border: "1px solid color-mix(in srgb, var(--t-accent2) 20%, var(--t-line))",
      }}
    >
      {/* Animated sparkles */}
      <span
        className="absolute right-5 top-4 text-xl opacity-20 pointer-events-none select-none animate-pulse"
        style={{ color: "var(--t-accent2)", animationDuration: "2.5s" }}
      >
        ✦
      </span>
      <span
        className="absolute right-12 bottom-5 text-sm opacity-15 pointer-events-none select-none animate-pulse"
        style={{ color: "var(--t-accent2)", animationDuration: "3.5s" }}
      >
        ✦
      </span>

      <div className="relative flex items-center gap-4">
        <div
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center shrink-0 text-xl md:text-2xl"
          style={{
            background: "color-mix(in srgb, var(--t-accent2) 15%, transparent)",
            border: "1px solid color-mix(in srgb, var(--t-accent2) 25%, transparent)",
          }}
        >
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p
              className="text-sm md:text-base font-black uppercase tracking-wide text-white"
              style={{ color: "#ffffff" }}
            >
              AI Assistant
            </p>
            <span
              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--t-accent2) 15%, transparent)",
                color: "var(--t-accent2)",
                border: "1px solid color-mix(in srgb, var(--t-accent2) 25%, transparent)",
              }}
            >
              AI
            </span>
          </div>
          <p
            className="text-xs md:text-sm leading-snug"
            style={{ color: "rgba(245,246,250,0.65)" }}
          >
            Personalized pairings &amp; recommendations
          </p>
        </div>
        <span
          className="shrink-0 text-sm font-black transition-transform group-hover:translate-x-1"
          style={{ color: "var(--t-accent2)" }}
        >
          →
        </span>
      </div>
    </button>
  );
}

// ── Time-based section ────────────────────────────────────────────────────────

const MEAL_CONFIG = {
  breakfast: { icon: "🌅", label: "Breakfast", greeting: "Good Morning" },
  lunch: { icon: "☀️", label: "Lunch", greeting: "Lunchtime" },
  dinner: { icon: "🌙", label: "Dinner", greeting: "Good Evening" },
};

const INITIAL_VISIBLE = 6;

function getGridClasses(itemCount) {
  // If there are 2 or fewer items, don't use horizontal scroll on mobile
  if (itemCount <= 2) {
    return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3";
  }
  // Standard 2-row horizontal stack on mobile
  return "grid grid-rows-2 grid-flow-col auto-cols-[calc(100%_-_48px)] md:auto-cols-min overflow-x-auto no-scrollbar gap-x-4 gap-y-3 -mx-0 px-4 md:mx-0 md:px-0 md:grid-cols-2 lg:grid-cols-3 md:grid-rows-none md:grid-flow-row snap-x snap-mandatory items-start md:items-stretch";
}

function TimeBasedSection({ items, mealTime, loading, currencySymbol }) {
  const config = MEAL_CONFIG[mealTime] || MEAL_CONFIG.dinner;
  const [showAll, setShowAll] = useState(false);

  if (loading) {
    return (
      <div className="pt-6 pb-4 px-4 md:px-6 lg:px-8">
        <SectionHeader icon={config.icon} title={`${config.greeting} · ${config.label}`} />
        <div className={getGridClasses(4)}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;
  const hasMore = items.length > INITIAL_VISIBLE;

  return (
    <div className="pt-6 pb-4 px-4 md:px-6 lg:px-8">
      <SectionHeader
        icon={config.icon}
        title={`${config.greeting} · ${config.label}`}
        badge="Now Serving"
      />

      <div className={getGridClasses(items.length)}>
        {/* All items visible on mobile scroll; desktop respects showAll toggle */}
        {items.map((item, idx) => {
          const isHiddenOnDesktop = idx >= INITIAL_VISIBLE && !showAll;
          return (
            <div
              key={item._id}
              className={`w-full md:w-auto snap-start h-full ${isHiddenOnDesktop ? "md:hidden" : ""}`}
            >
              <MenuItemCard item={item} currencySymbol={currencySymbol} />
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="hidden md:block">
          <button
            type="button"
            onClick={() => setShowAll((v) => !v)}
            className="w-full mt-4 py-2.5 rounded-xl text-sm font-semibold border transition-all hover:bg-white/5 active:scale-[0.99] cursor-pointer"
            style={{ borderColor: "var(--t-line)", color: "var(--t-dim)" }}
          >
            {showAll ? "Show Less ↑" : `See All ${items.length} Items ↓`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Today's Specials ──────────────────────────────────────────────────────────

function TodaysSpecials({ items, loading, currencySymbol }) {
  const today = new Date();
  const dateLabel = `${String(today.getMonth() + 1).padStart(2, "0")} / ${String(today.getDate()).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="pt-6 pb-4 px-4 md:px-6 lg:px-8">
        <SectionHeader
          title="Today's Specials"
          right={
            <span className="text-xs font-semibold" style={{ color: "var(--t-dim)" }}>
              {dateLabel}
            </span>
          }
        />
        <div className={getGridClasses(4)}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="pt-6 pb-4 px-4 md:px-6 lg:px-8">
      <SectionHeader
        title="Today's Specials"
        right={
          <span className="text-xs font-semibold" style={{ color: "var(--t-dim)" }}>
            {dateLabel}
          </span>
        }
      />
      <div className={getGridClasses(items.length)}>
        {items.map((item) => (
          <div key={item._id} className="w-full md:w-auto snap-start h-full">
            <MenuItemCard item={item} currencySymbol={currencySymbol} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal strip (Chef's Special / Trending) ──────────────────────────────

function ItemsSection({ title, items, loading, currencySymbol }) {
  if (loading) {
    return (
      <div className="pt-6 pb-4 px-4 md:px-6 lg:px-8">
        <SectionHeader title={title} />
        <div className={getGridClasses(4)}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="pt-6 pb-4 px-4 md:px-6 lg:px-8">
      <SectionHeader title={title} />
      <div className={getGridClasses(items.length)}>
        {items.map((item) => (
          <div key={item._id} className="w-full md:w-auto snap-start h-full">
            <MenuItemCard item={item} currencySymbol={currencySymbol} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CustomerHomePage() {
  const {
    featuredItems,
    chefsSpecials,
    trendingItems,
    timeBasedItems,
    mealTime,
    sectionsLoading,
    basePath,
    onOpenAI,
  } = useOutletContext();
  const { tagline, currencySymbol } = restaurantStore();
  const { guestName } = authStore();
  const count = useCartCount();
  const navigate = useNavigate();

  return (
    <div
      className={`flex-1 ${count > 0 ? "pb-40 md:pb-16 lg:pb-12" : "pb-24 md:pb-16 lg:pb-12"}`}
      style={{ backgroundColor: "color-mix(in srgb, var(--t-bg) 96%, black)" }}
    >
      {/* Hero */}
      <HeroSection tagline={tagline} customerName={guestName} />

      {/* Action cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 px-4 md:px-6 lg:px-8 mb-2">
        <ExploreMenuCard onClick={() => navigate(`${basePath}/menu`)} />
        <AskAICard onClick={onOpenAI} />
      </div>

      {/* Time-based section (breakfast / lunch / dinner) with See More */}
      <TimeBasedSection
        items={timeBasedItems}
        mealTime={mealTime}
        loading={sectionsLoading}
        currencySymbol={currencySymbol}
      />

      {/* Today's Specials */}
      <TodaysSpecials
        items={featuredItems}
        loading={sectionsLoading}
        currencySymbol={currencySymbol}
      />

      {/* Chef's Special */}
      <ItemsSection
        title="Chef's Special"
        items={chefsSpecials}
        loading={sectionsLoading}
        currencySymbol={currencySymbol}
      />

      {/* Trending This Week */}
      <ItemsSection
        title="Trending This Week"
        items={trendingItems}
        loading={sectionsLoading}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
