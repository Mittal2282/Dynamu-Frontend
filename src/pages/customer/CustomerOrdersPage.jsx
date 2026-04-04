import { useCallback, useEffect, useState } from "react";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import LazyImage from "../../components/ui/LazyImage";
import { Spinner } from "../../components/ui/Spinner";
import { CUSTOMER_STATUS_PHASE, getOrderStatusConfig } from "../../constants/orderStatusConfig";
import { endCustomerSession, getCustomerOrders, requestBill } from "../../services/customerService";
import { disconnectSocket } from "../../services/socketService";
import { authStore } from "../../store/authStore";
import { cartStore } from "../../store/cartStore";
import { restaurantStore } from "../../store/restaurantStore";
import { formatCurrency } from "../../utils/formatters";

function dotToTextClass(dot) {
  return dot.replace(/^bg-/, "text-");
}

function IconLive({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <path d="M4.5 16.5c-1.5-1.26-2-5-2-7s.5-5.74 2-7M9 18c-.94-2.02-1-7-1-7s-.06-4.98 1-7M13.5 21c-1.1-2.16-1-8.5-1-8.5s-.1-6.34 1-8.5M18 16.5c1.5-1.26 2-5 2-7s-.5-5.74-2-7" />
    </svg>
  );
}

function IconHourglass({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M5 22h14" />
      <path d="M5 2h14" />
      <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
      <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
    </svg>
  );
}

function IconFlame({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
    </svg>
  );
}

function IconCheck({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function IconReceipt({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function StatusGlyph({ status, className }) {
  const tc = className || "w-4 h-4 shrink-0";
  if (status === "cancelled") {
    return (
      <span className={`${tc} text-red-400`} aria-hidden>
        ✕
      </span>
    );
  }
  if (["ready", "served", "completed"].includes(status)) {
    return <IconCheck className={tc} style={{ color: "inherit" }} />;
  }
  if (["confirmed", "preparing"].includes(status)) {
    return <IconFlame className={tc} style={{ color: "inherit" }} />;
  }
  return <IconHourglass className={tc} style={{ color: "inherit" }} />;
}

export default function CustomerOrdersPage() {
  const outlet = useOutletContext();
  const { orderVersion, basePath: baseFromOutlet } = outlet || {};
  const { qrCodeId, tableNumber } = useParams();
  const basePath =
    baseFromOutlet ||
    (qrCodeId != null && tableNumber != null ? `/${qrCodeId}/${tableNumber}` : "/");
  const navigate = useNavigate();
  const { currencySymbol } = restaurantStore();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [endingSession, setEndingSession] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      const data = await getCustomerOrders();
      setOrders(data);
    } catch {
      // keep list as-is
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 15000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  useEffect(() => {
    if (orderVersion > 0) fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderVersion]);

  const formatTime = (d) =>
    new Date(d).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const original = orders.find((o) => !o.is_addon);
  const addons = orders.filter((o) => o.is_addon);
  const grandTotal = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0);

  async function handleRequestBill() {
    if (endingSession) return;
    setEndingSession(true);
    try {
      try {
        await requestBill();
      } catch {
        await endCustomerSession();
      }
      authStore.getState().setSessionToken(null);
      cartStore.getState().clear();
      disconnectSocket();
      navigate("/login", {
        replace: true,
        state: { message: "Thanks for dining with us!" },
      });
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Could not request bill. Try again or ask staff.";
      alert(msg);
    } finally {
      setEndingSession(false);
    }
  }

  if (loading) {
    return (
      <div
        className="flex justify-center py-20 h-full"
        style={{
          backgroundColor: "color-mix(in srgb, var(--t-bg) 96%, black)",
        }}
      >
        <Spinner size="md" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div
        className="min-h-[60vh] px-5 md:px-8 py-16 flex flex-col items-center text-center gap-6"
        style={{
          backgroundColor: "color-mix(in srgb, var(--t-bg) 96%, black)",
        }}
      >
        <span className="text-6xl md:text-7xl" aria-hidden>
          🍽️
        </span>
        <div className="space-y-3 max-w-sm">
          <p
            className="text-xl md:text-2xl font-bold text-white tracking-wide uppercase"
            style={{ color: "#ffffff" }}
          >
            No orders yet
          </p>
          <p
            className="text-sm md:text-base leading-relaxed"
            style={{ color: "var(--t-nav-muted)" }}
          >
            Browse the menu and send your first order to the kitchen.
          </p>
        </div>
        <Button
          onClick={() => navigate(`${basePath}/menu`)}
          className="mt-2 px-10 py-4 font-bold uppercase text-sm md:text-base tracking-wider text-white transition-opacity active:opacity-90"
          style={{ backgroundColor: "var(--t-accent)" }}
        >
          Open menu
        </Button>
        <p className="text-xs md:text-sm pt-2" style={{ color: "var(--t-nav-muted)" }}>
          Status updates automatically every 15s
        </p>
      </div>
    );
  }

  function OrderBatch({ order, batchIndex }) {
    const cfg = getOrderStatusConfig(order.status);
    const phase = CUSTOMER_STATUS_PHASE[order.status] ?? cfg.label;
    const metaKicker = `${batchIndex} / ${phase.toUpperCase()}`;

    const showEst =
      order.estimated_prep_time &&
      !["ready", "served", "completed", "cancelled"].includes(order.status);

    const statusTone = dotToTextClass(cfg.dot);

    return (
      <article
        className="relative rounded-2xl overflow-hidden border border-white/[0.06]"
        style={{
          backgroundColor: "color-mix(in srgb, var(--t-bg) 88%, white 4%)",
        }}
      >
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.stripeSolid}`} aria-hidden />

        <div className="pl-5 pr-4 py-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p
              className="text-[10px] font-bold uppercase tracking-[0.1em] leading-relaxed max-w-[70%]"
              style={{ color: "var(--t-nav-muted)" }}
            >
              <span className={statusTone}>{metaKicker}</span>
              {" · "}#{order.order_number}
              {" · "}
              {formatTime(order.createdAt)}
            </p>
            <span
              className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md shrink-0 ${cfg.badge}`}
            >
              {cfg.label}
            </span>
          </div>

          <ul className="space-y-4">
            {order.items?.map((item, i) => {
              const note = item.instruction ?? item.note ?? item.notes ?? "";
              const imageUrl = item.image_url ?? item.menu_item?.image_url;
              return (
                <li key={i} className="border-b border-white/[0.06] last:border-0 last:pb-0 pb-4">
                  <div className="flex gap-3 items-start">
                    <LazyImage
                      src={imageUrl}
                      alt={item.name}
                      containerClassName="w-12 h-12 rounded-xl overflow-hidden border border-white/10 bg-white/5 shrink-0 flex items-center justify-center"
                      placeholder={
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: "var(--t-float)" }}
                        >
                          <span className="text-xl">
                            {(item.is_veg ?? item.menu_item?.is_veg) ? "🥗" : "🍗"}
                          </span>
                        </div>
                      }
                    />

                    <div className="flex justify-between gap-4 items-start flex-1">
                      <div className="flex-1 min-w-0">
                        <p
                          className="text-[14px] md:text-base font-bold uppercase tracking-wide leading-snug"
                          style={{ color: "#ffffff" }}
                        >
                          {item.name}
                        </p>
                        {item.unit_price != null && (
                          <p
                            className="text-[11px] mt-0.5 tabular-nums"
                            style={{ color: "var(--t-nav-muted)" }}
                          >
                            {item.quantity ?? 1} × {formatCurrency(item.unit_price, currencySymbol)}{" "}
                            ={" "}
                            <span className="font-bold" style={{ color: "var(--t-accent)" }}>
                              {formatCurrency(
                                (item.quantity ?? 1) * item.unit_price,
                                currencySymbol,
                              )}
                            </span>
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded border border-white/20 text-slate-300 shrink-0">
                        QTY: {item.quantity ?? 1}
                      </span>
                    </div>
                  </div>
                  {note ? (
                    <p
                      className="text-[12px] mt-2 leading-relaxed italic"
                      style={{ color: "var(--t-nav-muted)" }}
                    >
                      {note}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>

          <div className="flex items-center justify-between pt-1 gap-3 border-t border-white/[0.06]">
            <div className={`flex items-center gap-2.5 min-w-0 ${statusTone}`}>
              <StatusGlyph status={order.status} className="w-4 h-4 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wide truncate">
                {phase}
              </span>
            </div>
            <span className="text-base font-bold text-white tabular-nums shrink-0">
              {formatCurrency(order.total_amount || 0, currencySymbol)}
            </span>
          </div>

          {showEst ? (
            <p className="text-[11px] text-blue-400 flex items-center gap-1.5">
              <span aria-hidden>⏱</span>
              Est. ~{order.estimated_prep_time} min
            </p>
          ) : null}
        </div>
      </article>
    );
  }

  /* ── Shared bill panel content ───────────────────────────────────────── */
  const billPanelContent = (
    <>
      <div>
        <p
          className="text-xs font-semibold uppercase tracking-[0.14em]"
          style={{ color: "var(--t-nav-muted)" }}
        >
          Current session total
        </p>
        <p
          className="text-2xl md:text-3xl font-black tabular-nums mt-1"
          style={{ color: "var(--t-accent)" }}
        >
          {formatCurrency(grandTotal, currencySymbol)}
        </p>
        <p className="text-xs mt-1" style={{ color: "var(--t-nav-muted)" }}>
          + Service tax included
        </p>
      </div>

      <div className="flex flex-row gap-3">
        <Button
          variant="secondary"
          onClick={() => navigate(`${basePath}/menu`)}
          className="flex-1 py-3.5 !rounded-xl text-sm font-bold uppercase tracking-wider transition-opacity active:opacity-90"
          style={{
            backgroundColor: "transparent",
            color: "white",
            border: "2px solid color-mix(in srgb, white 35%, var(--t-bg))",
          }}
        >
          + Order more
        </Button>
        <Button
          loading={endingSession}
          onClick={handleRequestBill}
          className="flex-1 py-3.5 !rounded-xl text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-opacity active:opacity-90"
          style={{
            backgroundColor: "var(--t-accent)",
            color: "var(--t-bg)",
          }}
        >
          <IconReceipt className="w-4 h-4" />
          {endingSession ? "Please wait…" : "Request final bill"}
        </Button>
      </div>
    </>
  );

  return (
    <div
      className="px-5 md:px-6 lg:px-8 pt-6 pb-[22rem] md:pb-[16rem] lg:pb-10"
      style={{
        backgroundColor: "color-mix(in srgb, var(--t-bg) 96%, black)",
      }}
    >
      {/* ── Desktop two-column layout ──────────────────────────────────────── */}
      <div className="lg:flex lg:gap-10 lg:items-start">
        {/* Left: header + order cards */}
        <div className="flex-1 space-y-8">
          <div className="flex flex-row items-center justify-between gap-4">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight leading-[1.1]">
              <span className="text-white">Current </span>
              <span style={{ color: "var(--t-accent)" }}>Orders</span>
            </h1>

            <div className="inline-flex items-center gap-2 self-start px-3.5 py-2 rounded-full text-xs font-bold uppercase tracking-[0.15em] text-green-400 bg-green-500/15 border border-green-500/30">
              <IconLive className="w-3.5 h-3.5" />
              Live status
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {original ? <OrderBatch order={original} batchIndex={1} /> : null}
            {addons.map((addon, idx) => (
              <OrderBatch key={addon._id} order={addon} batchIndex={original ? idx + 2 : idx + 1} />
            ))}
          </div>

          <p className="text-center text-xs pt-2" style={{ color: "var(--t-nav-muted)" }}>
            Status updates automatically every 15s
          </p>
        </div>

        {/* Right: sticky bill card — desktop only */}
        <div className="hidden lg:block w-80 xl:w-96 shrink-0">
          <div
            className="sticky top-20 rounded-2xl border border-white/[0.08] shadow-2xl p-6 space-y-5"
            style={{
              backgroundColor: "color-mix(in srgb, var(--t-bg) 92%, black)",
              borderTop: "2px solid var(--t-accent)",
              boxShadow: "0 0 24px var(--t-accent2-20)",
            }}
          >
            <p
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: "var(--t-accent)" }}
            >
              Bill Summary
            </p>
            {billPanelContent}
          </div>
        </div>
      </div>

      {/* ── Mobile/tablet: fixed bottom bill panel ─────────────────────────── */}
      <div className="lg:hidden fixed left-0 right-0 z-40 flex justify-center pointer-events-none bottom-[72px] md-bottom-5 mb-3">
        <div
          className="w-full md:max-w-3xl rounded-2xl border-t border-white/[0.08] shadow-2xl p-5 space-y-4 pointer-events-auto"
          style={{
            backgroundColor: "color-mix(in srgb, var(--t-bg) 92%, black)",
            borderTop: "2px solid var(--t-accent)",
            boxShadow: "0 0 24px var(--t-accent2-20)",
          }}
        >
          {billPanelContent}
        </div>
      </div>
    </div>
  );
}
