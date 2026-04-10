import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import Modal from '../ui/Modal';
import { bulkImportMenuItems } from '../../services/adminService';

const CSV_HEADERS = 'name,description,price,discount_percentage,category,spice_level,is_veg,stock_status,is_available,is_chefs_special,is_featured,image_url,taste_profile,ingredients,gst_slab,meal_tag,tags,allergens,preparation_time,serves,display_order';

const CSV_EXAMPLE_ROWS = [
  'Paneer Tikka,Marinated cottage cheese grilled in a clay oven,299,0,Starters,2,true,true,true,false,false,https://example.com/paneer-tikka.jpg,Savory,"Paneer, Tandoori masala, Bell peppers",5,Dinner,"tandoori, veg","Dairy",10,2,1',
  'Chicken Wings,Crispy fried wings tossed in smoky hot sauce,349,10,Starters,3,false,true,true,true,false,https://example.com/wings.jpg,Spicy,"Chicken, Hot sauce, Garlic",18,All Day,"chicken, snack",None,12,2,2',
];

const FIELD_GUIDE = [
  { col: 'name',                req: true,  note: 'Item name. Required.' },
  { col: 'description',         req: false, note: 'Short description shown to customers.' },
  { col: 'price',               req: true,  note: 'Selling price in ₹. Must be > 0.' },
  { col: 'discount_percentage', req: false, note: 'Number 0–100. Leave 0 for no discount.' },
  { col: 'category',            req: false, note: 'e.g. Starters, Main Course, Dessert. New categories are created automatically.' },
  { col: 'spice_level',         req: false, note: 'Integer 0–5. 0 = no spice, 5 = extra hot.' },
  { col: 'is_veg',              req: false, note: 'true or false.' },
  { col: 'stock_status',        req: false, note: 'true or false. Defaults to true.' },
  { col: 'is_available',        req: false, note: 'true or false. Defaults to true.' },
  { col: 'is_chefs_special',    req: false, note: 'true or false.' },
  { col: 'is_featured',         req: false, note: 'true or false.' },
  { col: 'image_url',           req: false, note: 'Full URL to item image.' },
  { col: 'taste_profile',       req: false, note: 'Savory / Sweet / Spicy / Tangy / Mild / Bitter.' },
  { col: 'ingredients',         req: false, note: 'Comma-separated. Wrap in quotes if any ingredient contains a comma: "Paneer, Masala"' },
  { col: 'gst_slab',            req: false, note: 'One of: 0, 5, 12, 18, 28.' },
  { col: 'meal_tag',            req: false, note: 'e.g. Breakfast, Lunch / Dinner, All Day.' },
  { col: 'tags',                req: false, note: 'Comma-separated labels. Wrap in quotes: "bestseller, veg"' },
  { col: 'allergens',           req: false, note: 'Comma-separated. e.g. Dairy, Gluten, Nuts.' },
  { col: 'preparation_time',    req: false, note: 'Minutes as a number.' },
  { col: 'serves',              req: false, note: 'Number of people it serves.' },
  { col: 'display_order',       req: false, note: 'Lower number = shown first in category.' },
];

// Minimal RFC4180-compatible CSV line parser
function parseCSVLine(line) {
  const result = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

function parseCSV(text) {
  const lines = text.trim().split('\n').filter(Boolean);
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const vals = parseCSVLine(line);
    const obj = {};
    headers.forEach((h, i) => { obj[h] = (vals[i] ?? '').trim(); });
    return obj;
  });
  return { headers, rows };
}

function downloadSampleCSV() {
  const content = [CSV_HEADERS, ...CSV_EXAMPLE_ROWS].join('\n');
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'menu_sample.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function downloadCategoriesCSV(categories) {
  const lines = ['category_name', ...categories].join('\n');
  const blob = new Blob([lines], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'valid_categories.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function BulkUploadModal({ isOpen, onClose, onImport, categories = [] }) {
  const [csvText, setCsvText]         = useState('');
  const [menuRows, setMenuRows]       = useState([]);   // 2-sheet: Menu Items rows
  const [variantRows, setVariantRows] = useState([]);   // 2-sheet: Item Variants rows
  const [fileName, setFileName]       = useState('');
  const [preview, setPreview]         = useState([]);
  const [rowCount, setRowCount]       = useState(0);
  const [fileError, setFileError]     = useState('');
  const [importing, setImporting]     = useState(false);
  const [result, setResult]           = useState(null);
  const [dragOver, setDragOver]       = useState(false);
  const [isTwoSheet, setIsTwoSheet]   = useState(false);
  const fileInputRef = useRef(null);

  const reset = () => {
    setCsvText('');
    setMenuRows([]);
    setVariantRows([]);
    setFileName('');
    setPreview([]);
    setRowCount(0);
    setFileError('');
    setResult(null);
    setIsTwoSheet(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const processFile = async (file) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    const allowed = ['csv', 'xlsx', 'xls'];
    if (!allowed.includes(ext)) {
      setFileError('Unsupported file type. Please upload a .csv or .xlsx file.');
      return;
    }

    setFileError('');
    setResult(null);

    try {
      if (ext === 'xlsx' || ext === 'xls') {
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });
        const hasVariantsSheet = workbook.SheetNames.includes('Item Variants');

        if (hasVariantsSheet) {
          // New 2-sheet variant-aware format
          const mRows = XLSX.utils.sheet_to_json(workbook.Sheets['Menu Items'] || workbook.Sheets[workbook.SheetNames[0]]);
          const vRows = XLSX.utils.sheet_to_json(workbook.Sheets['Item Variants']);
          if (mRows.length === 0) {
            setFileError('No items found in the "Menu Items" sheet.');
            return;
          }
          setMenuRows(mRows);
          setVariantRows(vRows);
          setIsTwoSheet(true);
          setFileName(file.name);
          setRowCount(mRows.length);
          const prev = mRows.slice(0, 3).map(r => ({
            name:     (r['Item Name'] || '').trim(),
            category: (r['Category']  || '').trim(),
            price:    r['Has Variants?'] === 'Yes' ? 'Variants' : String(r['Price (₹)'] ?? ''),
            is_veg:   r['Has Variants?'] === 'Yes' ? 'mixed' : '',
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
          setFileError('No data rows found. Make sure the file has at least one row below the header.');
          return;
        }
        // Validate categories if a restricted list exists
        if (categories.length > 0) {
          const validSet = new Set(categories.map(c => c.toLowerCase().trim()));
          const badRows = rows
            .map((r, i) => ({ row: i + 2, cat: r.category ?? '' }))
            .filter(({ cat }) => cat && !validSet.has(cat.toLowerCase().trim()));
          if (badRows.length > 0) {
            const sample = badRows.slice(0, 3).map(b => `row ${b.row} ("${b.cat}")`).join(', ');
            setFileError(`Invalid category in ${badRows.length} row${badRows.length > 1 ? 's' : ''}: ${sample}. Use "Download Categories" to see valid values.`);
            return;
          }
        }
        setCsvText(text);
        setFileName(file.name);
        setRowCount(rows.length);
        setPreview(rows.slice(0, 3));
      }
    } catch {
      setFileError('Could not read the file. Please check it is not corrupted.');
    }
  };

  const handleFileChange = (e) => {
    reset();
    processFile(e.target.files?.[0]);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    reset();
    processFile(e.dataTransfer.files?.[0]);
  };

  const canImport = isTwoSheet ? menuRows.length > 0 : !!csvText;

  const handleImport = async () => {
    if (!canImport) return;
    setImporting(true);
    try {
      const res = isTwoSheet
        ? await bulkImportMenuItems(null, menuRows, variantRows)
        : await bulkImportMenuItems(csvText);
      setResult(res);
      if (res.imported > 0) {
        onImport();
      }
    } catch {
      setFileError('Import failed. Please try again.');
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
          <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
            <div>
              <p className="text-sm text-white font-medium">Sample CSV Template</p>
              <p className="text-xs text-slate-500 mt-0.5">Pre-defined headers — just fill in your data</p>
            </div>
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all shrink-0"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download
            </button>
          </div>

          {categories.length > 0 && (
            <div className="flex items-center justify-between bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm text-white font-medium">Valid Categories</p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {categories.length} categor{categories.length === 1 ? 'y' : 'ies'} — the <span className="font-mono text-slate-400">category</span> column must use these exact names
                </p>
              </div>
              <button
                onClick={() => downloadCategoriesCSV(categories)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all shrink-0"
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
              <p className="text-xs text-yellow-400">No categories created yet. Use the <span className="font-medium">Add Category</span> button before bulk importing, or leave the category column blank.</p>
            </div>
          )}
        </div>

        {/* Column guide */}
        <details className="group">
          <summary className="text-xs font-semibold text-slate-400 cursor-pointer select-none flex items-center gap-1.5 hover:text-slate-200 transition-colors">
            <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
            Column format guide
          </summary>
          <div className="mt-3 rounded-xl border border-white/10 overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase tracking-wider">
                  <th className="text-left px-3 py-2 w-44">Column</th>
                  <th className="text-left px-3 py-2 w-16">Required</th>
                  <th className="text-left px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {FIELD_GUIDE.map((f, i) => (
                  <tr key={f.col} className={i < FIELD_GUIDE.length - 1 ? 'border-b border-white/5' : ''}>
                    <td className="px-3 py-2 font-mono text-slate-300">{f.col}</td>
                    <td className="px-3 py-2">
                      {f.req
                        ? <span className="text-red-400 font-semibold">Yes</span>
                        : <span className="text-slate-600">No</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-slate-400">{f.note}</td>
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
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-2xl p-8 cursor-pointer text-center transition-all ${
              dragOver
                ? 'border-[var(--t-accent)] bg-[var(--t-accent)]/5'
                : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            {fileName ? (
              <div className="space-y-1">
                <p className="text-2xl">📄</p>
                <p className="text-white text-sm font-medium">{fileName}</p>
                <p className="text-slate-500 text-xs">{rowCount} data row{rowCount !== 1 ? 's' : ''} found · Click to replace</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-3xl">📂</p>
                <p className="text-slate-300 text-sm font-medium">Drop your CSV or Excel file here</p>
                <p className="text-slate-600 text-xs">or click to browse · .csv, .xlsx, .xls supported</p>
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
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
              Preview — first {preview.length} row{preview.length !== 1 ? 's' : ''}
            </p>
            <div className="rounded-xl border border-white/10 overflow-x-auto">
              <table className="text-xs whitespace-nowrap">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase">
                    <th className="text-left px-3 py-2">Name</th>
                    <th className="text-left px-3 py-2">Category</th>
                    <th className="text-left px-3 py-2">Price</th>
                    <th className="text-left px-3 py-2">Veg</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className={i < preview.length - 1 ? 'border-b border-white/5' : ''}>
                      <td className="px-3 py-2 text-white">{row.name || '—'}</td>
                      <td className="px-3 py-2 text-slate-400">{row.category || '—'}</td>
                      <td className="px-3 py-2 text-slate-400">{row.price ? (row.price === 'Variants' ? row.price : `₹${row.price}`) : '—'}</td>
                      <td className="px-3 py-2">
                        {row.is_veg === 'mixed' ? '🟡' : row.is_veg === 'true' ? '🟢' : row.is_veg === 'false' ? '🔴' : '⚪'}
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
          <div className={`rounded-xl border px-4 py-4 ${result.imported > 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-yellow-500/10 border-yellow-500/20'}`}>
            {result.imported > 0 ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl">✅</span>
                <div>
                  <p className="text-sm font-semibold text-white">{result.imported} item{result.imported !== 1 ? 's' : ''} imported successfully</p>
                  {result.errors.length > 0 && (
                    <p className="text-xs text-yellow-400 mt-0.5">{result.errors.length} row{result.errors.length !== 1 ? 's' : ''} had errors and were skipped</p>
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
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 transition-all disabled:opacity-50"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              type="button"
              onClick={handleImport}
              disabled={!canImport || importing}
              className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: 'var(--t-accent)' }}
            >
              {importing && (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              {importing ? 'Importing…' : `Import ${rowCount > 0 ? rowCount + ' ' : ''}Item${rowCount !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>

      </div>
    </Modal>
  );
}
