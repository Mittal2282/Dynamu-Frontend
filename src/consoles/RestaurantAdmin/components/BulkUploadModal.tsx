import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import Modal from "../../../components/ui/Modal";
import { bulkImportMenuItems } from "../../../services/dashboardService";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImportResult {
  imported: number;
  errors: Array<unknown>;
}

interface PreviewRow {
  name?: string;
  category?: string;
  price?: string | number;
  is_veg?: string;
}

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: () => void;
  categories?: string[];
}

// ── Constants ─────────────────────────────────────────────────────────────────

const CSV_HEADERS =
  "name,description,price,discount_percentage,category,spice_level,is_veg,stock_status,is_available,is_chefs_special,is_featured,image_url,taste_profile,ingredients,gst_slab,meal_tag,tags,allergens,preparation_time,serves,display_order";

const CSV_EXAMPLE_ROWS = [
  'Paneer Tikka,Marinated cottage cheese grilled in a clay oven,299,0,Starters,2,true,true,true,false,false,https://example.com/paneer-tikka.jpg,Savory,"Paneer, Tandoori masala, Bell peppers",5,Dinner,"tandoori, veg","Dairy",10,2,1',
  'Chicken Wings,Crispy fried wings tossed in smoky hot sauce,349,10,Starters,3,false,true,true,true,false,https://example.com/wings.jpg,Spicy,"Chicken, Hot sauce, Garlic",18,All Day,"chicken, snack",None,12,2,2',
];

const FIELD_GUIDE: Array<{ col: string; req: boolean; note: string }> = [
  { col: "name", req: true, note: "Item name. Required." },
  { col: "description", req: false, note: "Short description shown to customers." },
  { col: "price", req: true, note: "Selling price in ₹. Must be > 0." },
  { col: "discount_percentage", req: false, note: "Number 0–100. Leave 0 for no discount." },
  { col: "category", req: false, note: "e.g. Starters, Main Course, Dessert. New categories are created automatically." },
  { col: "spice_level", req: false, note: "Integer 0–5. 0 = no spice, 5 = extra hot." },
  { col: "is_veg", req: false, note: "true or false." },
  { col: "stock_status", req: false, note: "true or false. Defaults to true." },
  { col: "is_available", req: false, note: "true or false. Defaults to true." },
  { col: "is_chefs_special", req: false, note: "true or false." },
  { col: "is_featured", req: false, note: "true or false." },
  { col: "image_url", req: false, note: "Full URL to item image." },
  { col: "taste_profile", req: false, note: "Savory / Sweet / Spicy / Tangy / Mild / Bitter." },
  { col: "ingredients", req: false, note: 'Comma-separated. Wrap in quotes if any ingredient contains a comma: "Paneer, Masala"' },
  { col: "gst_slab", req: false, note: "One of: 0, 5, 12, 18, 28." },
  { col: "meal_tag", req: false, note: "e.g. Breakfast, Lunch / Dinner, All Day." },
  { col: "tags", req: false, note: 'Comma-separated labels. Wrap in quotes: "bestseller, veg"' },
  { col: "allergens", req: false, note: "Comma-separated. e.g. Dairy, Gluten, Nuts." },
  { col: "preparation_time", req: false, note: "Minutes as a number." },
  { col: "serves", req: false, note: "Number of people it serves." },
  { col: "display_order", req: false, note: "Lower number = shown first in category." },
];

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseCSV(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.trim().split("\n").filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map((h) => h.trim());
  const rows = lines.slice(1).map((line) => {
    const vals = parseCSVLine(line);
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (vals[i] ?? "").trim();
    });
    return obj;
  });
  return { headers, rows };
}

function downloadSampleCSV(): void {
  const content = [CSV_HEADERS, ...CSV_EXAMPLE_ROWS].join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a") as HTMLAnchorElement;
  a.href = url;
  a.download = "menu_sample.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCategoriesCSV(categories: string[]): void {
  const lines = ["category_name", ...categories].join("\n");
  const blob = new Blob([lines], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a") as HTMLAnchorElement;
  a.href = url;
  a.download = "valid_categories.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BulkUploadModal({ isOpen, onClose, onImport, categories = [] }: BulkUploadModalProps) {
  const [csvText, setCsvText] = useState("");
  const [menuRows, setMenuRows] = useState<Record<string, unknown>[]>([]);
  const [variantRows, setVariantRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [fileError, setFileError] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [isTwoSheet, setIsTwoSheet] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setCsvText("");
    setMenuRows([]);
    setVariantRows([]);
    setFileName("");
    setPreview([]);
    setRowCount(0);
    setFileError("");
    setResult(null);
    setIsTwoSheet(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = async (file: File) => {
    if (!file) return;
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["csv", "xlsx", "xls"];
    if (!allowed.includes(ext)) {
      setFileError("Unsupported file type. Please upload a .csv or .xlsx file.");
      return;
    }

    setFileError("");
    setResult(null);

    try {
      if (ext === "xlsx" || ext === "xls") {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const hasVariantsSheet = workbook.SheetNames.includes("Item Variants");

        if (hasVariantsSheet) {
          const mRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
            workbook.Sheets["Menu Items"] || workbook.Sheets[workbook.SheetNames[0]],
          );
          const vRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets["Item Variants"]);
          if (mRows.length === 0) {
            setFileError('No items found in the "Menu Items" sheet.');
            return;
          }
          setMenuRows(mRows);
          setVariantRows(vRows);
          setIsTwoSheet(true);
          setFileName(file.name);
          setRowCount(mRows.length);
          const prev: PreviewRow[] = mRows.slice(0, 3).map((r) => ({
            name: String(r["Item Name"] ?? "").trim(),
            category: String(r["Category"] ?? "").trim(),
            price: r["Has Variants?"] === "Yes" ? "Variants" : String(r["Price (₹)"] ?? ""),
            is_veg: r["Has Variants?"] === "Yes" ? "mixed" : "",
          }));
          setPreview(prev);
          return;
        }

        // Single-sheet XLSX → CSV path
        const text = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
        setCsvText(text);
        setFileName(file.name);
        const { rows } = parseCSV(text);
        setRowCount(rows.length);
        setPreview(rows.slice(0, 3));
      } else {
        const text = await file.text();
        const { rows } = parseCSV(text);
        if (rows.length === 0) {
          setFileError("No data rows found. Make sure the file has at least one row below the header.");
          return;
        }
        if (categories.length > 0) {
          const validSet = new Set(categories.map((c) => c.toLowerCase().trim()));
          const badRows = rows
            .map((r, i) => ({ row: i + 2, cat: r.category ?? "" }))
            .filter(({ cat }) => cat && !validSet.has(cat.toLowerCase().trim()));
          if (badRows.length > 0) {
            const sample = badRows.slice(0, 3).map((b) => `row ${b.row} ("${b.cat}")`).join(", ");
            setFileError(
              `Invalid category in ${badRows.length} row${badRows.length > 1 ? "s" : ""}: ${sample}. Use "Download Categories" to see valid values.`,
            );
            return;
          }
        }
        setCsvText(text);
        setFileName(file.name);
        setRowCount(rows.length);
        setPreview(rows.slice(0, 3));
      }
    } catch {
      setFileError("Could not read the file. Please check it is not corrupted.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    reset();
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragOver(false);
    reset();
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const canImport = isTwoSheet ? menuRows.length > 0 : !!csvText;

  const handleImport = async () => {
    if (!canImport) return;
    setImporting(true);
    try {
      const res = isTwoSheet
        ? await bulkImportMenuItems(null, menuRows, variantRows) as ImportResult
        : await bulkImportMenuItems(csvText) as ImportResult;
      setResult(res);
      if (res.imported > 0) {
        onImport();
      }
    } catch {
      setFileError("Import failed. Please try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Import Menu Items"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-5">
        {/* Downloads row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--t-float)', border: '1px solid var(--t-line)' }}>
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>Sample CSV Template</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--t-dim)' }}>Pre-defined headers — just fill in your data</p>
            </div>
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
              style={{ color: 'var(--t-text)', background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center justify-between rounded-xl px-4 py-3" style={{ background: 'var(--t-float)', border: '1px solid var(--t-line)' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>Valid Categories</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--t-dim)' }}>
                  {categories.length} categor{categories.length === 1 ? "y" : "ies"} — the{" "}
                  <span className="font-mono" style={{ color: 'var(--t-dim)' }}>category</span> column must use these exact names
                </p>
              </div>
              <button
                onClick={() => downloadCategoriesCSV(categories)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0"
                style={{ color: 'var(--t-text)', background: 'var(--t-surface)', border: '1px solid var(--t-line)' }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Download
              </button>
            </div>
          )}

          {categories.length === 0 && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
              <p className="text-xs text-yellow-400">
                No categories created yet. Use the <span className="font-medium">Add Category</span>{" "}
                button before bulk importing, or leave the category column blank.
              </p>
            </div>
          )}
        </div>

        {/* Column guide */}
        <details className="group">
          <summary className="text-xs font-semibold cursor-pointer select-none flex items-center gap-1.5 transition-colors" style={{ color: 'var(--t-dim)' }}>
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Column format guide
          </summary>
          <div className="mt-3 rounded-xl overflow-hidden" style={{ border: '1px solid var(--t-line)' }}>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider" style={{ borderBottom: '1px solid var(--t-line)', color: 'var(--t-dim)' }}>
                  <th className="text-left px-3 py-2 w-44">Column</th>
                  <th className="text-left px-3 py-2 w-16">Required</th>
                  <th className="text-left px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {FIELD_GUIDE.map((f, i) => (
                  <tr key={f.col} style={i < FIELD_GUIDE.length - 1 ? { borderBottom: '1px solid var(--t-line)' } : {}}>
                    <td className="px-3 py-2 font-mono" style={{ color: 'var(--t-text)' }}>{f.col}</td>
                    <td className="px-3 py-2">
                      {f.req ? (
                        <span className="text-red-400 font-semibold">Yes</span>
                      ) : (
                        <span style={{ color: 'var(--t-dim)', opacity: 0.6 }}>No</span>
                      )}
                    </td>
                    <td className="px-3 py-2" style={{ color: 'var(--t-dim)' }}>{f.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>

        {/* Drop zone */}
        {!result && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className="border-2 border-dashed rounded-2xl p-8 cursor-pointer text-center transition-all"
            style={{
              borderColor: dragOver ? 'var(--t-accent)' : 'var(--t-line)',
              background: dragOver ? 'color-mix(in srgb, var(--t-accent) 5%, transparent)' : 'var(--t-float)',
            }}
          >
            {fileName ? (
              <div className="space-y-1">
                <p className="text-2xl">📄</p>
                <p className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{fileName}</p>
                <p className="text-xs" style={{ color: 'var(--t-dim)' }}>
                  {rowCount} data row{rowCount !== 1 ? "s" : ""} found · Click to replace
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-3xl">📂</p>
                <p className="text-sm font-medium" style={{ color: 'var(--t-dim)' }}>Drop your CSV or Excel file here</p>
                <p className="text-xs" style={{ color: 'var(--t-dim)', opacity: 0.6 }}>or click to browse · .csv, .xlsx, .xls supported</p>
              </div>
            )}
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* File error */}
        {fileError && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            {fileError}
          </p>
        )}

        {/* Preview table */}
        {preview.length > 0 && !result && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--t-dim)' }}>
              Preview — first {preview.length} row{preview.length !== 1 ? "s" : ""}
            </p>
            <div className="rounded-xl overflow-x-auto" style={{ border: '1px solid var(--t-line)' }}>
              <table className="text-xs whitespace-nowrap">
                <thead>
                  <tr className="text-[10px] uppercase" style={{ borderBottom: '1px solid var(--t-line)', color: 'var(--t-dim)' }}>
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Category</th>
                    <th className="text-left px-3 py-2">Price</th>
                    <th className="text-left px-3 py-2">Veg</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} style={i < preview.length - 1 ? { borderBottom: '1px solid var(--t-line)' } : {}}>
                      <td className="px-3 py-2" style={{ color: 'var(--t-text)' }}>{row.name || "—"}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--t-dim)' }}>{row.category || "—"}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--t-dim)' }}>
                        {row.price ? (row.price === "Variants" ? row.price : `₹${row.price}`) : "—"}
                      </td>
                      <td className="px-3 py-2">
                        {row.is_veg === "mixed"
                          ? "🟡"
                          : row.is_veg === "true"
                            ? "🟢"
                            : row.is_veg === "false"
                              ? "🔴"
                              : "⚪"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Import result */}
        {result && (
          <div className={`rounded-xl border px-4 py-4 ${result.imported > 0 ? "bg-green-500/10 border-green-500/20" : "bg-yellow-500/10 border-yellow-500/20"}`}>
            {result.imported > 0 ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>
                    {result.imported} item{result.imported !== 1 ? "s" : ""} imported successfully
                  </p>
                  {result.errors.length > 0 && (
                    <p className="text-xs text-yellow-400 mt-0.5">
                      {result.errors.length} row{result.errors.length !== 1 ? "s" : ""} had errors and were skipped
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-sm text-yellow-400">No items were imported. Check the file format and try again.</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={handleClose}
            disabled={importing}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
            style={{ color: 'var(--t-dim)', background: 'var(--t-float)', border: '1px solid var(--t-line)' }}
          >
            {result ? "Close" : "Cancel"}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleImport}
              disabled={!canImport || importing}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: "var(--t-accent)" }}
            >
              {importing && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {importing
                ? "Importing…"
                : `Import ${rowCount > 0 ? rowCount + " " : ""}Item${rowCount !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
}
