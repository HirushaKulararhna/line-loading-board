// Turns raw rows (from Excel or Google Sheets) into a model, and does the machine maths
// that your Excel "Summary" tab does with LET/XLOOKUP.
export const WD = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const pad = n => String(n).padStart(2, '0');
export const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const dt = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
export const norm = s => String(s).trim().toLowerCase();
export const sumM = o => Object.values(o).reduce((a, b) => a + b, 0);
export const fmtDay = s => { const d = dt(s); return `${d.getDate()} ${MON[d.getMonth()]}`; };
export const hue = k => { let h = 0; for (const c of norm(k)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
export const todayStr = () => ymd(new Date());
const cellStr = v => (v == null ? '' : typeof v === 'number' ? String(v) : String(v).trim());

export function parseCSV(t) {
  const rows = []; let r = [], c = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { r.push(c); c = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && t[i + 1] === '\n') i++; r.push(c); rows.push(r); r = []; c = ''; }
    else c += ch;
  }
  if (c !== '' || r.length) { r.push(c); rows.push(r); }
  return rows;
}

export function toDate(v) {
  if (v == null || v === '') return null;
  if (v instanceof Date) return ymd(v);
  if (typeof v === 'number' && v > 30000 && v < 80000) {
    const d = new Date(Date.UTC(1899, 11, 30) + v * 864e5);
    return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
  }
  const s = String(v).trim(); let m;
  if ((m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/))) return `${m[1]}-${pad(+m[2])}-${pad(+m[3])}`;
  if ((m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/))) { let y = +m[3]; if (y < 100) y += 2000; return `${y}-${pad(+m[1])}-${pad(+m[2])}`; }
  if ((m = s.match(/^(\d{1,2})[ -]([A-Za-z]{3})[a-z]*[ -,]*(\d{2,4})?$/))) {
    const mi = MON.findIndex(x => x.toLowerCase() === m[2].toLowerCase());
    if (mi >= 0) { let y = m[3] ? +m[3] : new Date().getFullYear(); if (y < 100) y += 2000; return `${y}-${pad(mi + 1)}-${pad(+m[1])}`; }
  }
  const p = Date.parse(s); if (!isNaN(p) && /\d{4}/.test(s)) return ymd(new Date(p));
  return null;
}

export function buildModel(layoutRows, planRows, invRows, source) {
  const hi = layoutRows.findIndex(r => r.some(c => norm(cellStr(c)) === 'product'));
  if (hi < 0) throw new Error('Layout tab: could not find a header row with "Product".');
  const hdr = layoutRows[hi], pc = hdr.findIndex(c => norm(cellStr(c)) === 'product');
  let endc = hdr.findIndex(c => norm(cellStr(c)) === 'total machine'); if (endc < 0) endc = hdr.length;
  const machCols = []; for (let c = pc + 2; c < endc; c++) { const n = cellStr(hdr[c]); if (n) machCols.push([c, n]); }
  const styles = [], seen = new Set();
  for (let r = hi + 1; r < layoutRows.length; r++) {
    const row = layoutRows[r], k = cellStr(row[pc + 1]); if (!k) continue;
    const key = norm(k); if (seen.has(key)) continue; seen.add(key);
    const m = {}; for (const [c, n] of machCols) { const v = parseFloat(row[c]); if (v > 0) m[n] = v; }
    styles.push({ k, p: cellStr(row[pc]), m });
  }
  const mi = planRows.findIndex(r => r.some(c => norm(cellStr(c)) === 'module'));
  if (mi < 0) throw new Error('Plan tab: could not find a header row with "Module".');
  const mc = planRows[mi].findIndex(c => norm(cellStr(c)) === 'module');
  let di = -1;
  for (let r = mi; r < Math.min(mi + 4, planRows.length); r++) if (planRows[r].slice(mc + 1).filter(v => toDate(v)).length >= 3) { di = r; break; }
  if (di < 0) throw new Error('Plan tab: could not read dates. Format the date row as yyyy-mm-dd.');
  const dateCols = []; planRows[di].forEach((v, c) => { if (c > mc) { const d = toDate(v); if (d) dateCols.push([c, d]); } });
  const modules = [], plan = {};
  for (let r = di + 1; r < planRows.length; r++) {
    const row = planRows[r], mod = cellStr(row[mc]);
    if (!mod) { if (modules.length) break; else continue; }
    modules.push(mod); plan[mod] = {};
    for (const [c, d] of dateCols) { const s = cellStr(row[c]); if (s) plan[mod][d] = s; }
  }
  const inventory = {};
  if (invRows) {
    const ih = invRows.findIndex(r => norm(cellStr(r[0])) === 'machine');
    for (let r = ih + 1; ih >= 0 && r < invRows.length; r++) { const n = cellStr(invRows[r][0]), v = parseFloat(invRows[r][1]); if (n && !isNaN(v)) inventory[n] = v; }
  }
  return { dates: dateCols.map(x => x[1]).sort(), modules, plan, machines: machCols.map(x => x[1]), styles, inventory, source };
}

export function modelFromWorkbook(XLSX, wb, source, cfg) {
  const find = (want, alt) => {
    const n = wb.SheetNames.find(x => norm(x) === norm(want)) || wb.SheetNames.find(x => norm(x).includes(alt));
    return n ? XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null }) : null;
  };
  const L = find(cfg.layoutTab, 'layout'), P = find(cfg.planTab, 'plan'), I = find(cfg.inventoryTab, 'available');
  if (!L || !P) throw new Error('Could not find the Layout and Plan tabs in this workbook.');
  return buildModel(L, P, I, source);
}

export function compute(M) {
  const idx = new Map(); M.styles.forEach(s => { const k = norm(s.k); if (!idx.has(k)) idx.set(k, s); });
  const perDay = {}, total = {}, unmapped = {}, used = new Set();
  for (const d of M.dates) {
    const t = {};
    for (const mod of M.modules) {
      const st = M.plan[mod][d]; if (!st) continue; used.add(norm(st));
      const e = idx.get(norm(st));
      if (!e) { (unmapped[st] ||= []).push([mod, d]); continue; }
      for (const k in e.m) t[k] = (t[k] || 0) + e.m[k];
    }
    perDay[d] = t; total[d] = sumM(t);
  }
  return { idx, perDay, total, unmapped, used };
}

export function shortages(M, C) {
  const out = [];
  for (const m of M.machines) {
    const a = M.inventory[m]; if (a === undefined) continue;
    let pk = 0; M.dates.forEach(d => { pk = Math.max(pk, C.perDay[d][m] || 0); });
    if (pk > a) out.push({ m, a, pk });
  }
  return out;
}

export function visibleDates(M, range) {
  if (range === 'all') return M.dates;
  const t = todayStr();
  const from = M.dates.find(d => d >= t) ? t : M.dates[0];
  const end = dt(from); end.setDate(end.getDate() + 14);
  const e = ymd(end);
  return M.dates.filter(d => d >= from && d <= e);
}
