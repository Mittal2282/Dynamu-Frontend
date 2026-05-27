import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { Alert, Button, Input, Switch, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import {
  createRestaurant,
  importMenu,
  updateSAPetpoojaConfig,
} from "../../../services/superAdminService";
import { authStore } from "../../../store/authStore";

const STEPS = ["Restaurant Details", "Import Menu", "Petpooja POS", "Done"];

const CSV_SAMPLE = `Category,Item Name,Price (₹),Details,Taste Profile,Taste Level (1-5),Key Ingredients,Allergens / Choosy Items,GST Slab (%),Avg Prep Time (min),Meal Tag,Avg Rating (Future),Veg / Non-Veg,Image Reference URL
Starters,Paneer Tikka,299,Marinated cottage cheese grilled in tandoor,Savory,2,"Paneer, Tandoori masala",Dairy,5,10,Popular,4.5,Veg,https://en.wikipedia.org/wiki/Paneer
Starters,Chicken Wings,349,Crispy fried wings with hot sauce,Spicy,3,"Chicken, Hot sauce","None/NA",18,12,Spicy,,Non-Veg,https://en.wikipedia.org/wiki/Chicken_wing`;

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface FloorData {
  floor_number: number;
  floor_name: string;
  table_count: string;
  start_number: string;
}

interface OnboardForm {
  name: string;
  slug: string;
  description: string;
  phone: string;
  email: string;
  opening_hours: string;
  city: string;
  state: string;
  owner_name: string;
  owner_email: string;
  owner_password: string;
  floor_count: string;
  table_count: string;
  start_number: string;
  floors: FloorData[];
}

interface PreviewRow {
  category?: string;
  name?: string;
  price?: string;
  meal_tag?: string;
  vegNonVeg?: string;
}

/* ─── Shared input field ─────────────────────────────────────────────────── */
interface FieldProps {
  label: string;
  name: string;
  value: string;
  onChange: (name: string, value: string) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
}

function Field({ label, name, value, onChange, type = "text", placeholder, hint }: FieldProps) {
  const inputProps = {
    name,
    value,
    placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange(name, e.target.value),
  };
  return (
    <div className="w-full space-y-1">
      <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--t-dim)" }}>
        {label}
      </label>
      {type === "password" ? (
        <Input.Password {...inputProps} />
      ) : (
        <Input {...inputProps} type={type} />
      )}
      {hint && <p className="text-[11px]" style={{ color: "var(--t-dim)" }}>{hint}</p>}
    </div>
  );
}

/* ─── Section divider ────────────────────────────────────────────────────── */
interface SectionLabelProps {
  title: string;
  sub?: string;
}

function SectionLabel({ title, sub }: SectionLabelProps) {
  return (
    <div className="border-t border-white/10 pt-5">
      <p className="text-sm font-semibold text-white">{title}</p>
      {sub && <p className="text-xs text-slate-300 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ─── Step 1: Restaurant Details ─────────────────────────────────────────── */
interface Step1Props {
  form: OnboardForm;
  onChange: (name: string, value: string | FloorData[]) => void;
  onNext: () => void;
  loading: boolean;
  error: string;
}

function Step1({ form, onChange, onNext, loading, error }: Step1Props) {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-base font-bold">Restaurant Details</p>
        <p className="text-slate-300 text-sm mt-0.5">
          Basic information about the restaurant and its owner.
        </p>
      </div>

      {error && <Alert type="error" message={error} showIcon />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field label="Restaurant Name *" value={form.name} name="name" onChange={onChange as (name: string, value: string) => void} placeholder="Spice Garden" />
        <Field label="Slug *" value={form.slug} name="slug" onChange={onChange as (name: string, value: string) => void} placeholder="spice-garden" hint="URL-friendly, lowercase, no spaces" />
        <Field label="Description" value={form.description} name="description" onChange={onChange as (name: string, value: string) => void} placeholder="A lovely family restaurant…" />
        <Field label="Phone" value={form.phone} name="phone" onChange={onChange as (name: string, value: string) => void} placeholder="+91 98765 43210" />
        <Field label="Email" value={form.email} name="email" onChange={onChange as (name: string, value: string) => void} type="email" placeholder="info@spicegarden.com" />
        <Field label="Opening Hours" value={form.opening_hours} name="opening_hours" onChange={onChange as (name: string, value: string) => void} placeholder="11:00 AM – 11:00 PM" />
        <Field label="City" value={form.city} name="city" onChange={onChange as (name: string, value: string) => void} placeholder="Mumbai" />
        <Field label="State" value={form.state} name="state" onChange={onChange as (name: string, value: string) => void} placeholder="Maharashtra" />
      </div>

      <SectionLabel title="Owner Account" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field label="Owner Name *" value={form.owner_name} name="owner_name" onChange={onChange as (name: string, value: string) => void} placeholder="Rahul Sharma" />
        <Field label="Owner Email *" value={form.owner_email} name="owner_email" onChange={onChange as (name: string, value: string) => void} type="email" placeholder="rahul@spicegarden.com" />
        <Field label="Password *" value={form.owner_password} name="owner_password" onChange={onChange as (name: string, value: string) => void} type="password" placeholder="Min. 8 characters" />
      </div>

      <SectionLabel title="Tables" sub="Configure floors and tables. Each floor has its own table numbering." />

      <div className="flex items-center gap-4">
        <div className="w-40">
          <Field label="Number of Floors *" name="floor_count" value={form.floor_count} onChange={onChange as (name: string, value: string) => void} type="number" placeholder="1" />
        </div>
        <p className="text-xs text-slate-300 mt-5">
          {parseInt(form.floor_count) > 1 ? `Configure tables per floor below` : "Set table count and starting number"}
        </p>
      </div>

      {parseInt(form.floor_count) > 1 ? (
        <div className="space-y-3">
          {Array.from({ length: Math.min(parseInt(form.floor_count) || 1, 10) }).map((_, idx) => {
            const floorNum = idx + 1;
            const floorKey = `floor_${floorNum}`;
            const floorData: FloorData = form.floors?.[idx] || { floor_number: floorNum, floor_name: "", table_count: "10", start_number: "1" };
            return (
              <div key={floorNum} className="rounded-xl p-4 border border-white/10 space-y-3" style={{ background: "rgba(255,255,255,0.03)" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--t-accent)" }}>Floor {floorNum}</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Floor Name" name={`${floorKey}_name`} value={floorData.floor_name} onChange={(_, v) => onChange("floors", form.floors?.map((f, i) => (i === idx ? { ...f, floor_name: v } : f)) || [])} placeholder={floorNum === 1 ? "Ground Floor" : `Floor ${floorNum}`} />
                  <Field label="Tables *" name={`${floorKey}_count`} value={floorData.table_count} onChange={(_, v) => onChange("floors", form.floors?.map((f, i) => (i === idx ? { ...f, table_count: v } : f)) || [])} type="number" placeholder="10" />
                  <Field label="Starting #" name={`${floorKey}_start`} value={floorData.start_number} onChange={(_, v) => onChange("floors", form.floors?.map((f, i) => (i === idx ? { ...f, start_number: v } : f)) || [])} type="number" placeholder="1" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <Field label="Number of Tables *" value={form.table_count} name="table_count" onChange={onChange as (name: string, value: string) => void} type="number" placeholder="10" />
          <Field label="Starting Table #" value={form.start_number} name="start_number" onChange={onChange as (name: string, value: string) => void} type="number" placeholder="1" />
        </div>
      )}

      <div className="flex justify-end pt-2">
        <Button type="primary" onClick={onNext} loading={loading} disabled={loading}>
          {loading ? "Creating…" : "Next: Import Menu →"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 2: Import Menu ────────────────────────────────────────────────── */
interface Step2Props {
  restaurantId: string | null;
  onNext: () => void;
  onSkip: () => void;
}

function Step2({ restaurantId, onNext, onSkip }: Step2Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [csvText, setCsvText] = useState("");
  const [menuRows, setMenuRows] = useState<Record<string, unknown>[]>([]);
  const [variantRows, setVariantRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState("");
  const [showSample, setShowSample] = useState(false);

  const parseCSVLine = (line: string): string[] => {
    const fields: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) { fields.push(current.trim()); current = ""; }
      else current += ch;
    }
    fields.push(current.trim());
    return fields;
  };

  const buildPreview = (text: string): PreviewRow[] => {
    const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(1);
    return lines.slice(0, 5).map((line) => {
      const parts = parseCSVLine(line);
      const vegRaw = parts[12]?.trim();
      return {
        category: parts[0]?.trim(),
        name: parts[1]?.trim(),
        price: parts[2]?.trim(),
        meal_tag: parts[10]?.trim(),
        vegNonVeg: !vegRaw ? "Veg (default)" : vegRaw.toLowerCase() === "veg" ? "Veg" : "Non-Veg",
      };
    }).filter((r) => r.name);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(""); setParsing(true); setPreview([]); setCsvText(""); setMenuRows([]); setVariantRows([]);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isXLSX = ext === "xlsx" || ext === "xls";
      if (isXLSX) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const hasVariantsSheet = workbook.SheetNames.includes("Item Variants");
        if (hasVariantsSheet) {
          const mRows = XLSX.utils.sheet_to_json(workbook.Sheets["Menu Items"] || workbook.Sheets[workbook.SheetNames[0]]) as Record<string, unknown>[];
          const vRows = XLSX.utils.sheet_to_json(workbook.Sheets["Item Variants"]) as Record<string, unknown>[];
          setMenuRows(mRows); setVariantRows(vRows);
          setFileName(`${file.name} · XLSX (variants) · ${(file.size / 1024).toFixed(1)} KB`);
          setPreview(mRows.slice(0, 5).map((r) => ({
            category: ((r["Category"] as string) || "").trim(),
            name: ((r["Item Name"] as string) || "").trim(),
            price: r["Has Variants?"] === "Yes" ? "See variants" : String(r["Price (₹)"] ?? ""),
            meal_tag: ((r["Meal Tag"] as string) || "").trim(),
            vegNonVeg: r["Has Variants?"] === "Yes" ? "Mixed" : (r["Veg / Non-Veg"] as string) || "Veg",
          })).filter((r) => r.name));
        } else {
          const csvResult = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
          setCsvText(csvResult);
          setFileName(`${file.name} · XLSX · ${(file.size / 1024).toFixed(1)} KB`);
          setPreview(buildPreview(csvResult));
        }
      } else {
        const csvResult = await file.text();
        setCsvText(csvResult);
        setFileName(`${file.name} · CSV · ${(file.size / 1024).toFixed(1)} KB`);
        setPreview(buildPreview(csvResult));
      }
    } catch {
      setError("Could not read the file. Make sure it is a valid CSV or XLSX.");
    } finally {
      setParsing(false);
    }
  };

  const hasData = menuRows.length > 0 || csvText.trim().length > 0;

  const handleImport = async () => {
    if (!hasData) { setError("Please upload a file first."); return; }
    setError(""); setLoading(true);
    try {
      if (menuRows.length > 0) await importMenu(restaurantId ?? "", null, menuRows, variantRows);
      else await importMenu(restaurantId ?? "", csvText);
      onNext();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  const previewColumns: ColumnsType<PreviewRow> = [
    { title: "Category", dataIndex: "category", key: "category" },
    { title: "Name", dataIndex: "name", key: "name", render: (v) => <span className="font-medium">{v}</span> },
    { title: "Price", dataIndex: "price", key: "price", render: (v) => <span style={{ color: "var(--t-accent)" }}>{v}</span> },
    { title: "Meal Tag", dataIndex: "meal_tag", key: "meal_tag", render: (v) => v || "-" },
    { title: "Veg/Non-Veg", dataIndex: "vegNonVeg", key: "veg", render: (v) => v || "-" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <p className="text-base font-bold">Import Menu</p>
        <p className="text-slate-300 text-sm mt-0.5">Upload a CSV or XLSX file — format is auto-detected.</p>
      </div>

      {error && <Alert type="error" message={error} showIcon />}

      <div>
        <button onClick={() => setShowSample((s) => !s)} className="text-xs font-medium transition-colors flex items-center gap-1" style={{ color: "var(--t-accent)" }}>
          {showSample ? "▲ Hide" : "▼ Show"} expected column format
        </button>
        {showSample && (
          <pre className="mt-2 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto">{CSV_SAMPLE}</pre>
        )}
      </div>

      <div onClick={() => fileInputRef.current?.click()} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) handleFileChange({ target: { files: e.dataTransfer.files } }); }} className="border-2 border-dashed border-white/10 hover:border-orange-500/50 rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 group" style={{ background: "rgba(255,255,255,0.02)" }}>
        <input ref={fileInputRef} type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} className="hidden" />
        {parsing ? (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <span className="inline-flex"><svg className="animate-spin h-4 w-4 text-orange-400" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg></span>
            Reading file…
          </div>
        ) : fileName ? (
          <div className="space-y-2">
            <p className="text-3xl">📄</p>
            <p className="text-white text-sm font-medium">{fileName}</p>
            <p className="text-slate-300 text-xs">{preview.length > 0 ? `${preview.length}+ items detected` : "Click to replace"}</p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-4xl group-hover:scale-110 transition-transform duration-200">⬆️</p>
            <p className="text-white text-sm font-medium group-hover:text-orange-400 transition-colors">Click to upload or drag &amp; drop</p>
            <p className="text-slate-600 text-xs">CSV or XLSX — format is auto-detected</p>
          </div>
        )}
      </div>

      {preview.length > 0 && (
        <div>
          <p className="text-xs text-slate-300 mb-2">Preview — first {preview.length} rows</p>
          <Table
            columns={previewColumns}
            dataSource={preview.map((r, i) => ({ ...r, key: i }))}
            size="small"
            pagination={false}
            className="rounded-xl overflow-hidden"
          />
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <button onClick={onSkip} className="text-sm text-slate-300 hover:text-white transition-colors">Skip for now →</button>
        <Button type="primary" onClick={handleImport} loading={loading || parsing} disabled={loading || parsing || !hasData}>
          {loading ? "Importing…" : "Import Menu →"}
        </Button>
      </div>
    </div>
  );
}

/* ─── Step 3: Petpooja POS (optional) ───────────────────────────────────── */
interface Step3PetpoojaProps {
  restaurantId: string | null;
  onNext: () => void;
  onSkip: () => void;
}

function Step3Petpooja({ restaurantId, onNext, onSkip }: Step3PetpoojaProps) {
  const [form, setForm] = useState({ enabled: false, app_key: "", app_secret: "", access_token: "", rest_id: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedUrls, setSavedUrls] = useState<{ callback_url: string; menu_push_url: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => { setCopied(key); setTimeout(() => setCopied(null), 2000); });
  };

  const handleSave = async () => {
    if (!form.enabled) { onNext(); return; }
    if (!form.app_key || !form.app_secret || !form.access_token || !form.rest_id) { setError("All fields are required when enabling Petpooja."); return; }
    if (!restaurantId) return;
    setError(""); setLoading(true);
    try {
      const result = await updateSAPetpoojaConfig(restaurantId, { enabled: true, app_key: form.app_key, app_secret: form.app_secret, access_token: form.access_token, rest_id: form.rest_id });
      setSavedUrls({ callback_url: result.callback_url, menu_push_url: result.menu_push_url });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message ?? "Failed to save. Please try from restaurant settings later.");
    } finally {
      setLoading(false);
    }
  };

  if (savedUrls) {
    return (
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <div className="text-4xl">✅</div>
          <h2 className="text-lg font-bold text-white">Petpooja Configured</h2>
          <p className="text-sm text-slate-400">Paste these URLs into your Petpooja sandbox Configuration page.</p>
        </div>
        <UrlRow label="Menu Sharing Endpoint" value={savedUrls.menu_push_url} copied={copied} onCopy={copy} id="menu" />
        <UrlRow label="Callback URL" value={savedUrls.callback_url} copied={copied} onCopy={copy} id="callback" />
        <p className="text-xs text-slate-500 text-center">After saving, trigger a Menu Push from Petpooja to map item IDs. Orders will relay when customers request the bill.</p>
        <div className="flex justify-end">
          <Button type="primary" onClick={onNext}>Continue →</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white">Petpooja POS Integration</h2>
        <p className="text-sm text-slate-400 mt-1">When enabled, orders will be sent to Petpooja when the customer requests the final bill. You can also configure this later from restaurant Settings.</p>
      </div>

      <div className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
        <div>
          <p className="text-sm font-semibold text-white">Enable Petpooja POS</p>
          <p className="text-xs text-slate-400">Connect this restaurant to Petpooja POS.</p>
        </div>
        <Switch
          checked={form.enabled}
          onChange={(checked) => { setForm((f) => ({ ...f, enabled: checked })); setError(""); }}
        />
      </div>

      {form.enabled && (
        <div className="space-y-3">
          {(["app_key", "app_secret", "access_token", "rest_id"] as const).map((key) => (
            <div key={key} className="w-full space-y-1">
              <label className="text-[11px] font-medium uppercase tracking-wider" style={{ color: "var(--t-dim)" }}>
                {key === "rest_id" ? "Restaurant ID (restID / mapping code)" : key.replace(/_/g, " ")}
              </label>
              {key === "app_secret" || key === "access_token" ? (
                <Input.Password
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={`Enter ${key.replace(/_/g, " ")}`}
                />
              ) : (
                <Input
                  type="text"
                  value={form[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                  placeholder={key === "rest_id" ? "oqxwni2t" : `Enter ${key.replace(/_/g, " ")}`}
                />
              )}
            </div>
          ))}
        </div>
      )}

      {error && <p className="text-sm text-red-400">{error}</p>}

      <div className="flex items-center justify-between pt-2">
        <button onClick={onSkip} className="text-sm text-slate-500 hover:text-slate-300 transition-colors">Skip for now</button>
        <Button type="primary" onClick={handleSave} loading={loading}>
          {form.enabled ? "Save & Continue" : "Continue →"}
        </Button>
      </div>
    </div>
  );
}

function UrlRow({ label, value, copied, onCopy, id }: { label: string; value: string; copied: string | null; onCopy: (v: string, id: string) => void; id: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</p>
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs font-mono text-slate-300 truncate">{value}</div>
        <button onClick={() => onCopy(value, id)} className="shrink-0 px-3 py-2 rounded-xl text-xs font-semibold transition-all" style={{ background: copied === id ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.05)", border: `1px solid ${copied === id ? "rgba(34,197,94,0.3)" : "rgba(255,255,255,0.1)"}`, color: copied === id ? "#4ade80" : "#94a3b8" }}>
          {copied === id ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}

/* ─── Step 4: Done ───────────────────────────────────────────────────────── */
interface Step3Props {
  restaurantId: string | null;
}

function Step3({ restaurantId }: Step3Props) {
  const navigate = useNavigate();

  const downloadWithAuth = async () => {
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8000"}/api/superadmin/restaurants/${restaurantId}/qr-pdf`,
        { headers: { Authorization: `Bearer ${authStore.getState().adminAccessToken}` } },
      );
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a") as HTMLAnchorElement;
      a.href = url;
      a.download = "qr-codes.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to download PDF. Please try again.");
    }
  };

  return (
    <div className="text-center space-y-6 py-10">
      <div className="text-6xl">🎉</div>
      <div>
        <h2 className="text-2xl font-bold" style={{ background: "linear-gradient(90deg, #fff, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" } as React.CSSProperties}>
          Restaurant Onboarded!
        </h2>
        <p className="text-slate-300 mt-2 text-sm">The restaurant, owner account, tables, and menu have been set up.</p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Button type="primary" onClick={downloadWithAuth}>📄 Download QR Codes PDF</Button>
        <Button type="text" onClick={() => navigate("/superadmin")}>← Back to Restaurants</Button>
      </div>
    </div>
  );
}

/* ─── Main onboard page ──────────────────────────────────────────────────── */
export default function OnboardPage() {
  const [step, setStep] = useState(0);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<OnboardForm>({
    name: "", slug: "", description: "", phone: "", email: "", opening_hours: "",
    city: "", state: "", owner_name: "", owner_email: "", owner_password: "",
    floor_count: "1", table_count: "10", start_number: "1",
    floors: [{ floor_number: 1, floor_name: "Ground Floor", table_count: "10", start_number: "1" }],
  });

  const handleChange = (name: string, value: string | FloorData[]) => {
    if (name === "floor_count") {
      const n = Math.max(1, Math.min(10, parseInt(value as string) || 1));
      setForm((p) => {
        const existing = p.floors || [];
        const updated: FloorData[] = Array.from({ length: n }, (_, i) => existing[i] || { floor_number: i + 1, floor_name: i === 0 ? "Ground Floor" : `Floor ${i + 1}`, table_count: "10", start_number: "1" });
        return { ...p, floor_count: String(n), floors: updated };
      });
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
    if (name === "name" && !form.slug && typeof value === "string") {
      setForm((p) => ({ ...p, name: value, slug: value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }));
    }
  };

  const handleStep1 = async () => {
    const required: (keyof OnboardForm)[] = ["name", "slug", "owner_name", "owner_email", "owner_password"];
    for (const f of required) {
      if (!form[f]) { setError(`${f.replace(/_/g, " ")} is required`); return; }
    }
    setError(""); setLoading(true);
    try {
      const isMultiFloor = parseInt(form.floor_count) > 1;
      const payload: Record<string, unknown> = {
        name: form.name, slug: form.slug, description: form.description,
        contact: { phone: form.phone, email: form.email },
        address: { city: form.city, state: form.state },
        owner_name: form.owner_name, owner_email: form.owner_email, owner_password: form.owner_password,
      };
      if (isMultiFloor) {
        payload.floors = form.floors.map((f) => ({ floor_number: parseInt(String(f.floor_number)) || 1, floor_name: f.floor_name || "", table_count: parseInt(f.table_count) || 0, start_number: parseInt(f.start_number) || 1 }));
      } else {
        payload.table_count = parseInt(form.table_count) || 0;
        payload.start_number = parseInt(form.start_number) || 1;
      }
      const data = (await createRestaurant(payload)) as { restaurant: { _id: string } };
      setRestaurantId(data.restaurant._id);
      setStep(1);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Failed to create restaurant.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2 text-sm text-slate-300 mb-6">
        <button onClick={() => window.history.back()} className="hover:text-white transition-colors">Restaurants</button>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Onboard New Restaurant</span>
      </div>

      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div className={`flex items-center gap-2 text-sm font-medium transition-colors ${i === step ? "text-orange-400" : i < step ? "text-green-400" : "text-slate-600"}`}>
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all" style={i === step ? { background: "var(--t-accent)", color: "#fff" } : i < step ? { background: "#22c55e", color: "#fff" } : { background: "rgba(255,255,255,0.08)", color: "#64748b" }}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className="hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 sm:w-16 h-0.5 mx-2 rounded-full transition-colors ${i < step ? "bg-green-500" : "bg-white/10"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
        {step === 0 && <Step1 form={form} onChange={handleChange} onNext={handleStep1} loading={loading} error={error} />}
        {step === 1 && <Step2 restaurantId={restaurantId} onNext={() => setStep(2)} onSkip={() => setStep(2)} />}
        {step === 2 && <Step3Petpooja restaurantId={restaurantId} onNext={() => setStep(3)} onSkip={() => setStep(3)} />}
        {step === 3 && <Step3 restaurantId={restaurantId} />}
      </div>
    </div>
  );
}
