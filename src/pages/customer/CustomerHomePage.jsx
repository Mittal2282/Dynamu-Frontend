import { useNavigate, useOutletContext } from "react-router-dom";
import CartControl from "../../components/customer/CartControl";
import LazyImage from "../../components/ui/LazyImage";
import { restaurantStore } from "../../store/restaurantStore";
import { formatCurrency } from "../../utils/formatters";
import { useCartCount } from "../../store/cartStore";

// ── Skeleton primitives ──────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl animate-pulse">
      <div className="w-14 h-14 rounded-lg bg-white/10 shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-2 bg-white/10 rounded w-1/3" />
        <div className="h-3 bg-white/10 rounded w-3/4" />
        <div className="h-2 bg-white/10 rounded w-1/2" />
      </div>
      <div className="w-16 h-8 rounded-lg bg-white/10 shrink-0" />
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="w-36 shrink-0 bg-white/5 border border-white/10 rounded-2xl p-3 animate-pulse">
      <div className="w-full h-20 rounded-xl bg-white/10 mb-2" />
      <div className="h-2 bg-white/10 rounded w-1/2 mb-1.5" />
      <div className="h-3 bg-white/10 rounded w-full mb-1.5" />
      <div className="h-3 bg-white/10 rounded w-2/5 mb-2" />
      <div className="h-7 bg-white/10 rounded-lg w-full" />
    </div>
  );
}

// ── Session badge ────────────────────────────────────────────────────────────

function SessionBadge({ tableNumber }) {
  return (
    <div className="px-4 pt-5 pb-1 flex items-center gap-2">
      <span
        className="w-2 h-2 rounded-full animate-pulse shrink-0"
        style={{ background: "var(--t-accent2)" }}
      />
      <span
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: "var(--t-accent2)" }}
      >
        Session Active&nbsp;&bull;&nbsp;Table {tableNumber}
      </span>
    </div>
  );
}

// ── Hero section ─────────────────────────────────────────────────────────────

function HeroSection({ name, tagline }) {
  return (
    <div className="px-4 pt-3 pb-5">
      <p
        className="text-2xl font-light"
        style={{ color: "var(--t-dim)" }}
      >
        Welcome to
      </p>
      <h1
        className="text-4xl font-black leading-tight"
        style={{ color: "var(--t-accent)" }}
      >
        {name || "Dynamu"}
      </h1>
      {tagline && (
        <p
          className="mt-2 text-sm leading-relaxed"
          style={{ color: "var(--t-dim)" }}
        >
          {tagline}
        </p>
      )}
    </div>
  );
}

// ── Action cards (Explore Menu / Ask AI) ─────────────────────────────────────

function ExploreMenuCard({ onClick }) {
  return (
    <div
      className="mx-4 rounded-2xl p-5 border border-white/10 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden"
      style={{ background: "var(--t-surface)" }}
      onClick={onClick}
    >
      {/* Background icon decoration */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-10 text-6xl pointer-events-none select-none">
        🍽️
      </div>
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
          style={{ background: "var(--t-accent-20)" }}
        >
          📖
        </div>
        <div className="flex-1">
          <p className="text-sm font-black uppercase tracking-wider text-white">
            Explore the Menu
          </p>
          <p
            className="text-xs mt-1 leading-relaxed"
            style={{ color: "var(--t-dim)" }}
          >
            Browse our curated selections and seasonal signatures.
          </p>
          <p
            className="text-xs font-bold mt-3"
            style={{ color: "var(--t-accent)" }}
          >
            View Now →
          </p>
        </div>
      </div>
    </div>
  );
}

function AskAICard({ onClick }) {
  return (
    <div
      className="mx-4 rounded-2xl p-5 border border-white/10 cursor-pointer active:scale-[0.98] transition-transform relative overflow-hidden"
      style={{ background: "var(--t-surface)" }}
      onClick={onClick}
    >
      {/* Sparkle decorations */}
      <div
        className="absolute right-5 top-4 text-2xl opacity-15 pointer-events-none select-none"
        style={{ color: "var(--t-accent2)" }}
      >
        ✦
      </div>
      <div
        className="absolute right-10 bottom-4 text-base opacity-10 pointer-events-none select-none"
        style={{ color: "var(--t-accent2)" }}
      >
        ✦
      </div>
      <div className="flex items-start gap-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
          style={{ background: "var(--t-accent2-20)" }}
        >
          🤖
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="text-sm font-black uppercase tracking-wider text-white">
              AI Assistant
            </p>
            <span
              className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
              style={{
                background: "var(--t-accent2-20)",
                color: "var(--t-accent2)",
                border: "1px solid var(--t-accent2-40)",
              }}
            >
              AI Driven
            </span>
          </div>
          <p
            className="text-xs mt-1 leading-relaxed"
            style={{ color: "var(--t-dim)" }}
          >
            Personalized pairings &amp; requests
          </p>
          {/* Progress bar animation */}
          <div
            className="mt-3 h-0.5 rounded-full overflow-hidden"
            style={{ background: "var(--t-float)" }}
          >
            <div
              className="h-full rounded-full animate-pulse"
              style={{ background: "var(--t-accent)", width: "55%" }}
            />
          </div>
        </div>
        w
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────

function SectionHeader({ title, right }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <p
        className="text-[11px] font-bold uppercase tracking-widest"
        style={{ color: "var(--t-dim)" }}
      >
        {title}
      </p>
      {right && (
        <p
          className="text-[11px] font-semibold"
          style={{ color: "var(--t-dim)" }}
        >
          {right}
        </p>
      )}
    </div>
  );
}

// ── Price display (shared) ────────────────────────────────────────────────────

function PriceDisplay({ price, discountPercentage, currencySymbol }) {
  if (discountPercentage > 0) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className="line-through text-[10px]"
          style={{ color: "var(--t-dim)" }}
        >
          {formatCurrency(price, currencySymbol)}
        </span>
        <span
          className="font-bold text-sm"
          style={{ color: "var(--t-accent)" }}
        >
          {formatCurrency(
            price * (1 - discountPercentage / 100),
            currencySymbol,
          )}
        </span>
        <span className="text-[9px] font-semibold bg-green-500/15 text-green-400 border border-green-500/20 px-1 py-0.5 rounded-full">
          {discountPercentage}%
        </span>
      </div>
    );
  }
  return (
    <span
      className="font-bold text-sm"
      style={{ color: "var(--t-accent)" }}
    >
      {formatCurrency(price, currencySymbol)}
    </span>
  );
}

// ── Time-based menu section ───────────────────────────────────────────────────

const MEAL_CONFIG = {
  breakfast: { icon: '🌅', label: 'Breakfast', greeting: 'Good Morning' },
  lunch:     { icon: '☀️', label: 'Lunch',     greeting: 'Lunchtime'    },
  dinner:    { icon: '🌙', label: 'Dinner',    greeting: 'Good Evening' },
};

function TimeBasedSection({ items, mealTime, loading, currencySymbol }) {
  const config = MEAL_CONFIG[mealTime] || MEAL_CONFIG.dinner;

  if (loading) {
    return (
      <div className="pt-5 pb-1">
        <div className="px-4 mb-3">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded bg-white/10 animate-pulse" />
            <div className="h-3 rounded bg-white/10 animate-pulse w-28" />
            <div className="h-3 rounded bg-white/10 animate-pulse w-16 ml-auto" />
          </div>
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto pb-2 no-scrollbar">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="pt-5 pb-1">
      <div className="px-4 mb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{config.icon}</span>
            <p
              className="text-[11px] font-bold uppercase tracking-widest"
              style={{ color: 'var(--t-dim)' }}
            >
              {config.greeting} · {config.label}
            </p>
          </div>
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
            style={{
              color:            'var(--t-accent)',
              borderColor:      'var(--t-accent-40)',
              background:       'var(--t-accent-20)',
            }}
          >
            Now Serving
          </span>
        </div>
      </div>

      <div className="flex gap-3 px-4 overflow-x-auto pb-2 no-scrollbar">
        {items.map((item) => (
          <div
            key={item._id}
            className="w-36 shrink-0 border border-white/10 rounded-2xl p-3 flex flex-col gap-2"
            style={{ background: 'var(--t-surface)' }}
          >
            <LazyImage
              src={item.image_url}
              alt={item.name}
              containerClassName="w-full h-20 rounded-xl overflow-hidden border border-white/10 bg-white/5"
              placeholder={
                <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-slate-400 px-1 text-center">
                    No image
                  </span>
                </div>
              }
            />
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: item.is_veg ? '#22c55e' : '#ef4444' }}
              />
              <span
                className="text-[10px] truncate"
                style={{ color: 'var(--t-dim)' }}
              >
                {item.category}
              </span>
            </div>
            <p className="text-sm font-semibold text-white line-clamp-2 leading-snug flex-1">
              {item.name}
            </p>
            <PriceDisplay
              price={item.price}
              discountPercentage={item.discount_percentage}
              currencySymbol={currencySymbol}
            />
            <div className="flex justify-center">
              <CartControl item={item} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Today's Specials (vertical list, cart-item style) ────────────────────────

function TodaysSpecials({ items, loading, currencySymbol }) {
  const today = new Date();
  const dateLabel = `${String(today.getMonth() + 1).padStart(2, "0")} / ${String(today.getDate()).padStart(2, "0")}`;

  if (loading) {
    return (
      <div className="px-4 pt-5 pb-1">
        <SectionHeader title="Today's Specials" right={dateLabel} />
        <div className="flex flex-col gap-2">
          <SkeletonRow />
          <SkeletonRow />
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="px-4 pt-5 pb-1">
      <SectionHeader title="Today's Specials" right={dateLabel} />
      <div className="flex flex-col gap-2">
        {items.map((item) => (
          <div
            key={item._id}
            className="flex items-center gap-3 p-3 rounded-xl border border-white/10"
            style={{ background: "var(--t-surface)" }}
          >
            <LazyImage
              src={item.image_url}
              alt={item.name}
              containerClassName="w-14 h-14 rounded-lg overflow-hidden border border-white/10 bg-white/5 shrink-0"
              placeholder={
                <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                  <span className="text-[9px] text-slate-500 text-center px-1">
                    No image
                  </span>
                </div>
              }
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: item.is_veg ? "#22c55e" : "#ef4444" }}
                />
                <span
                  className="text-[10px] font-semibold uppercase truncate"
                  style={{ color: "var(--t-dim)" }}
                >
                  {item.category}
                </span>
              </div>
              <p className="text-sm font-semibold text-white truncate">
                {item.name}
              </p>
              {item.description && (
                <p
                  className="text-xs line-clamp-1 mt-0.5"
                  style={{ color: "var(--t-dim)" }}
                >
                  {item.description}
                </p>
              )}
              <div className="mt-1">
                <PriceDisplay
                  price={item.price}
                  discountPercentage={item.discount_percentage}
                  currencySymbol={currencySymbol}
                />
              </div>
            </div>
            <div className="shrink-0">
              <CartControl item={item} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Horizontal card strip (Chef's Special / Trending) ────────────────────────

function HorizontalStrip({ title, items, loading, currencySymbol }) {
  if (loading) {
    return (
      <div className="pt-5 pb-1">
        <div className="px-4">
          <SectionHeader title={title} />
        </div>
        <div className="flex gap-3 px-4 overflow-x-auto pb-2 no-scrollbar">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (!items || items.length === 0) return null;

  return (
    <div className="pt-5 pb-1">
      <div className="px-4">
        <SectionHeader title={title} />
      </div>
      <div className="flex gap-3 px-4 overflow-x-auto pb-2 no-scrollbar">
        {items.map((item) => (
          <div
            key={item._id}
            className="w-36 shrink-0 border border-white/10 rounded-2xl p-3 flex flex-col gap-2"
            style={{ background: "var(--t-surface)" }}
          >
            <LazyImage
              src={item.image_url}
              alt={item.name}
              containerClassName="w-full h-20 rounded-xl overflow-hidden border border-white/10 bg-white/5"
              placeholder={
                <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
                  <span className="text-[10px] font-semibold text-slate-400 px-1 text-center">
                    No image
                  </span>
                </div>
              }
            />
            <div className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: item.is_veg ? "#22c55e" : "#ef4444" }}
              />
              <span
                className="text-[10px] truncate"
                style={{ color: "var(--t-dim)" }}
              >
                {item.category}
              </span>
            </div>
            <p className="text-sm font-semibold text-white line-clamp-2 leading-snug flex-1">
              {item.name}
            </p>
            <PriceDisplay
              price={item.price}
              discountPercentage={item.discount_percentage}
              currencySymbol={currencySymbol}
            />
            <div className="flex justify-center">
              <CartControl item={item} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

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
  const { name, tagline, tableNumber, currencySymbol } = restaurantStore();
  const count = useCartCount();
  const navigate = useNavigate();

  return (
    <div
      className={`flex-1 ${count > 0 ? "pb-40" : "pb-24"}`}
      style={{
        backgroundColor:
          "color-mix(in srgb, var(--t-bg) 96%, black)",
      }}
    >
      {/* Session badge */}
      <SessionBadge tableNumber={tableNumber} />

      {/* Hero */}
      <HeroSection name={name} tagline={tagline} />

      {/* Action cards */}
      <div className="flex flex-col gap-3 mb-1">
        <ExploreMenuCard onClick={() => navigate(`${basePath}/menu`)} />
        <AskAICard onClick={onOpenAI} />
      </div>

      {/* Time-based menu (breakfast / lunch / dinner) */}
      <TimeBasedSection
        items={timeBasedItems}
        mealTime={mealTime}
        loading={sectionsLoading}
        currencySymbol={currencySymbol}
      />

      {/* Today's Specials (featured items, cart-item style) */}
      <TodaysSpecials
        items={featuredItems}
        loading={sectionsLoading}
        currencySymbol={currencySymbol}
      />

      {/* Chef's Special */}
      <HorizontalStrip
        title="Chef's Special"
        items={chefsSpecials}
        loading={sectionsLoading}
        currencySymbol={currencySymbol}
      />

      {/* Trending This Week */}
      <HorizontalStrip
        title="Trending This Week"
        items={trendingItems}
        loading={sectionsLoading}
        currencySymbol={currencySymbol}
      />
    </div>
  );
}
