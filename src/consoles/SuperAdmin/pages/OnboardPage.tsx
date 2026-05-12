import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { createRestaurant, importMenu } from "../../../services/superAdminService";
import { authStore } from "../../../store/authStore";

const STEPS = ["Restaurant Details", "Import Menu", "Done"];

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
  return (
    <label className="form-control w-full">
      <div className="label pb-1">
        <span className="label-text text-xs font-medium uppercase tracking-wider">{label}</span>
      </div>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)}
        placeholder={placeholder}
        className="input input-bordered w-full text-sm"
      />
      {hint && <div className="label pt-1"><span className="label-text-alt text-xs">{hint}</span></div>}
    </label>
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
        <p className="text-base font-bold text-white">Restaurant Details</p>
        <p className="text-slate-300 text-sm mt-0.5">
          Basic information about the restaurant and its owner.
        </p>
      </div>

      {error && (
        <div role="alert" className="alert alert-error text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Field
          label="Restaurant Name *"
          value={form.name}
          name="name"
          onChange={onChange as (name: string, value: string) => void}
          placeholder="Spice Garden"
        />
        <Field
          label="Slug *"
          value={form.slug}
          name="slug"
          onChange={onChange as (name: string, value: string) => void}
          placeholder="spice-garden"
          hint="URL-friendly, lowercase, no spaces"
        />
        <Field
          label="Description"
          value={form.description}
          name="description"
          onChange={onChange as (name: string, value: string) => void}
          placeholder="A lovely family restaurant…"
        />
        <Field
          label="Phone"
          value={form.phone}
          name="phone"
          onChange={onChange as (name: string, value: string) => void}
          placeholder="+91 98765 43210"
        />
        <Field
          label="Email"
          value={form.email}
          name="email"
          onChange={onChange as (name: string, value: string) => void}
          type="email"
          placeholder="info@spicegarden.com"
        />
        <Field
          label="Opening Hours"
          value={form.opening_hours}
          name="opening_hours"
          onChange={onChange as (name: string, value: string) => void}
          placeholder="11:00 AM – 11:00 PM"
        />
        <Field
          label="City"
          value={form.city}
          name="city"
          onChange={onChange as (name: string, value: string) => void}
          placeholder="Mumbai"
        />
        <Field
          label="State"
          value={form.state}
          name="state"
          onChange={onChange as (name: string, value: string) => void}
          placeholder="Maharashtra"
        />
      </div>

      <SectionLabel title="Owner Account" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Field
          label="Owner Name *"
          value={form.owner_name}
          name="owner_name"
          onChange={onChange as (name: string, value: string) => void}
          placeholder="Rahul Sharma"
        />
        <Field
          label="Owner Email *"
          value={form.owner_email}
          name="owner_email"
          onChange={onChange as (name: string, value: string) => void}
          type="email"
          placeholder="rahul@spicegarden.com"
        />
        <Field
          label="Password *"
          value={form.owner_password}
          name="owner_password"
          onChange={onChange as (name: string, value: string) => void}
          type="password"
          placeholder="Min. 8 characters"
        />
      </div>

      <SectionLabel
        title="Tables"
        sub="Configure floors and tables. Each floor has its own table numbering."
      />

      {/* Floor count */}
      <div className="flex items-center gap-4">
        <div className="w-40">
          <Field
            label="Number of Floors *"
            name="floor_count"
            value={form.floor_count}
            onChange={onChange as (name: string, value: string) => void}
            type="number"
            placeholder="1"
          />
        </div>
        <p className="text-xs text-slate-300 mt-5">
          {parseInt(form.floor_count) > 1
            ? `Configure tables per floor below`
            : "Set table count and starting number"}
        </p>
      </div>

      {/* Per-floor config */}
      {parseInt(form.floor_count) > 1 ? (
        <div className="space-y-3">
          {Array.from({ length: Math.min(parseInt(form.floor_count) || 1, 10) }).map((_, idx) => {
            const floorNum = idx + 1;
            const floorKey = `floor_${floorNum}`;
            const floorData: FloorData = form.floors?.[idx] || {
              floor_number: floorNum,
              floor_name: "",
              table_count: "10",
              start_number: "1",
            };
            return (
              <div
                key={floorNum}
                className="rounded-xl p-4 border border-white/10 space-y-3"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--t-accent)" }}
                >
                  Floor {floorNum}
                </p>
                <div className="grid grid-cols-3 gap-3">
                  <Field
                    label="Floor Name"
                    name={`${floorKey}_name`}
                    value={floorData.floor_name}
                    onChange={(_, v) =>
                      onChange(
                        "floors",
                        form.floors?.map((f, i) => (i === idx ? { ...f, floor_name: v } : f)) || [],
                      )
                    }
                    placeholder={floorNum === 1 ? "Ground Floor" : `Floor ${floorNum}`}
                  />
                  <Field
                    label="Tables *"
                    name={`${floorKey}_count`}
                    value={floorData.table_count}
                    onChange={(_, v) =>
                      onChange(
                        "floors",
                        form.floors?.map((f, i) => (i === idx ? { ...f, table_count: v } : f)) ||
                          [],
                      )
                    }
                    type="number"
                    placeholder="10"
                  />
                  <Field
                    label="Starting #"
                    name={`${floorKey}_start`}
                    value={floorData.start_number}
                    onChange={(_, v) =>
                      onChange(
                        "floors",
                        form.floors?.map((f, i) => (i === idx ? { ...f, start_number: v } : f)) ||
                          [],
                      )
                    }
                    type="number"
                    placeholder="1"
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 max-w-xs">
          <Field
            label="Number of Tables *"
            value={form.table_count}
            name="table_count"
            onChange={onChange as (name: string, value: string) => void}
            type="number"
            placeholder="10"
          />
          <Field
            label="Starting Table #"
            value={form.start_number}
            name="start_number"
            onChange={onChange as (name: string, value: string) => void}
            type="number"
            placeholder="1"
          />
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={onNext}
          disabled={loading}
          className="btn btn-primary gap-2 disabled:opacity-50"
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          {loading ? "Creating…" : "Next: Import Menu →"}
        </button>
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
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        fields.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    fields.push(current.trim());
    return fields;
  };

  const buildPreview = (text: string): PreviewRow[] => {
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .slice(1); // skip header

    return lines
      .slice(0, 5)
      .map((line) => {
        const parts = parseCSVLine(line);
        const category = parts[0]?.trim();
        const name = parts[1]?.trim();
        const price = parts[2]?.trim();
        const meal_tag = parts[10]?.trim();
        const vegRaw = parts[12]?.trim();

        let vegNonVeg = "";
        if (!vegRaw) vegNonVeg = "Veg (default)";
        else vegNonVeg = vegRaw.toLowerCase() === "veg" ? "Veg" : "Non-Veg";

        return { category, name, price, meal_tag, vegNonVeg };
      })
      .filter((r) => r.name);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement> | { target: { files: FileList | null } }) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError("");
    setParsing(true);
    setPreview([]);
    setCsvText("");
    setMenuRows([]);
    setVariantRows([]);
    try {
      const ext = file.name.split(".").pop()?.toLowerCase();
      const isXLSX = ext === "xlsx" || ext === "xls";
      if (isXLSX) {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const hasVariantsSheet = workbook.SheetNames.includes("Item Variants");
        if (hasVariantsSheet) {
          // New 2-sheet variant-aware format
          const mRows = XLSX.utils.sheet_to_json(
            workbook.Sheets["Menu Items"] || workbook.Sheets[workbook.SheetNames[0]],
          ) as Record<string, unknown>[];
          const vRows = XLSX.utils.sheet_to_json(
            workbook.Sheets["Item Variants"],
          ) as Record<string, unknown>[];
          setMenuRows(mRows);
          setVariantRows(vRows);
          setFileName(`${file.name} · XLSX (variants) · ${(file.size / 1024).toFixed(1)} KB`);
          // Build preview from menu rows
          const prev: PreviewRow[] = mRows
            .slice(0, 5)
            .map((r) => ({
              category: ((r["Category"] as string) || "").trim(),
              name: ((r["Item Name"] as string) || "").trim(),
              price: r["Has Variants?"] === "Yes" ? "See variants" : String(r["Price (₹)"] ?? ""),
              meal_tag: ((r["Meal Tag"] as string) || "").trim(),
              vegNonVeg: r["Has Variants?"] === "Yes" ? "Mixed" : (r["Veg / Non-Veg"] as string) || "Veg",
            }))
            .filter((r) => r.name);
          setPreview(prev);
        } else {
          // Single-sheet XLSX → convert to CSV (legacy path)
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
    if (!hasData) {
      setError("Please upload a file first.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      if (menuRows.length > 0) {
        await importMenu(restaurantId, null, menuRows, variantRows);
      } else {
        await importMenu(restaurantId, csvText);
      }
      onNext();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } } };
      setError(axiosErr.response?.data?.message || "Import failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <p className="text-base font-bold text-white">Import Menu</p>
        <p className="text-slate-300 text-sm mt-0.5">
          Upload a CSV or XLSX file — format is auto-detected.
        </p>
      </div>

      {error && (
        <div role="alert" className="alert alert-error text-sm">{error}</div>
      )}

      {/* Format reference */}
      <div>
        <button
          onClick={() => setShowSample((s) => !s)}
          className="text-xs font-medium transition-colors flex items-center gap-1"
          style={{ color: "var(--t-accent)" }}
        >
          {showSample ? "▲ Hide" : "▼ Show"} expected column format
        </button>
        {showSample && (
          <pre className="mt-2 bg-white/5 border border-white/10 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto">
            {CSV_SAMPLE}
          </pre>
        )}
      </div>

      {/* Drop zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const f = e.dataTransfer.files?.[0];
          if (f) handleFileChange({ target: { files: e.dataTransfer.files } });
        }}
        className="border-2 border-dashed border-white/10 hover:border-orange-500/50 rounded-2xl p-10 text-center cursor-pointer transition-all duration-200 group"
        style={{ background: "rgba(255,255,255,0.02)" }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        {parsing ? (
          <div className="flex items-center justify-center gap-2 text-slate-400 text-sm">
            <span className="loading loading-spinner loading-sm" />
            Reading file…
          </div>
        ) : fileName ? (
          <div className="space-y-2">
            <p className="text-3xl">📄</p>
            <p className="text-white text-sm font-medium">{fileName}</p>
            <p className="text-slate-300 text-xs">
              {preview.length > 0 ? `${preview.length}+ items detected` : "Click to replace"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-4xl group-hover:scale-110 transition-transform duration-200">⬆️</p>
            <p className="text-white text-sm font-medium group-hover:text-orange-400 transition-colors">
              Click to upload or drag &amp; drop
            </p>
            <p className="text-slate-600 text-xs">CSV or XLSX — format is auto-detected</p>
          </div>
        )}
      </div>

      {/* Preview */}
      {preview.length > 0 && (
        <div>
          <p className="text-xs text-slate-300 mb-2">Preview — first {preview.length} rows</p>
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: 'var(--t-line)' }}>
            <table className="table table-sm w-full text-xs">
              <thead>
                <tr>
                  <th className="uppercase tracking-wider font-semibold">Category</th>
                  <th className="uppercase tracking-wider font-semibold">Name</th>
                  <th className="uppercase tracking-wider font-semibold">Price</th>
                  <th className="uppercase tracking-wider font-semibold">Meal Tag</th>
                  <th className="uppercase tracking-wider font-semibold">Veg/Non-Veg</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="hover">
                    <td>{r.category}</td>
                    <td className="font-medium">{r.name}</td>
                    <td className="font-semibold" style={{ color: "var(--t-accent)" }}>{r.price}</td>
                    <td>{r.meal_tag || "-"}</td>
                    <td>{r.vegNonVeg || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <button
          onClick={onSkip}
          className="text-sm text-slate-300 hover:text-white transition-colors"
        >
          Skip for now →
        </button>
        <button
          onClick={handleImport}
          disabled={loading || parsing || !hasData}
          className="btn btn-primary gap-2 disabled:opacity-50"
        >
          {loading && <span className="loading loading-spinner loading-sm" />}
          {loading ? "Importing…" : "Import Menu →"}
        </button>
      </div>
    </div>
  );
}

/* ─── Step 3: Done ───────────────────────────────────────────────────────── */
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
        <h2
          className="text-2xl font-bold"
          style={{
            background: "linear-gradient(90deg, #fff, #94a3b8)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          } as React.CSSProperties}
        >
          Restaurant Onboarded!
        </h2>
        <p className="text-slate-300 mt-2 text-sm">
          The restaurant, owner account, tables, and menu have been set up.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <button onClick={downloadWithAuth} className="btn btn-primary gap-2">
          📄 Download QR Codes PDF
        </button>
        <button onClick={() => navigate("/superadmin")} className="btn btn-ghost gap-2">
          ← Back to Restaurants
        </button>
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
    name: "",
    slug: "",
    description: "",
    phone: "",
    email: "",
    opening_hours: "",
    city: "",
    state: "",
    owner_name: "",
    owner_email: "",
    owner_password: "",
    floor_count: "1",
    table_count: "10",
    start_number: "1",
    floors: [{ floor_number: 1, floor_name: "Ground Floor", table_count: "10", start_number: "1" }],
  });

  const handleChange = (name: string, value: string | FloorData[]) => {
    if (name === "floor_count") {
      const n = Math.max(1, Math.min(10, parseInt(value as string) || 1));
      setForm((p) => {
        const existing = p.floors || [];
        const updated: FloorData[] = Array.from(
          { length: n },
          (_, i) =>
            existing[i] || {
              floor_number: i + 1,
              floor_name: i === 0 ? "Ground Floor" : `Floor ${i + 1}`,
              table_count: "10",
              start_number: "1",
            },
        );
        return { ...p, floor_count: String(n), floors: updated };
      });
      return;
    }
    setForm((p) => ({ ...p, [name]: value }));
    if (name === "name" && !form.slug) {
      setForm((p) => ({
        ...p,
        [name]: value,
        slug: (value as string)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, ""),
      }));
    }
  };

  const handleStep1 = async () => {
    const required: (keyof OnboardForm)[] = ["name", "slug", "owner_name", "owner_email", "owner_password"];
    for (const f of required) {
      if (!form[f]) {
        setError(`${f.replace(/_/g, " ")} is required`);
        return;
      }
    }
    setError("");
    setLoading(true);
    try {
      const isMultiFloor = parseInt(form.floor_count) > 1;
      const payload: Record<string, unknown> = {
        name: form.name,
        slug: form.slug,
        description: form.description,
        contact: { phone: form.phone, email: form.email },
        address: { city: form.city, state: form.state },
        owner_name: form.owner_name,
        owner_email: form.owner_email,
        owner_password: form.owner_password,
      };
      if (isMultiFloor) {
        payload.floors = form.floors.map((f) => ({
          floor_number: parseInt(String(f.floor_number)) || 1,
          floor_name: f.floor_name || "",
          table_count: parseInt(f.table_count) || 0,
          start_number: parseInt(f.start_number) || 1,
        }));
      } else {
        payload.table_count = parseInt(form.table_count) || 0;
        payload.start_number = parseInt(form.start_number) || 1;
      }
      const data = await createRestaurant(payload) as { restaurant: { _id: string } };
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
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-slate-300 mb-6">
        <button
          onClick={() => window.history.back()}
          className="hover:text-white transition-colors"
        >
          Restaurants
        </button>
        <span className="text-slate-700">/</span>
        <span className="text-slate-300">Onboard New Restaurant</span>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center">
            <div
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                i === step ? "text-orange-400" : i < step ? "text-green-400" : "text-slate-600"
              }`}
            >
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                style={
                  i === step
                    ? { background: "var(--t-accent)", color: "#fff" }
                    : i < step
                      ? { background: "#22c55e", color: "#fff" }
                      : { background: "rgba(255,255,255,0.08)", color: "#64748b" }
                }
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className="hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={`w-8 sm:w-16 h-0.5 mx-2 rounded-full transition-colors ${i < step ? "bg-green-500" : "bg-white/10"}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step content panel */}
      <div className="bg-slate-900 border border-white/10 rounded-2xl p-6">
        {step === 0 && (
          <Step1
            form={form}
            onChange={handleChange}
            onNext={handleStep1}
            loading={loading}
            error={error}
          />
        )}
        {step === 1 && (
          <Step2 restaurantId={restaurantId} onNext={() => setStep(2)} onSkip={() => setStep(2)} />
        )}
        {step === 2 && <Step3 restaurantId={restaurantId} />}
      </div>
    </div>
  );
}
