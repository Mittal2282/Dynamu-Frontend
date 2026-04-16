import * as XLSX from 'xlsx';

export const todayStr = () => new Date().toISOString().split('T')[0];

export function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function fmtTime(d) {
  if (!d) return '';
  return new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function fmtCurrency(n) {
  if (n == null) return '—';
  return `₹${Math.round(n).toLocaleString('en-IN')}`;
}

export function downloadSampleSheet() {
  const ws = XLSX.utils.aoa_to_sheet([
    ['Item Name', 'Variant Name', 'Quantity', 'Special Instructions'],
    ['Butter Chicken', '', '2', 'Less spicy'],
    ['Biryani', 'Chicken', '1', ''],
    ['Margherita Pizza', 'Large', '1', 'Extra cheese'],
  ]);
  ws['!cols'] = [{ wch: 24 }, { wch: 16 }, { wch: 10 }, { wch: 28 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Orders Template');
  XLSX.writeFile(wb, 'dynamu_orders_template.xlsx');
}
