import { useState, useEffect, useRef } from "react";
import Modal from "../../../components/ui/Modal";
import {
  createDashMenuItem,
  updateDashMenuItem,
  uploadMenuItemImage,
} from "../../../services/dashboardService";

// ── Types ─────────────────────────────────────────────────────────────────────

interface VariantData {
  groupName?: string;
  name: string;
  price: string | number;
  isVeg?: boolean;
  isDefault?: boolean;
  isAvailable?: boolean;
  discount_percentage?: number;
}

interface FormData {
  name: string;
  description: string;
  category: string;
  meal_tag: string;
  price: string | number;
  discount_percentage: number;
  gst_slab: number;
  is_veg: boolean;
  spice_level: number;
  taste_profile: string;
  preparation_time: string | number;
  serves: string | number;
  is_available: boolean;
  is_chefs_special: boolean;
  is_featured: boolean;
  stock_status: boolean;
  ingredients: string;
  allergens: string;
  tags: string;
  image_url: string;
  display_order: string | number;
  is_combo: boolean;
  combo_discount: number;
  has_variants: boolean;
  variants: VariantData[];
}

interface MenuItem {
  _id: string;
  name?: string;
  price?: number;
  ingredients?: string[] | string;
  allergens?: string[] | string;
  tags?: string[] | string;
  preparation_time?: number | string;
  serves?: number | string;
  display_order?: number | string;
  has_variants?: boolean;
  variants?: VariantData[];
  image_url?: string;
  [key: string]: unknown;
}

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (saved: unknown) => void;
  item?: MenuItem | null;
  existingCategories?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TASTE_OPTIONS = ["Savory", "Sweet", "Spicy", "Tangy", "Mild", "Bitter"];
const GST_OPTIONS = [0, 5, 12, 18, 28];
const MEAL_TAG_SUGGESTIONS = [
  "Breakfast", "Lunch", "Dinner", "Lunch / Dinner", "All Day", "Snack", "Dessert",
];

const EMPTY_FORM: FormData = {
  name: "",
  description: "",
  category: "",
  meal_tag: "",
  price: "",
  discount_percentage: 0,
  gst_slab: 5,
  is_veg: true,
  spice_level: 0,
  taste_profile: "Savory",
  preparation_time: "",
  serves: "",
  is_available: true,
  is_chefs_special: false,
  is_featured: false,
  stock_status: true,
  ingredients: "",
  allergens: "",
  tags: "",
  image_url: "",
  display_order: "",
  is_combo: false,
  combo_discount: 0,
  has_variants: false,
  variants: [],
};

const EMPTY_VARIANT: VariantData = {
  groupName: "",
  name: "",
  price: "",
  isVeg: true,
  isDefault: false,
  isAvailable: true,
  discount_percentage: 0,
};

// ── Helper ────────────────────────────────────────────────────────────────────

function arrToStr(val: string[] | string | null | undefined): string {
  if (Array.isArray(val)) return val.join(", ");
  return val ?? "";
}

// ── Sub-components ────────────────────────────────────────────────────────────

interface SectionLabelProps { children: React.ReactNode }

function SectionLabel({ children }: SectionLabelProps) {
  return (
    <p className="text-[10px] font-semibold text-slate-300 uppercase tracking-widest mb-3">
      {children}
    </p>
  );
}

interface FieldLabelProps { children: React.ReactNode; hint?: string }

function FieldLabel({ children, hint }: FieldLabelProps) {
  return (
    <label className="block text-xs font-medium text-slate-400 mb-1.5">
      {children}
      {hint && <span className="ml-1 text-slate-600 font-normal">{hint}</span>}
    </label>
  );
}

const inputCls =
  "w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder-slate-600 focus:outline-none transition-colors";

interface ToggleProps {
  checked: boolean;
  onChange: (val: boolean) => void;
  label: string;
}

function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${checked ? "bg-green-500" : "bg-slate-600"}`}
      >
        <span
          className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ${checked ? "translate-x-4" : "translate-x-0"}`}
        />
      </button>
      <span className="text-xs text-slate-300">{label}</span>
    </label>
  );
}

// ── Variant row ── */

interface VariantRowProps {
  variant: VariantData;
  index: number;
  onChange: (updated: VariantData) => void;
  onRemove: () => void;
  onSetDefault: () => void;
  isDefault: boolean;
}

function VariantRow({ variant, index, onChange, onRemove, onSetDefault, isDefault }: VariantRowProps) {
  const isVeg = variant.isVeg !== false;
  const available = variant.isAvailable !== false;
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: `1px solid ${isDefault ? "rgba(245,158,11,0.3)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      {/* Part 1: data inputs */}
      <div
        className="flex items-center gap-2 p-2.5"
        style={{ background: "rgba(255,255,255,0.03)" }}
      >
        <span
          className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
          style={{ background: "rgba(255,255,255,0.06)", color: "var(--t-dim)" }}
        >
          {index + 1}
        </span>
        <input
          type="text"
          value={variant.name}
          onChange={(e) => onChange({ ...variant, name: e.target.value })}
          placeholder="e.g. Chicken, Large, Spicy…"
          className={`${inputCls} flex-1 min-w-0`}
          style={{ padding: "5px 10px", fontSize: "12px" }}
        />
        <div className="relative shrink-0">
          <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] text-slate-300 pointer-events-none select-none">
            ₹
          </span>
          <input
            type="number"
            min="0"
            value={variant.price}
            onChange={(e) => onChange({ ...variant, price: e.target.value })}
            placeholder="0"
            title="Price for this variant"
            className={`${inputCls} w-20 text-right`}
            style={{ padding: "5px 8px 5px 18px", fontSize: "12px" }}
          />
        </div>
        <div className="relative shrink-0">
          <input
            type="number"
            min="0"
            max="100"
            value={variant.discount_percentage ?? 0}
            onChange={(e) =>
              onChange({
                ...variant,
                discount_percentage: Math.min(100, Math.max(0, Number(e.target.value))),
              })
            }
            placeholder="0"
            title="Discount percentage for this variant"
            className={`${inputCls} w-16 text-center`}
            style={{ padding: "5px 18px 5px 6px", fontSize: "12px" }}
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 pointer-events-none">
            %
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          title="Remove this variant"
          className="shrink-0 w-6 h-6 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: "#475569" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#475569")}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Part 2: labeled toggle controls */}
      <div
        className="flex items-center gap-2 px-3 py-2 flex-wrap"
        style={{
          borderTop: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.015)",
        }}
      >
        <button
          type="button"
          onClick={() => onChange({ ...variant, isVeg: !isVeg })}
          title="Toggle Vegetarian / Non-Vegetarian"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 shrink-0"
          style={
            isVeg
              ? { background: "rgba(34,197,94,0.12)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.25)" }
              : { background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }
          }
        >
          <span
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 12, height: 12, borderRadius: 2,
              border: `1.5px solid ${isVeg ? "#22c55e" : "#b45309"}`, flexShrink: 0,
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: isVeg ? "#22c55e" : "#ef4444" }} />
          </span>
          {isVeg ? "Vegetarian" : "Non-Veg"}
        </button>

        <div className="h-3 w-px shrink-0" style={{ background: "rgba(255,255,255,0.1)" }} />

        <button
          type="button"
          onClick={() => onChange({ ...variant, isAvailable: !available })}
          title={available ? "Mark as unavailable" : "Mark as available"}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 shrink-0"
          style={
            available
              ? { background: "rgba(34,197,94,0.08)", color: "#4ade80", border: "1px solid rgba(34,197,94,0.2)" }
              : { background: "rgba(71,85,105,0.15)", color: "#64748b", border: "1px solid rgba(71,85,105,0.25)" }
          }
        >
          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: available ? "#22c55e" : "#475569" }} />
          {available ? "Available" : "Unavailable"}
        </button>

        <button
          type="button"
          onClick={onSetDefault}
          title={isDefault ? "This is the default variant shown to customers" : "Set as default variant"}
          className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all duration-150 shrink-0 ml-auto"
          style={
            isDefault
              ? { background: "rgba(245,158,11,0.15)", color: "#fbbf24", border: "1px solid rgba(245,158,11,0.3)" }
              : { background: "transparent", color: "#475569", border: "1px solid rgba(255,255,255,0.07)" }
          }
        >
          <span>{isDefault ? "★" : "☆"}</span>
          {isDefault ? "Default" : "Set Default"}
        </button>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function ProductFormModal({ isOpen, onClose, onSave, item, existingCategories }: ProductFormModalProps) {
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEdit = item !== null && item !== undefined;

  useEffect(() => {
    if (!isOpen) return;
    if (isEdit && item) {
      setForm({
        ...EMPTY_FORM,
        ...(item as unknown as Partial<FormData>),
        ingredients: arrToStr(item.ingredients as string[] | string),
        allergens: arrToStr(item.allergens as string[] | string),
        tags: arrToStr(item.tags as string[] | string),
        price: item.price ?? "",
        preparation_time: item.preparation_time ?? "",
        serves: item.serves ?? "",
        display_order: item.display_order ?? "",
        has_variants: item.has_variants ?? false,
        variants: item.variants?.map((v) => ({ ...v, price: v.price ?? "" })) ?? [],
      });
      setImagePreview(item.image_url || "");
    } else {
      setForm(EMPTY_FORM);
      setImagePreview("");
    }
    setError("");
  }, [isOpen, item, isEdit]);

  const set = <K extends keyof FormData>(key: K, val: FormData[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    setImageUploading(true);
    setError("");
    try {
      const url = await uploadMenuItemImage(file) as string;
      set("image_url", url);
      setImagePreview(url);
    } catch {
      setError("Image upload failed. Please try again.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    (e.target as HTMLElement).style.borderColor = "var(--t-accent)";
  };
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    (e.target as HTMLElement).style.borderColor = "";
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { setError("Item name is required."); return; }
    if (!form.price || parseFloat(String(form.price)) <= 0) { setError("Price must be greater than 0."); return; }
    if ((existingCategories ?? []).length > 0 && !form.category) { setError("Please select a category."); return; }
    if (form.has_variants) {
      if (form.variants.length === 0) { setError("Add at least one variant, or disable the Variants toggle."); return; }
      const invalid = form.variants.find((v) => !v.name.trim() || !v.price || parseFloat(String(v.price)) <= 0);
      if (invalid) { setError("Each variant must have a name and a price greater than 0."); return; }
    }

    const sharedGroupName = form.variants[0]?.groupName?.trim() || "";
    const payload = {
      ...form,
      price: parseFloat(String(form.price)),
      discount_percentage: Number(form.discount_percentage),
      gst_slab: Number(form.gst_slab),
      preparation_time: form.preparation_time !== "" ? Number(form.preparation_time) : undefined,
      serves: form.serves !== "" ? Number(form.serves) : undefined,
      display_order: form.display_order !== "" ? Number(form.display_order) : undefined,
      combo_discount: form.is_combo ? Number(form.combo_discount) : 0,
      ingredients: String(form.ingredients).split(",").map((s) => s.trim()).filter(Boolean),
      allergens: String(form.allergens).split(",").map((s) => s.trim()).filter(Boolean),
      tags: String(form.tags).split(",").map((s) => s.trim()).filter(Boolean),
      has_variants: form.has_variants,
      variants: form.has_variants
        ? form.variants.map((v) => ({
            groupName: v.groupName?.trim() || sharedGroupName,
            name: v.name.trim(),
            price: parseFloat(String(v.price)),
            isVeg: v.isVeg !== false,
            isDefault: v.isDefault ?? false,
            isAvailable: v.isAvailable !== false,
            discount_percentage: Number(v.discount_percentage) || 0,
          }))
        : [],
    };

    setSaving(true);
    setError("");
    try {
      const saved = isEdit && item
        ? await updateDashMenuItem(item._id, payload)
        : await createDashMenuItem(payload);
      onSave(saved);
    } catch {
      setError("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Product" : "Add Product"}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Core Details */}
        <div>
          <SectionLabel>Core Details</SectionLabel>
          <div className="space-y-3">
            <div>
              <FieldLabel>Name <span className="text-red-400">*</span></FieldLabel>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Paneer Tikka"
                className={inputCls}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Brief description shown to customers"
                className={`${inputCls} resize-none`}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Category</FieldLabel>
                {(existingCategories ?? []).length === 0 ? (
                  <p className="text-xs text-slate-300 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5">
                    No categories yet — use the <span className="text-white font-medium">Add Category</span> button first.
                  </p>
                ) : (
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                    className={`${inputCls} cursor-pointer`}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={{ background: "rgba(255,255,255,0.05)" }}
                  >
                    <option value="">Select a category…</option>
                    {(existingCategories ?? []).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <FieldLabel>Meal Tag</FieldLabel>
                <input
                  list="meal-tag-list"
                  type="text"
                  value={form.meal_tag}
                  onChange={(e) => set("meal_tag", e.target.value)}
                  placeholder="e.g. Lunch / Dinner"
                  className={inputCls}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                />
                <datalist id="meal-tag-list">
                  {MEAL_TAG_SUGGESTIONS.map((t) => (<option key={t} value={t} />))}
                </datalist>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Pricing */}
        <div>
          <SectionLabel>Pricing</SectionLabel>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <FieldLabel>Price (₹) <span className="text-red-400">*</span></FieldLabel>
              <input type="number" min="0" value={form.price} onChange={(e) => set("price", e.target.value)}
                placeholder="299" className={inputCls} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <FieldLabel>Discount %</FieldLabel>
              <input type="number" min="0" max="100" value={form.discount_percentage}
                onChange={(e) => set("discount_percentage", Math.min(100, Math.max(0, Number(e.target.value))))}
                className={inputCls} onFocus={handleFocus} onBlur={handleBlur} />
            </div>
            <div>
              <FieldLabel>GST Slab</FieldLabel>
              <select value={form.gst_slab} onChange={(e) => set("gst_slab", Number(e.target.value))}
                className={`${inputCls} cursor-pointer`} onFocus={handleFocus} onBlur={handleBlur}
                style={{ background: "rgba(255,255,255,0.05)" }}>
                {GST_OPTIONS.map((g) => (<option key={g} value={g}>{g}%</option>))}
              </select>
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Variants */}
        <div>
          <SectionLabel>Variants</SectionLabel>
          <div className="space-y-3">
            <Toggle
              checked={form.has_variants}
              onChange={(v) => set("has_variants", v)}
              label="This item has multiple variants (e.g. Veg / Chicken / Prawn)"
            />
            {form.has_variants && (
              <div className="space-y-3">
                <div>
                  <FieldLabel>Group Name <span className="text-slate-600">(applies to all variants)</span></FieldLabel>
                  <input
                    type="text"
                    value={form.variants[0]?.groupName ?? ""}
                    onChange={(e) => {
                      const gn = e.target.value;
                      set(
                        "variants",
                        form.variants.length > 0
                          ? form.variants.map((v) => ({ ...v, groupName: gn }))
                          : [{ ...EMPTY_VARIANT, groupName: gn }],
                      );
                    }}
                    placeholder="e.g. Protein, Size, Sauce"
                    className={inputCls}
                    onFocus={(e) => (e.target.style.borderColor = "var(--t-accent)")}
                    onBlur={(e) => (e.target.style.borderColor = "")}
                  />
                  <p className="text-[10px] text-slate-600 mt-1">Shown to customers as "Protein: Chicken", "Size: Large" etc.</p>
                </div>

                {form.variants.length > 0 && (
                  <div className="flex items-center gap-2 px-2 select-none">
                    <span className="w-5 shrink-0" />
                    <span className="flex-1 text-[10px] font-semibold uppercase tracking-widest text-slate-600">Variant Name</span>
                    <span className="w-20 text-[10px] font-semibold uppercase tracking-widest text-slate-600 text-right shrink-0">Price</span>
                    <span className="w-16 text-[10px] font-semibold uppercase tracking-widest text-slate-600 text-center shrink-0">Discount</span>
                    <span className="w-6 shrink-0" />
                  </div>
                )}

                {form.variants.map((variant, idx) => (
                  <VariantRow
                    key={idx}
                    index={idx}
                    variant={variant}
                    isDefault={variant.isDefault === true}
                    onChange={(updated) => {
                      const next = [...form.variants];
                      next[idx] = { ...updated, groupName: form.variants[0]?.groupName ?? "" };
                      set("variants", next);
                    }}
                    onRemove={() => set("variants", form.variants.filter((_, i) => i !== idx))}
                    onSetDefault={() =>
                      set("variants", form.variants.map((v, i) => ({ ...v, isDefault: i === idx })))
                    }
                  />
                ))}

                <button
                  type="button"
                  onClick={() =>
                    set("variants", [
                      ...form.variants,
                      { ...EMPTY_VARIANT, groupName: form.variants[0]?.groupName ?? "" },
                    ])
                  }
                  className="w-full py-2 rounded-xl text-xs font-semibold border border-dashed transition-all hover:border-white/20"
                  style={{ borderColor: "rgba(255,255,255,0.1)", color: "var(--t-dim)", background: "rgba(255,255,255,0.02)" }}
                >
                  + Add Variant
                </button>
              </div>
            )}
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Properties */}
        <div>
          <SectionLabel>Properties</SectionLabel>
          <div className="space-y-3">
            <div className="flex items-center gap-6 flex-wrap">
              <Toggle
                checked={form.is_veg}
                onChange={(v) => set("is_veg", v)}
                label={form.is_veg ? "🟢 Vegetarian" : "🔴 Non-Vegetarian"}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Spice Level</FieldLabel>
                <div className="flex gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => set("spice_level", n)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all border ${
                        form.spice_level === n
                          ? "text-white border-transparent"
                          : "text-slate-400 border-white/10 hover:border-white/20 bg-white/5"
                      }`}
                      style={form.spice_level === n ? { background: "var(--t-accent)", borderColor: "var(--t-accent)" } : {}}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-slate-600 mt-1">0 = No spice · 5 = Extra hot</p>
              </div>
              <div>
                <FieldLabel>Taste Profile</FieldLabel>
                <select value={form.taste_profile} onChange={(e) => set("taste_profile", e.target.value)}
                  className={`${inputCls} cursor-pointer`} onFocus={handleFocus} onBlur={handleBlur}
                  style={{ background: "rgba(255,255,255,0.05)" }}>
                  {TASTE_OPTIONS.map((t) => (<option key={t} value={t}>{t}</option>))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Preparation Time <span className="text-slate-600">(minutes)</span></FieldLabel>
                <input type="number" min="0" value={form.preparation_time} onChange={(e) => set("preparation_time", e.target.value)}
                  placeholder="15" className={inputCls} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
              <div>
                <FieldLabel>Serves</FieldLabel>
                <input type="number" min="1" value={form.serves} onChange={(e) => set("serves", e.target.value)}
                  placeholder="1" className={inputCls} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Status Flags */}
        <div>
          <SectionLabel>Status</SectionLabel>
          <div className="grid grid-cols-2 gap-3">
            <Toggle checked={form.is_available} onChange={(v) => set("is_available", v)} label="Available to order" />
            <Toggle checked={form.stock_status} onChange={(v) => set("stock_status", v)} label="In stock" />
            <Toggle checked={form.is_chefs_special} onChange={(v) => set("is_chefs_special", v)} label="Chef's Special" />
            <Toggle checked={form.is_featured} onChange={(v) => set("is_featured", v)} label="Featured" />
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Ingredients & Allergens */}
        <div>
          <SectionLabel>Ingredients &amp; Allergens</SectionLabel>
          <div className="space-y-3">
            <div>
              <FieldLabel>Ingredients</FieldLabel>
              <textarea rows={2} value={form.ingredients} onChange={(e) => set("ingredients", e.target.value)}
                placeholder="Paneer, tomato, bell peppers, tandoori masala, yogurt"
                className={`${inputCls} resize-none`} onFocus={handleFocus} onBlur={handleBlur} />
              <p className="text-[10px] text-slate-600 mt-1">Comma-separated list of key ingredients</p>
            </div>
            <div>
              <FieldLabel>Allergens</FieldLabel>
              <input type="text" value={form.allergens} onChange={(e) => set("allergens", e.target.value)}
                placeholder="Dairy, Gluten, Nuts" className={inputCls} onFocus={handleFocus} onBlur={handleBlur} />
              <p className="text-[10px] text-slate-600 mt-1">Comma-separated allergen list</p>
            </div>
            <div>
              <FieldLabel>Tags</FieldLabel>
              <input type="text" value={form.tags} onChange={(e) => set("tags", e.target.value)}
                placeholder="bestseller, spicy, quick" className={inputCls} onFocus={handleFocus} onBlur={handleBlur} />
              <p className="text-[10px] text-slate-600 mt-1">Comma-separated labels for filtering</p>
            </div>
          </div>
        </div>

        <hr className="border-white/5" />

        {/* Media & Display */}
        <div>
          <SectionLabel>Media &amp; Display</SectionLabel>
          <div className="space-y-3">
            <div>
              <FieldLabel>Image</FieldLabel>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleImageFile(e.target.files?.[0])}
              />
              {imagePreview ? (
                <div className="flex items-center gap-3">
                  <img src={imagePreview} alt="Preview" className="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0" />
                  <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                    <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-all disabled:opacity-50">
                      {imageUploading ? "Uploading…" : "Change image"}
                    </button>
                    <button type="button"
                      onClick={() => { set("image_url", ""); setImagePreview(""); }}
                      className="text-xs text-slate-600 hover:text-red-400 transition-colors text-left">
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={imageUploading}
                  className="w-full flex flex-col items-center justify-center gap-2 py-6 rounded-xl border border-dashed border-white/15 bg-white/3 hover:bg-white/5 hover:border-white/25 transition-all disabled:opacity-50">
                  {imageUploading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span className="text-xs text-slate-300">Uploading…</span>
                    </>
                  ) : (
                    <>
                      <span className="text-xl">📷</span>
                      <span className="text-xs text-slate-400">Click to upload image</span>
                      <span className="text-[10px] text-slate-600">JPG, PNG, WEBP — max 5 MB</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div>
                <FieldLabel>Display Order</FieldLabel>
                <input type="number" min="0" value={form.display_order} onChange={(e) => set("display_order", e.target.value)}
                  placeholder="0" className={inputCls} onFocus={handleFocus} onBlur={handleBlur} />
                <p className="text-[10px] text-slate-600 mt-1">Lower number = shown first</p>
              </div>
              <div className="pb-1">
                <Toggle checked={form.is_combo} onChange={(v) => set("is_combo", v)} label="Combo item" />
              </div>
            </div>
            {form.is_combo && (
              <div>
                <FieldLabel>Combo Discount %</FieldLabel>
                <input type="number" min="0" max="100" value={form.combo_discount}
                  onChange={(e) => set("combo_discount", Math.min(100, Math.max(0, Number(e.target.value))))}
                  className={inputCls} onFocus={handleFocus} onBlur={handleBlur} />
              </div>
            )}
          </div>
        </div>

        {/* Error + Actions */}
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button type="button" onClick={onClose} disabled={saving}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} disabled={saving || imageUploading}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
            style={{ background: "var(--t-accent)" }}>
            {saving && (<span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />)}
            {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Product"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
