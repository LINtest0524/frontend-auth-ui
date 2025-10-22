// frontend/src/lib/csv.ts
export function toCsv<T extends Record<string, any>>(rows: T[], headers?: string[]): string {
  if (!rows?.length) return '';
  
  const cols = headers && headers.length ? headers : Object.keys(rows[0]);
  
  const escape = (v: any) => {
    const s = v === null || v === undefined ? '' : String(v);
    // 若包含逗號/引號/換行，就以雙引號包裹並跳脫引號
    const needQuote = /[",\n\r]/.test(s);
    return needQuote ? `"${s.replace(/"/g, '""')}"` : s;
  };
  
  const head = cols.map(escape).join(',');
  const body = rows.map(r => cols.map(c => escape(r[c])).join(',')).join('\n');
  
  return `${head}\n${body}`;
}

export function downloadCsv(filename: string, csv: string) {
  // 加上 UTF-8 BOM 確保中文顯示正確
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// 格式化日期時間的工具函數
export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  } catch (e) {
    return dateStr;
  }
}