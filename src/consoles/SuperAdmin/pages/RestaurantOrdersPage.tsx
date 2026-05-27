import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button, DatePicker, Select, Spin, Table, Tag } from "antd";
import type { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { getRestaurantOrders } from "../../../services/superAdminService";
import { apiCaller } from "../../../api/apiCaller";
import type { Order } from "../../../types/order";

const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  pending: { color: "#eab308", bg: "rgba(234,179,8,0.15)" },
  confirmed: { color: "#3b82f6", bg: "rgba(59,130,246,0.15)" },
  preparing: { color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  ready: { color: "#22c55e", bg: "rgba(34,197,94,0.15)" },
  served: { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  completed: { color: "#94a3b8", bg: "rgba(148,163,184,0.15)" },
  cancelled: { color: "#ef4444", bg: "rgba(239,68,68,0.15)" },
};

const ALL_STATUSES = [
  "pending", "confirmed", "preparing", "ready", "served", "completed", "cancelled",
];

interface RestaurantInfo {
  name?: string;
  slug?: string;
}

function timeAgo(date: string | Date): string {
  const diff = (Date.now() - new Date(date).getTime()) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return new Date(date).toLocaleDateString();
}

export default function RestaurantOrdersPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [prevId, setPrevId] = useState(id);
  if (id !== prevId) {
    setPrevId(id);
    setLoading(true);
  }

  const handleFilterChange = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T) => {
    setLoading(true);
    setter(value);
  };

  useEffect(() => {
    apiCaller<{ data?: { restaurant?: RestaurantInfo } }>({
      method: "GET",
      endpoint: `/api/superadmin/restaurants/${id}`,
      useAdmin: true,
    })
      .then((data) => setRestaurant(data?.data?.restaurant ?? null))
      .catch(console.error);
  }, [id]);

  useEffect(() => {
    getRestaurantOrders(id!)
      .then((data) => setOrders(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id, statusFilter, dateFrom, dateTo]);

  const isFiltering = statusFilter || dateFrom || dateTo;

  const columns: ColumnsType<Order> = [
    {
      title: "Order #",
      dataIndex: "order_number",
      key: "order_number",
      render: (val) => <span className="font-mono text-xs" style={{ color: "var(--t-dim)" }}>{val}</span>,
    },
    {
      title: "Table",
      key: "table",
      render: (_, o) =>
        `Table ${(typeof o.table === "object" ? o.table?.table_number : undefined) ?? o.table_number ?? "—"}`,
    },
    {
      title: "Items",
      key: "items",
      render: (_, o) => (
        <span className="text-xs truncate block max-w-[200px]">
          {o.items?.map((i) => `${i.name} ×${i.quantity}`).join(", ") || "—"}
        </span>
      ),
    },
    {
      title: "Total",
      dataIndex: "total_amount",
      key: "total",
      align: "right",
      render: (val) => (
        <span className="font-semibold" style={{ color: "var(--t-accent)" }}>
          ₹{Math.round(val || 0)}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (val) => (
        <Tag
          style={{
            color: STATUS_COLOR[val]?.color ?? "#94a3b8",
            background: STATUS_COLOR[val]?.bg ?? "rgba(148,163,184,0.15)",
            borderColor: "transparent",
            fontWeight: 600,
            borderRadius: 9999,
          }}
        >
          {val}
        </Tag>
      ),
    },
    {
      title: "Time",
      dataIndex: "createdAt",
      key: "time",
      align: "right",
      render: (val) => (
        <span className="text-xs whitespace-nowrap">{val ? timeAgo(val) : "—"}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <Button
          type="text"
          size="small"
          onClick={() => navigate("/superadmin")}
          className="shrink-0 mt-0.5"
        >
          ← Back
        </Button>
        <div>
          <h1
            className="text-2xl font-bold"
            style={
              {
                background: "linear-gradient(90deg, #fff 30%, #94a3b8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              } as React.CSSProperties
            }
          >
            {restaurant?.name || "Restaurant"} — Orders
          </h1>
          {restaurant?.slug && (
            <p className="text-slate-300 text-sm mt-0.5 font-mono">/{restaurant.slug}</p>
          )}
        </div>
      </div>

      {/* ── Filters ────────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 uppercase tracking-wider block">Status</label>
          <Select
            value={statusFilter || undefined}
            placeholder="All Statuses"
            onChange={(val) => handleFilterChange(setStatusFilter, val ?? "")}
            size="small"
            style={{ minWidth: 140 }}
            allowClear
            onClear={() => { setLoading(true); setStatusFilter(""); }}
          >
            {ALL_STATUSES.map((s) => (
              <Select.Option key={s} value={s}>{s}</Select.Option>
            ))}
          </Select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] text-slate-300 uppercase tracking-wider block">Date Range</label>
          <DatePicker.RangePicker
            value={dateFrom && dateTo ? [dayjs(dateFrom), dayjs(dateTo)] : null}
            maxDate={dayjs()}
            size="small"
            onChange={(dates) => {
              if (dates?.[0] && dates?.[1]) {
                setLoading(true);
                setDateFrom(dates[0].format("YYYY-MM-DD"));
                setDateTo(dates[1].format("YYYY-MM-DD"));
              } else {
                setLoading(true);
                setDateFrom("");
                setDateTo("");
              }
            }}
          />
        </div>

        {isFiltering && (
          <button
            onClick={() => {
              setLoading(true);
              setStatusFilter("");
              setDateFrom("");
              setDateTo("");
            }}
            className="text-xs text-slate-400 hover:text-white transition-colors pb-2"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* ── Orders table ───────────────────────────────────────────────────── */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Orders</p>
          {!loading && <span className="text-xs text-slate-300">{orders.length} total</span>}
        </div>

        <Table
          columns={columns}
          dataSource={orders}
          rowKey="_id"
          loading={loading ? { indicator: <Spin /> } : false}
          size="small"
          pagination={false}
          locale={{
            emptyText: (
              <div className="py-16 text-center">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-slate-300 text-sm">No orders found.</p>
              </div>
            ),
          }}
          className="overflow-x-auto"
        />
      </div>
    </div>
  );
}
